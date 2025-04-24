#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FUTBIN FUT25 – SCRAPER (schema fisso)
"""

from __future__ import annotations
import csv, re, time
from pathlib import Path
from typing import Dict, List

import cloudscraper, pandas as pd
from bs4 import BeautifulSoup, Tag

# ─────────── CONFIG
YEAR, BASE = "25", "https://www.futbin.com"
PLAYERS_URL = f"{BASE}/{YEAR}/players"
OUT_CSV     = "FutBinPlayers25.csv"
WAIT_S      = 1.0

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/123.0 Safari/537.36"),
    "Accept-Language": "en-US,en;q=0.9,it;q=0.8",
    "Referer": BASE + "/",
}

COLS = [
    "ID","Unnamed: 0","Rank","Name","OVR","PAC","SHO","PAS","DRI","DEF","PHY",
    "Acceleration","Sprint Speed","Positioning","Finishing","Shot Power",
    "Long Shots","Volleys","Penalties","Vision","Crossing",
    "Free Kick Accuracy","Short Passing","Long Passing","Curve","Dribbling",
    "Agility","Balance","Reactions","Ball Control","Composure",
    "Interceptions","Heading Accuracy","Def Awareness",
    "Standing Tackle","Sliding Tackle","Jumping","Stamina","Strength",
    "Aggression","Position","Weak foot","Skill moves","Preferred foot",
    "Height","Weight","Alternative positions","Age","Nation","League",
    "Team","play style","url","GK Diving","GK Handling","GK Kicking",
    "GK Positioning","GK Reflexes",
]

# ─────────── Cloudflare session
scraper = cloudscraper.create_scraper(
    browser={"browser":"chrome","platform":"windows","desktop":True}, delay=10)
scraper.headers.update(HEADERS)

# ─────────── helpers
def html(url:str)->BeautifulSoup:
    r=scraper.get(url,timeout=30)
    if r.status_code==403: raise RuntimeError("403 – Cloudflare")
    r.raise_for_status(); return BeautifulSoup(r.text,"lxml")

txt = lambda tag,d="": tag.get_text(" ",strip=True) if tag else d
num = lambda s: re.search(r"\d+",s).group() if re.search(r"\d+",s) else ""
def anchor_t(a:Tag|None)->str:
    if not a:return""
    if (img:=a.find("img")) and img.has_attr("title"): return img["title"]
    return a.get("title","")

MAP = {
    "Pace":"PAC","Shooting":"SHO","Passing":"PAS",
    "Defending":"DEF","Physicality":"PHY",
    "Att. Position":"Positioning","Heading Acc.":"Heading Accuracy",
    "Def. Aware":"Def Awareness","Stand Tackle":"Standing Tackle",
    "Slide Tackle":"Sliding Tackle","FK Acc.":"Free Kick Accuracy",
    "Short Pass":"Short Passing","Long Pass":"Long Passing",
}
GK_KEYS = {"GK Diving","GK Handling","GK Kicking","GK Positioning","GK Reflexes"}

# ─────────── LIST PAGE
def parse_row(tr:Tag)->tuple[str,dict,str]:
    a  = tr.select_one("a.table-player-name")
    link = BASE + a["href"]
    alt = re.sub(r"[+]", "", txt(tr.select_one("td.table-pos div.font-extra-small"))).strip()

    base = {
        "Name":txt(a),"OVR":txt(tr.select_one("div.player-rating-card-text")),
        "url":link,
        "PAC":txt(tr.select_one("td.table-pace .table-key-stats")),
        "SHO":txt(tr.select_one("td.table-shooting .table-key-stats")),
        "PAS":txt(tr.select_one("td.table-passing .table-key-stats")),
        "DRI":txt(tr.select_one("td.table-dribbling .table-key-stats")),
        "DEF":txt(tr.select_one("td.table-defending .table-key-stats")),
        "PHY":txt(tr.select_one("td.table-physicality .table-key-stats")),
        "Skill moves":num(txt(tr.select_one("td.table-skills"))),
        "Weak foot": num(txt(tr.select_one("td.table-weak-foot"))),
        "Position":  txt(tr.select_one("td.table-pos div.table-pos-main span")),
        "Alternative positions":alt,
        "Team":anchor_t(tr.select_one("a.table-player-club")),
        "League":anchor_t(tr.select_one("a.table-player-league")),
        "Nation":anchor_t(tr.select_one("a.table-player-nation")),
    }
    fid=re.search(r"/player/(\d+)/",link).group(1)
    return fid,base,link

# ─────────── DETAIL PAGE
def parse_detail(url:str)->Dict:
    s=html(url); d:Dict[str,str]={}

    # info table
    tbl=s.select_one("div.info-wrapper table")
    if tbl:
        for r in tbl.select("tr"):
            d[txt(r.th)]=txt(r.td)

    # normalize
    if "Height" in d and "|" in d["Height"]:
        cm,ft=[z.strip() for z in d["Height"].split("|")]
        d["Height"]=f"{cm} / {ft}"
    if "Weight" in d and not "kg" in d["Weight"]:
        kg=int(num(d["Weight"])); d["Weight"]=f"{kg}kg / {round(kg*2.20462)}lb"
    d["Preferred foot"]=d.get("Foot","")
    d["Age"]=num(d.get("Age",""))

    # playstyles
    ps=[]
    for ic in s.select("div.playStyle-table-icon"):
        name=txt(ic.select_one("div.slim-font"))
        plus=("psplus" in ic.get("class",[])) or (ic.find("img") and "/plus/" in ic.find("img")["src"])
        ps.append(name+("+" if plus else ""))
    d["play style"]=", ".join(ps)

    # stats rows
    for row in s.select("div.player-stat-row"):
        name=txt(row.select_one("div.player-stat-name"))
        vtag=row.select_one("div.player-stat-value")
        value=vtag.get("data-stat-value") or txt(vtag)
        if name=="Dribbling":
            stat_id=vtag.get("data-stat-id","")
            key="DRI" if stat_id=="4" else "Dribbling"
        else:
            key=MAP.get(name,name)
        d[key]=value

    for g in GK_KEYS: d.setdefault(g,"")
    return d

# ─────────── init CSV
if not Path(OUT_CSV).exists():
    Path(OUT_CSV).write_text(",".join(COLS)+"\n",encoding="utf-8")

# ─────────── MAIN
def main()->None:
    idx,page=0,1; seen=set()
    while True:
        soup=html(f"{PLAYERS_URL}?page={page}")
        trs=soup.select("tr.player-row")
        if not trs: break
        bloc=[]
        print(f"pagina {page} – {len(trs)} giocatori")
        for tr in trs:
            fid,base,link=parse_row(tr)
            if fid in seen: continue
            seen.add(fid)
            base["ID"]=base["Unnamed: 0"]=idx
            base["Rank"]=idx+1
            idx+=1
            time.sleep(WAIT_S)
            det=parse_detail(link)
            row={c:"" for c in COLS}
            for src in (base,det):
                for k,v in src.items():
                    row[MAP.get(k,k)]=v
            bloc.append(row)
        if bloc:
            pd.DataFrame(bloc)[COLS].to_csv(
                OUT_CSV,mode="a",header=False,index=False,quoting=csv.QUOTE_MINIMAL)
        page+=1; time.sleep(WAIT_S)
    print(f"\n✅ completato – righe totali: {idx}")

if __name__=="__main__":
    main()

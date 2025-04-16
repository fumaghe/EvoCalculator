import requests
import json
import re
from datetime import datetime
from bs4 import BeautifulSoup

BASE_URL = "https://www.fut.gg"

def get_evolution_urls():
    """
    Recupera la pagina principale delle evoluzioni e restituisce una lista di URL
    (completi) di tutte le evoluzioni.
    """
    url = BASE_URL + "/evolutions/"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Errore nel recupero della pagina principale: {response.status_code}")
    
    soup = BeautifulSoup(response.text, "html.parser")
    urls = set()
    # Gli URL delle evoluzioni si trovano nei tag <a> con href che iniziano per "/evolutions/" e contengono almeno un numero
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/evolutions/") and re.search(r'\d', href):
            # Rimuoviamo eventuali query string (ad es. ?only_expired=1)
            full_url = BASE_URL + href.split("?")[0]
            urls.add(full_url)
    return list(urls)

def parse_date_from_time_tag(time_tag):
    """
    Data una tag <time>, usa l'attributo datetime per ottenere la data nel formato YYYY-MM-DD.
    Se non è disponibile, restituisce la stringa vuota.
    """
    dt_str = time_tag.get("datetime", "")
    if dt_str:
        try:
            # Convertiamo in datetime; alcuni attributi potrebbero avere 'Z' che vanno sostituiti
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            return dt.strftime("%Y-%m-%d")
        except Exception as e:
            return ""
    return ""

def parse_level_upgrades(soup):
    """
    Estrae gli upgrade per ogni level e li restituisce come lista di upgrade, dove ogni upgrade è un dizionario.
    In questa versione gli upgrade vengono salvati come una lista di descrizioni.
    """
    level_upgrades = []
    for level_heading in soup.find_all(lambda tag: tag.name=="h2" and re.search(r"Level \d+", tag.get_text(), re.I)):
        m = re.search(r"Level (\d+)", level_heading.get_text())
        if not m:
            continue
        step_number = int(m.group(1))
        upgrades_section = level_heading.find_next(lambda tag: tag.name in ["div", "section"] and "Upgrades" in tag.get_text())
        descriptions = []
        if upgrades_section:
            ul = upgrades_section.find("ul")
            if ul:
                # Salva ogni <li> separatamente in una lista
                descriptions = [li.get_text(" ", strip=True) for li in ul.find_all("li")]
        level_upgrades.append({
            "step": step_number,
            "description": descriptions,  # lista delle descrizioni
            "effects": {}  # Placeholder per eventuali effetti
        })
    return level_upgrades


def parse_evolution_detail(url):
    """
    Accede alla pagina di dettaglio di un'evoluzione ed estrae le informazioni:
      - Dati in testa: cost, unlock_date, expires_on (usando i tag <time> con classe js-time-diff-app).
      - Requisiti (Requirements)
      - Total Upgrades
      - Challenges
      - Upgrade steps (per ogni livello "Level X")
      - Campi aggiuntivi come new_positions, playstyles_added, playstyles_plus_added, final_bonus
      - ID ed Name
    Restituisce un dizionario con la struttura finale.
    """
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Errore nel recupero della pagina {url}: {response.status_code}")
        return None
    soup = BeautifulSoup(response.text, "html.parser")
    
    evolution = {}
    
    # --- Dati in testa (date e costo) ---
    # Cerchiamo tutti i tag <time> con classe "js-time-diff-app"
    time_tags = soup.find_all("time", class_="js-time-diff-app")
    if len(time_tags) >= 2:
        evolution["unlock_date"] = parse_date_from_time_tag(time_tags[0])
        evolution["expires_on"]  = parse_date_from_time_tag(time_tags[1])
    else:
        evolution["unlock_date"] = ""
        evolution["expires_on"] = ""
    
    # Costo: nella sezione di header, cerchiamo il blocco con l'immagine coins.png
    coin_img = soup.find("img", src=lambda src: src and "coins.png" in src)
    if coin_img:
        cost_text = coin_img.find_next(string=True)
        evolution["cost"] = cost_text.strip() if cost_text else ""
    else:
        evolution["cost"] = ""
        
    # --- Requirements ---
    requirements = {}
    req_header = soup.find(lambda tag: tag.name in ["h2", "h3"] and re.search(r"Requirements", tag.get_text(), re.I))
    if req_header:
        req_list = req_header.find_next("ul")
        if req_list:
            for li in req_list.find_all("li"):
                spans = li.find_all("span")
                if len(spans) >= 2:
                    key = spans[0].get_text(strip=True)
                    value = spans[1].get_text(strip=True)
                    requirements[key] = value
    evolution["requirements"] = requirements
    
    # --- Total Upgrades ---
    total_upgrades = {}
    upgrades_header = soup.find(lambda tag: tag.name in ["h2", "h3"] and re.search(r"Total Upgrades", tag.get_text(), re.I))
    if upgrades_header:
        upgrades_list = upgrades_header.find_next("ul")
        if upgrades_list:
            for li in upgrades_list.find_all("li"):
                spans = li.find_all("span")
                if len(spans) >= 2:
                    key = spans[0].get_text(strip=True)
                    value = spans[1].get_text(strip=True)
                    total_upgrades[key] = value
    evolution["total_upgrades"] = total_upgrades
    
    # --- Challenges ---
    challenges = []
    challenges_header = soup.find(lambda tag: tag.name in ["h2", "h3"] and re.search(r"Challenges", tag.get_text(), re.I))
    if challenges_header:
        chal_list = challenges_header.find_next("ul")
        if chal_list:
            for li in chal_list.find_all("li"):
                challenges.append(li.get_text(strip=True))
    evolution["challenges"] = challenges

    # --- Upgrade Steps (Level upgrades) ---
    evolution["upgrades"] = parse_level_upgrades(soup)
    
    # --- Campi aggiuntivi (Placeholder) ---
    evolution["new_positions"] = []
    evolution["playstyles_added"] = []
    evolution["playstyles_plus_added"] = []
    evolution["final_bonus"] = {}
    
    # --- ID ed Name ---
    # L'ID lo ricaviamo dall'ultimo segmento dell'URL
    evolution["id"] = url.strip("/").split("/")[-1]
    # Per il name, proviamo prima con <h1>, altrimenti con il primo tag <h2> significativo
    title_tag = soup.find("h1")
    if title_tag:
        evolution["name"] = title_tag.get_text(strip=True)
    else:
        card_title = soup.find(lambda tag: tag.name in ["h2", "h3"] and tag.get_text(strip=True))
        evolution["name"] = card_title.get_text(strip=True) if card_title else ""
        
    evolution["url"] = url
    
    return evolution

def main():
    print("Recupero URL delle evoluzioni dalla pagina principale...")
    evo_urls = get_evolution_urls()
    print(f"Trovati {len(evo_urls)} URL.")
    
    evolutions = []
    for url in evo_urls:
        print(f"Elaboro {url} ...")
        evo_data = parse_evolution_detail(url)
        if evo_data:
            evolutions.append(evo_data)
    
    output_file = "evolutions_full.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(evolutions, f, ensure_ascii=False, indent=2)
        
    print(f"Dati di {len(evolutions)} evoluzioni salvati in {output_file}")

if __name__ == "__main__":
    main()

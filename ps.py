"""
pip install cloudscraper beautifulsoup4
"""

import re, os
from pathlib import Path
from urllib.parse import unquote

import cloudscraper              # <--- sostituisce requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.futbin.com/playstyles"
SAVE_DIR = Path("public/data/ps")
SAVE_DIR.mkdir(parents=True, exist_ok=True)    # crea tutta la tree

scraper = cloudscraper.create_scraper(          # header + challenge bypass
    browser={"custom": "Mozilla/5.0"}
)

def normalise_name(txt: str) -> str:
    return re.sub(r"\s+", "_", txt.strip())

def true_image_url(raw_src: str) -> str:
    prefix = "https://cdn2.futbin.com/"
    if raw_src.startswith(prefix):
        raw_src = unquote(raw_src[len(prefix):])
    return raw_src          # ora parte con https://cdn.futbin.com/…

def download(url: str, dest: Path) -> None:
    if dest.exists():
        return
    r = scraper.get(url, timeout=20)
    r.raise_for_status()
    dest.write_bytes(r.content)
    print("✔︎", dest.name)

def main() -> None:
    html  = scraper.get(BASE_URL, timeout=20).text
    soup  = BeautifulSoup(html, "html.parser")

    for img in soup.select("img.playstyle-logo"):
        alt = img.get("alt", "").strip()
        if not alt:
            continue

        src       = true_image_url(img["src"])
        base_name = normalise_name(alt)
        suffix    = "+" if "/plus/" in src else ""
        filename  = f"{base_name}{suffix}.png"

        download(src, SAVE_DIR / filename)

if __name__ == "__main__":
    main()

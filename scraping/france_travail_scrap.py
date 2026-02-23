import time
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd

BASE = "https://candidat.francetravail.fr"

KEYWORDS = [
    "data analyste", "business intelligence","machine learning", "intelligence artificiel", "data engineer","ia", "big data",
]

# ─────────────────────────────────────────────
# ÉTAPE 1 : Collecter les liens avec Selenium
# ─────────────────────────────────────────────
def collecter_liens(keywords):
    options = Options()
    options.add_argument("--headless")      # tourne en arrière-plan
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    tous_les_liens = set()  # set pour éviter les doublons automatiquement

    for kw in keywords:
        print(f"\n Recherche : {kw}")
        
        for start in range(0, 2000, 20):
            url = (
                f"{BASE}/offres/recherche"
                f"?motsCles={kw}&offresPartenaires=true"
                f"&range={start}-{start+19}&rayon=10&tri=0"
            )
            driver.get(url)
            time.sleep(2)

            soup = BeautifulSoup(driver.page_source, "html.parser")
            offers = soup.find_all("a", class_="media with-fav")

            if not offers:
                print(f"  → Fin à la page {start//20 + 1} pour : {kw}")
                break

            for a in offers:
                href = a.get("href")
                if href:
                    tous_les_liens.add(urljoin(BASE, href))

            print(f"  → Page {start//20 + 1} | Total liens : {len(tous_les_liens)}")

    driver.quit()
    print(f"\n Total liens collectés (sans doublons) : {len(tous_les_liens)}")
    return list(tous_les_liens)


# ─────────────────────────────────────────────
# ÉTAPE 2 : Parser chaque offre (ton 1er code)
# ─────────────────────────────────────────────
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def parse_offer(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code != 200:
            return None
        
        soup = BeautifulSoup(r.text, "html.parser")



    # --- Langues (peut y en avoir plusieurs) --- 
        languages = []
    # 1) section "Langues" avec une liste
        lang_title = soup.find(string=lambda t: t and "Langues" in t)
        if lang_title:
         parent = lang_title.find_parent()
         # Essayer une liste <ul>
         ul = parent.find_next("ul")
         if ul:
            for li in ul.find_all("li"):
                txt = li.get_text(" ", strip=True)
                if txt:
                    languages.append(txt)
         else:
            # Sinon, plusieurs <span class="skill-name">
            for span in parent.find_all("span", class_="skill-name"):
                txt = span.get_text(strip=True)
                if txt:
                    languages.append(txt)



    # 2) fallback ancien bloc "skill-langue"
        if not languages:
         lang_block = soup.find("span", class_="skill-langue")
         if lang_block:
            for span in lang_block.find_all("span", class_="skill-name"):
                txt = span.get_text(strip=True)
                if txt:
                    languages.append(txt)
 
           



        

        title_el   = soup.find("span", itemprop="title") or soup.find("h1")
        title      = title_el.get_text(strip=True) if title_el else ""

        location_el = soup.find("span", itemprop="name")
        location    = location_el.get_text(strip=True) if location_el else ""

        date_el    = soup.find("span", itemprop="datePosted")
        date_posted = date_el.get_text(strip=True) if date_el else ""

        contract = ""
        for dt in soup.find_all("dt"):
            if "Type de contrat" in dt.get_text():
                dd = dt.find_next_sibling("dd")
                contract = dd.get_text(strip=True) if dd else ""
                break

        exp_el     = soup.find("span", itemprop="experienceRequirements")
        experience = exp_el.get_text(strip=True) if exp_el else ""

        edu_el     = soup.find("span", itemprop="educationRequirements")
        education  = edu_el.get_text(strip=True) if edu_el else ""

        skills = [
            s.get_text(strip=True)
            for s in soup.find_all("span", itemprop="skills", class_="skill-name")
        ]

        emp_el   = soup.find("h3", class_="t4 title")
        employer = emp_el.get_text(strip=True) if emp_el else ""

        desc_el     = soup.find("div", itemprop="description")
        description = desc_el.get_text(strip=True) if desc_el else ""

        id_el = soup.find("span", itemprop="value")
        id_offre = id_el.get_text(strip=True) if id_el else ""

        qual_el = soup.find("span", itemprop="qualifications")
        qualification = qual_el.get_text(strip=True) if qual_el else ""

        ind_el = soup.find("span", itemprop="industry")
        industry = ind_el.get_text(strip=True) if ind_el else ""

            # --- Durée du travail ---
        work_time = ""
        for dt in soup.find_all("dt"):
            txt = dt.get_text(" ", strip=True)
            if "Durée du travail" in txt:
                dd = dt.find_next_sibling("dd")
                if dd:
                     work_time = dd.get_text(" ", strip=True)
                break

    # --- Salaire (texte du <li> sous baseSalary) ---
        salary = ""
        salary_span = soup.find("span", itemprop="baseSalary")
        if salary_span:
             ul = salary_span.find_next("ul")
             if ul:
                   li = ul.find("li")
                   salary = li.get_text(" ", strip=True) if li else ""

                  

        return {
            "id":           id_offre,
            "url":          url,
            "titre":        title,
            "localisation": location,
            "date":         date_posted,
            "contrat":      contract,
            "experience":   experience,
            "education":    education,
            "competences":  "; ".join(skills),
            "langues":      "; ".join(languages),
            "entreprise":   employer,
            "qualification": qualification,
            "industry":     industry,
            "work_time":    work_time,
            "salary":       salary,
            "description":  description,
        }

    except Exception as e:
        print(f"   Erreur sur {url} : {e}")
        return None


# ─────────────────────────────────────────────
# ÉTAPE 3 : Paralléliser le parsing
# ─────────────────────────────────────────────
def parser_toutes_offres(liens, max_workers=8):
    """
    ThreadPoolExecutor permet de parser plusieurs offres
    en même temps → beaucoup plus rapide
    """
    resultats = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(parse_offer, lien): lien for lien in liens}
        
        for i, future in enumerate(as_completed(futures)):
            data = future.result()
            if data:
                resultats.append(data)
            
            # afficher la progression
            if (i + 1) % 10 == 0:
                print(f"  → {i+1}/{len(liens)} offres parsées...")
    
    return resultats


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    
    # 1. Collecter les liens
    liens = collecter_liens(KEYWORDS)
    
    # Sauvegarde intermédiaire des liens (sécurité)
    pd.DataFrame(liens, columns=["url"]).to_excel(r"data/liks/france_travail_lien.xlsx", index=False)
    print(" Liens sauvegardés dans france_travail_lien.xlsx")
    
    # 2. Parser toutes les offres en parallèle
    print("\n Début du parsing des offres...")
    offres = parser_toutes_offres(liens, max_workers=8)
    
    # 3. Sauvegarder
    df = pd.DataFrame(offres)
    df.to_excel(r"data/raw/france_travail.xlsx", index=False)
    print(f"\n {len(offres)} offres sauvegardées dans france_travail.xlsx")
    
    
   
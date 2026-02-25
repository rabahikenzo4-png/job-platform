import pandas as pd
import re
import hashlib
import os
print("Dossier courant :", os.getcwd())
# ─────────────────────────────────────────────
# CHARGEMENT
# ─────────────────────────────────────────────
print("Chargement du fichier...")
df = pd.read_excel(r"data/raw/france_travail.xlsx")
print(f" {len(df)} offres chargées\n")

# ─────────────────────────────────────────────
# 1. NETTOYAGE COLONNE DATE
# "Actualisé le 20 février 2026" → "2026-02-20"
# ─────────────────────────────────────────────
print("  Nettoyage des dates...")

MOIS = {
    "janvier": "01", "février": "02", "mars": "03",
    "avril": "04", "mai": "05", "juin": "06",
    "juillet": "07", "août": "08", "septembre": "09",
    "octobre": "10", "novembre": "11", "décembre": "12"
}

def nettoyer_date(texte):
    if pd.isna(texte):
        return None
    match = re.search(r'(\d{1,2})\s+(\w+)\s+(\d{4})', str(texte))
    if match:
        jour, mois_texte, annee = match.groups()
        mois = MOIS.get(mois_texte.lower())
        if mois:
            return f"{annee}-{mois}-{int(jour):02d}"
    return None

df['date_propre']  = df['date'].apply(nettoyer_date)
df['statut_date']  = df['date'].apply(
    lambda x: 'actualisee' if 'Actualisé' in str(x) else 'publiee'
)
print(f"   → Dates converties : {df['date_propre'].notna().sum()}/{len(df)}")

# ─────────────────────────────────────────────
# 2. NETTOYAGE COLONNE CONTRAT
# "CDIContrat travail" → "CDI"
# ─────────────────────────────────────────────
print("\n Nettoyage des types de contrat...")

TYPES_CONTRAT = ['CDI', 'CDD', 'Intérim', 'Stage', 'Alternance', 'Profession libérale']

def extraire_type_contrat(texte):
    if pd.isna(texte):
        return "Non précisé"
    texte = str(texte)
    for t in TYPES_CONTRAT:
        if t.lower() in texte.lower():
            return t
    return texte.split('Contrat')[0].strip()

def extraire_duree_contrat(texte):
    if pd.isna(texte):
        return None
    match = re.search(r'(\d+)\s*Mois', str(texte))
    return f"{match.group(1)} mois" if match else None

df['type_contrat']  = df['contrat'].apply(extraire_type_contrat)
df['duree_contrat'] = df['contrat'].apply(extraire_duree_contrat)
print(f"   → {df['type_contrat'].value_counts().head(4).to_dict()}")

# ─────────────────────────────────────────────
# 3. NETTOYAGE COLONNE LOCALISATION
# "75 - Paris 1er Arrondissement" → ville="Paris", dept="75"
# ─────────────────────────────────────────────
print("\n Nettoyage de la localisation...")

def extraire_departement(texte):
    if pd.isna(texte):
        return None
    match = re.match(r'^(\d{2,3})', str(texte))
    return match.group(1) if match else None

def extraire_ville(texte):
    if pd.isna(texte):
        return "Non précisé"
    ville = re.sub(r'^\d{2,3}\s*-\s*', '', str(texte)).strip()
    ville = re.sub(r'\s*\d+e[mr]?\s*Arrondissement', '', ville, flags=re.IGNORECASE).strip()
    return ville

df['departement'] = df['localisation'].apply(extraire_departement)
df['ville']       = df['localisation'].apply(extraire_ville)
print(f"   → Top villes : {df['ville'].value_counts().head(4).to_dict()}")

# ─────────────────────────────────────────────
# 4. NETTOYAGE COLONNE EXPERIENCE
# ─────────────────────────────────────────────
print("\n Nettoyage de l'expérience...")

def normaliser_experience(texte):
    if pd.isna(texte):
        return "Non précisé"
    texte = str(texte).strip()
    if "Débutant" in texte:
        return "Débutant"
    if "Expérience exigée" in texte:
        return "Expérience exigée"
    match = re.search(r'(\d+)\s*An', texte)
    if match:
        return f"{match.group(1)} an(s)"
    return texte

df['experience_propre'] = df['experience'].apply(normaliser_experience)
print(f"   → {df['experience_propre'].value_counts().head(4).to_dict()}")

# ─────────────────────────────────────────────
# 5. NETTOYAGE DESCRIPTION
# CORRECTION : utiliser .replace() pour préserver les accents
# ─────────────────────────────────────────────
print("\n Nettoyage des descriptions...")

def nettoyer_texte(texte):
    if pd.isna(texte):
        return ""
    texte = str(texte)
    # supprimer balises HTML
    texte = re.sub(r'<[^>]+>', ' ', texte)
    # IMPORTANT : utiliser .replace() et non regex pour préserver les accents
    texte = texte.replace('\n', ' ').replace('\t', ' ').replace('\r', ' ')
    # supprimer espaces multiples
    texte = re.sub(r'\s+', ' ', texte)
    return texte.strip()

df['description_propre'] = df['description'].apply(nettoyer_texte)
print(f"   → Longueur moyenne : {df['description_propre'].str.len().mean():.0f} caractères")

# vérification rapide
print(f"\n    Test description :")
print(f"   {df['description_propre'].iloc[0][:150]}")

# ─────────────────────────────────────────────
# 6. VALEURS MANQUANTES
# ─────────────────────────────────────────────
print("\n Remplissage des valeurs manquantes...")

df['entreprise']    = df['entreprise'].fillna("Non précisé")
df['salary']        = df['salary'].fillna("Non précisé")
df['work_time']     = df['work_time'].fillna("Non précisé")
df['education']     = df['education'].fillna("Non précisé")
df['langues']       = df['langues'].fillna("Non précisé")
df['qualification'] = df['qualification'].fillna("Non précisé")
df['industry']      = df['industry'].fillna("Non précisé")
df['competences']   = df['competences'].fillna("")
print("   →  Fait")

# ─────────────────────────────────────────────
# 7. EXTRACTION COMPÉTENCES DEPUIS DESCRIPTION
# ─────────────────────────────────────────────
print("\n Extraction des compétences...")

SKILLS_DATA = [
    "python", "r", "sql", "spark", "hadoop", "tensorflow", "keras",
    "scikit-learn", "pandas", "numpy", "power bi", "powerbi", "tableau",
    "excel", "machine learning", "deep learning", "nlp", "computer vision",
    "azure", "aws", "gcp", "google cloud", "mongodb", "postgresql", "mysql",
    "docker", "kubernetes", "git", "github", "gitlab", "airflow", "databricks",
    "looker", "qlik", "sas", "matlab", "scala", "java", "javascript",
    "data visualization", "statistics", "statistiques", "bi", "etl",
    "data warehouse", "datalake", "big data", "mlops", "devops",
    "regression", "classification", "clustering", "forecasting",
    "time series", "api", "rest", "fastapi", "streamlit", "jupyter",
    "dbt", "kafka", "elasticsearch"
]

def extraire_skills(row):
    if row['competences'] and len(str(row['competences'])) > 5:
        return str(row['competences'])
    texte = (str(row['description_propre']) + " " + str(row['titre'])).lower()
    skills = [s for s in SKILLS_DATA if s in texte]
    return "; ".join(skills)

df['competences_extraites'] = df.apply(extraire_skills, axis=1)
avec_skills = (df['competences_extraites'] != "").sum()
print(f"   → Offres avec compétences : {avec_skills}/{len(df)}")

# ─────────────────────────────────────────────
# 8. ID A CHANGER  NOUVEAUX ID = (ID+SOURCE)
# ─────────────────────────────────────────────
df['id'] = df['id'].astype(str) + '_france_travail'

# ─────────────────────────────────────────────
# 9. DATASET FINAL
# ─────────────────────────────────────────────
print("\n  Construction du dataset final...")

df_final = pd.DataFrame({
    'id':               df['id'],
    'url':              df['url'],
    'titre':            df['titre'],
    'entreprise':       df['entreprise'],
    'ville':            df['ville'],
    'departement':      df['departement'],
    'date_publication': df['date_propre'],
    'statut_date':      df['statut_date'],
    'type_contrat':     df['type_contrat'],
    'duree_contrat':    df['duree_contrat'],
    'experience':       df['experience_propre'],
    'education':        df['education'],
    'work_time':        df['work_time'],
    'salary':           df['salary'],
    'competences':      df['competences_extraites'],
    'langues':          df['langues'],
    'industry':         df['industry'],
    'qualification':    df['qualification'],
    'description':      df['description_propre'],
    'statut':           'active',
    'source':           'france_travail',
})

# ─────────────────────────────────────────────
# 10. RAPPORT FINAL
# ─────────────────────────────────────────────
print("\n" + "="*50)
print(" RAPPORT DE NETTOYAGE")
print("="*50)
print(f"Offres totales          : {len(df_final)}")
print(f"Doublons sur id         : {df_final['id'].duplicated().sum()}")

missing = df_final.isnull().sum()
missing = missing[missing > 0]
if len(missing) > 0:
    print(f"\nValeurs manquantes :")
    for col, val in missing.items():
        print(f"  {col:25s} : {val} ({val/len(df_final)*100:.1f}%)")

print(f"\nTop villes :")
print(df_final['ville'].value_counts().head(5).to_string())

print(f"\nTop contrats :")
print(df_final['type_contrat'].value_counts().head(4).to_string())

# ─────────────────────────────────────────────
# SAUVEGARDE
# ─────────────────────────────────────────────
df_final.to_excel(r"data/processed/clean_france_travail.xlsx", index=False)
print(f"\n Fichier sauvegardé : clean_france_travail.xlsx")
print(f"   {len(df_final)} offres | {len(df_final.columns)} colonnes")


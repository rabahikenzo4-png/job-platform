import os
import math
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ─────────────────────────────────────────────
# CONNEXION SUPABASE
# ─────────────────────────────────────────────
load_dotenv()
client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# ─────────────────────────────────────────────
# MODÈLE NLP
# téléchargement automatique au premier lancement (~90MB)
# ─────────────────────────────────────────────
print(" Chargement du modèle NLP...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print(" Modèle chargé\n")

# ─────────────────────────────────────────────
# TABLE : compétences → titres de postes
# utilisée pour suggérer un titre à l'utilisateur
# ─────────────────────────────────────────────
COMPETENCES_VERS_METIERS = {
    "Data Scientist": [
        "python", "machine learning", "deep learning", "scikit-learn",
        "tensorflow", "keras", "statistics", "statistiques", "nlp",
        "jupyter", "pandas", "numpy"
    ],
    "Data Analyst": [
        "sql", "excel", "power bi", "tableau", "python", "statistics",
        "statistiques", "data visualization", "looker", "qlik"
    ],
    "Data Engineer": [
        "python", "sql", "spark", "hadoop", "airflow", "kafka",
        "docker", "aws", "azure", "gcp", "etl", "dbt",
        "postgresql", "mongodb", "databricks"
    ],
    "ML Engineer": [
        "python", "machine learning", "deep learning", "tensorflow",
        "keras", "docker", "kubernetes", "mlops", "git", "api"
    ],
    "Business Intelligence": [
        "power bi", "tableau", "sql", "excel", "looker", "qlik",
        "data visualization", "bi", "sas"
    ],
    "Data Architect": [
        "sql", "spark", "hadoop", "aws", "azure", "gcp",
        "data warehouse", "datalake", "big data", "etl", "databricks"
    ],
    "NLP Engineer": [
        "python", "nlp", "tensorflow", "keras", "deep learning",
        "scikit-learn", "jupyter", "machine learning"
    ],
    "Cloud Data Engineer": [
        "aws", "azure", "gcp", "docker", "kubernetes", "spark",
        "airflow", "kafka", "databricks", "git"
    ],
}

# ─────────────────────────────────────────────
# FONCTION 1 : Suggérer des titres de postes
# selon les compétences cochées
# ─────────────────────────────────────────────
def suggerer_titres(competences_utilisateur: list) -> list:
    """
    Entrée  : liste de compétences ex: ["python", "sql", "machine learning"]
    Sortie  : liste de titres triés par score ex: ["Data Scientist (85%)", ...]
    """
    competences_lower = [c.lower() for c in competences_utilisateur]
    suggestions = []

    for metier, skills_requis in COMPETENCES_VERS_METIERS.items():
        # compter combien de skills requis l'utilisateur possède
        skills_matchés = [s for s in skills_requis if s in competences_lower]
        score = len(skills_matchés) / len(skills_requis) * 100

        if score >= 30:  # suggérer si au moins 30% des skills correspondent
            suggestions.append({
                "titre":         metier,
                "score":         round(score, 1),
                "skills_matchés": skills_matchés,
                "skills_manquants": [s for s in skills_requis if s not in competences_lower]
            })

    # trier par score décroissant
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return suggestions


# ─────────────────────────────────────────────
# FONCTION 2 : Construire le texte du profil
# pour le matching NLP
# ─────────────────────────────────────────────
def construire_profil_texte(profil: dict) -> str:
    """
    Convertit le profil utilisateur en texte
    pour que le modèle NLP puisse le comparer aux offres
    """
    parties = []

    if profil.get("titre_poste"):
        parties.append(f"Poste recherché : {profil['titre_poste']}")

    if profil.get("competences"):
        parties.append(f"Compétences : {', '.join(profil['competences'])}")

    if profil.get("experience"):
        parties.append(f"Expérience : {profil['experience']}")

    if profil.get("niveau_etudes"):
        parties.append(f"Niveau d'études : {profil['niveau_etudes']}")

    if profil.get("ville"):
        parties.append(f"Ville : {profil['ville']}")

    return " | ".join(parties)


# ─────────────────────────────────────────────
# FONCTION 3 : Charger les offres depuis Supabase
# ─────────────────────────────────────────────
def charger_offres(ville: str = None, type_contrat: str = None) -> pd.DataFrame:
    """
    Charge les offres actives depuis Supabase
    avec filtres optionnels sur ville et type de contrat
    """
    print("📥 Chargement des offres depuis Supabase...")

    query = client.table("offres").select(
        "id, titre, entreprise, ville, experience, type_contrat, "
        "competences, description, url, salary, date_publication"
    ).eq("statut", "active")

    # filtre optionnel sur la ville
    if ville:
        query = query.ilike("ville", f"%{ville}%")

    # filtre optionnel sur le type de contrat
    if type_contrat and type_contrat != "Tous":
        query = query.eq("type_contrat", type_contrat)

    # Supabase limite à 1000 par requête → paginer
    toutes_offres = []
    offset = 0
    while True:
        result = query.range(offset, offset + 999).execute()
        if not result.data:
            break
        toutes_offres.extend(result.data)
        if len(result.data) < 1000:
            break
        offset += 1000

    df = pd.DataFrame(toutes_offres)
    print(f" {len(df)} offres chargées")
    return df


# ─────────────────────────────────────────────
# FONCTION 4 : Construire le texte de chaque offre
# ─────────────────────────────────────────────
def construire_texte_offre(row) -> str:
    """
    Combine titre + compétences + description pour le matching
    """
    parties = []

    if row.get("titre"):
        parties.append(row["titre"])

    if row.get("competences"):
        parties.append(row["competences"])

    if row.get("description"):
        # prendre les 500 premiers caractères de la description
        parties.append(str(row["description"])[:500])

    return " ".join(parties)


# ─────────────────────────────────────────────
# FONCTION 5 : MATCHING PRINCIPAL
# ─────────────────────────────────────────────
def matcher_offres(profil: dict, top_n: int = 10) -> list:
    """
    Entrée  : profil utilisateur (dict)
    Sortie  : liste des top N offres les plus pertinentes
    """

    # 1. charger les offres avec filtres optionnels
    df_offres = charger_offres(
        ville=profil.get("ville"),
        type_contrat=profil.get("type_contrat")
    )

    if df_offres.empty:
        print("  Aucune offre trouvée avec ces filtres")
        return []

    # 2. construire le texte du profil
    texte_profil = construire_profil_texte(profil)
    print(f"\n Profil : {texte_profil}")

    # 3. construire les textes des offres
    textes_offres = df_offres.apply(construire_texte_offre, axis=1).tolist()

    # 4. calculer les embeddings
    print("\n  Calcul des embeddings...")
    embedding_profil  = model.encode([texte_profil])
    embeddings_offres = model.encode(textes_offres, batch_size=64, show_progress_bar=True)

    # 5. calculer la similarité cosinus
    scores = cosine_similarity(embedding_profil, embeddings_offres)[0]

    # 6. ajouter les scores au dataframe
    df_offres["score_nlp"] = scores
    df_offres["score_pct"] = (scores * 100).round(1)

    # 7. BONUS : booster le score si l'expérience correspond
    def booster_experience(row):
        score = row["score_nlp"]
        exp_offre = str(row.get("experience", "")).lower()
        exp_user  = str(profil.get("experience", "")).lower()

        if exp_user == "débutant" and "débutant" in exp_offre:
            score *= 1.1
        elif exp_user in exp_offre:
            score *= 1.05

        return min(score, 1.0)  # max 100%

    df_offres["score_final"] = df_offres.apply(booster_experience, axis=1)
    df_offres["score_final_pct"] = (df_offres["score_final"] * 100).round(1)

    # 8. trier et retourner le top N
    df_top = df_offres.nlargest(top_n, "score_final")

    resultats = []
    for _, row in df_top.iterrows():
        resultats.append({
            "id":           row["id"],
            "titre":        row["titre"],
            "entreprise":   row.get("entreprise", "Non précisé"),
            "ville":        row.get("ville", ""),
            "experience":   row.get("experience", ""),
            "type_contrat": row.get("type_contrat", ""),
            "salary":       row.get("salary", "Non précisé"),
            "url":          row.get("url", ""),
            "score":        row["score_final_pct"],
            "date":         row.get("date_publication", ""),
        })

    return resultats


# ─────────────────────────────────────────────
# TEST DU SYSTÈME
# ─────────────────────────────────────────────
if __name__ == "__main__":

    # ── Étape 1 : Simuler un utilisateur qui ne sait pas son titre ──
    print("=" * 60)
    print("ÉTAPE 1 — Suggestion de titres de postes")
    print("=" * 60)

    competences_user = ["python", "sql", "machine learning", "pandas", "scikit-learn", "jupyter"]
    print(f"Compétences cochées : {competences_user}\n")

    suggestions = suggerer_titres(competences_user)
    print("Titres suggérés :")
    for s in suggestions:
        print(f"  → {s['titre']:30s} | Score : {s['score']}%")
        print(f"     Skills matchés   : {s['skills_matchés']}")
        print(f"     Skills manquants : {s['skills_manquants'][:3]}")
        print()

    # ── Étape 2 : Matching avec le profil complet ──
    print("=" * 60)
    print("ÉTAPE 2 — Matching des offres")
    print("=" * 60)

    profil_utilisateur = {
        "titre_poste":   "Data Scientist",   # peut être vide ""
        "competences":   competences_user,
        "experience":    "2 an(s)",
        "niveau_etudes": "Master",
        "ville":         "Paris",            # peut être vide ""
        "type_contrat":  "CDI",              # peut être "Tous"
    }

    resultats = matcher_offres(profil_utilisateur, top_n=10)

    print(f"\n Top 10 offres recommandées :\n")
    for i, offre in enumerate(resultats, 1):
        print(f"{i:2}. [{offre['score']}%] {offre['titre']}")
        print(f"      {offre['entreprise']} |  {offre['ville']}")
        print(f"      {offre['type_contrat']} |  {offre['experience']}")
        print(f"      {offre['salary']}")
        print(f"      {offre['url']}")
        print()
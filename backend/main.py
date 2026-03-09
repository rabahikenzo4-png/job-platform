from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter, defaultdict
import numpy as np
import bcrypt
import json
import os
import re

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SECRET_KEY   = os.getenv("SECRET_KEY", "emploitic_secret_key_2026")
ALGORITHM    = "HS256"
TOKEN_EXPIRE = 60 * 24 * 7

bearer   = HTTPBearer()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ─────────────────────────────────────────────
# MODÈLE NLP — chargé UNE SEULE FOIS
# ─────────────────────────────────────────────
print("⏳ Chargement du modèle NLP...")
nlp_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("✅ Modèle NLP prêt !")

# ─────────────────────────────────────────────
# CACHE EMBEDDINGS — chargé depuis fichiers
# ─────────────────────────────────────────────
try:
    cache_embeddings = np.load(os.path.join(BASE_DIR, "embeddings.npy"))
    with open(os.path.join(BASE_DIR, "offres_cache.json"), "r", encoding="utf-8") as f:
        cache_offres = json.load(f)
    print(f"✅ {len(cache_offres)} offres chargées depuis le cache !")
except Exception as e:
    print(f"⚠️ Cache introuvable — lance calcul_embeddings.py d'abord ! ({e})")
    cache_embeddings = None
    cache_offres     = []

# ─────────────────────────────────────────────
# CONNEXION SUPABASE — fraîche après le cache
# ─────────────────────────────────────────────
client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─────────────────────────────────────────────
# UTILITAIRE — récupérer TOUTES les lignes
# ─────────────────────────────────────────────
def fetch_all(columns: str, filters: dict = {}, extra_filters: list = []):
    """Récupère TOUTES les offres actives en paginant par 1000"""
    all_data  = []
    page      = 0
    page_size = 1000

    while True:
        query = client.table("offres").select(columns)
        for col, val in filters.items():
            query = query.eq(col, val)
        for f in extra_filters:
            query = query.gte(f["col"], f["val"])
        result = query.range(page * page_size, (page + 1) * page_size - 1).execute()

        if not result.data:
            break
        all_data.extend(result.data)
        if len(result.data) < page_size:
            break
        page += 1

    return all_data

# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────
app = FastAPI(title="Emploitic API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# MODÈLES PYDANTIC
# ─────────────────────────────────────────────
class RegisterModel(BaseModel):
    nom: str
    email: str
    password: str
    ville: str = ""
    niveau_etudes: str = ""
    experience: str = ""
    competences: str = ""
    titre_poste: str = ""
    type_contrat: str = ""

class LoginModel(BaseModel):
    email: str
    password: str

# ─────────────────────────────────────────────
# UTILITAIRES AUTH
# ─────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    expire  = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        token   = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email   = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        return {"id": user_id, "email": email}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message":         "Emploitic API fonctionne ",
        "offres_indexees":  len(cache_offres),
        "cache_pret":       cache_embeddings is not None,
    }

@app.post("/auth/register")
def register(data: RegisterModel):
    existing = client.table("utilisateurs").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    password_hash = hash_password(data.password)
    result = client.table("utilisateurs").insert({
        "nom":           data.nom,
        "email":         data.email,
        "password_hash": password_hash,
        "ville":         data.ville,
        "niveau_etudes": data.niveau_etudes,
        "experience":    data.experience,
        "competences":   data.competences,
        "titre_poste":   data.titre_poste,
        "type_contrat":  data.type_contrat,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Erreur lors de l'inscription")

    user  = result.data[0]
    token = create_token(str(user["id"]), user["email"])
    return {"token": token, "user": {"id": user["id"], "nom": user["nom"], "email": user["email"]}}

@app.post("/auth/login")
def login(data: LoginModel):
    result = client.table("utilisateurs").select("*").eq("email", data.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    user = result.data[0]
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    client.table("utilisateurs").update({
        "derniere_connexion": datetime.utcnow().isoformat()
    }).eq("id", user["id"]).execute()

    token = create_token(str(user["id"]), user["email"])
    return {
        "token": token,
        "user": {
            "id":            user["id"],
            "nom":           user["nom"],
            "email":         user["email"],
            "ville":         user.get("ville"),
            "niveau_etudes": user.get("niveau_etudes"),
            "experience":    user.get("experience"),
            "competences":   user.get("competences"),
            "titre_poste":   user.get("titre_poste"),
        }
    }

@app.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    result = client.table("utilisateurs").select("*").eq("id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    user = result.data[0]
    user.pop("password_hash", None)
    return user

@app.put("/auth/profile")
def update_profile(data: dict, current_user: dict = Depends(get_current_user)):
    data.pop("password_hash", None)
    data.pop("id", None)
    data.pop("email", None)
    client.table("utilisateurs").update(data).eq("id", current_user["id"]).execute()
    return {"message": "Profil mis à jour "}

# ─────────────────────────────────────────────
# OFFRES
# ─────────────────────────────────────────────
@app.get("/offres")
def get_offres(
    q:            str = Query(None),
    ville:        str = Query(None),
    type_contrat: str = Query(None),
    experience:   str = Query(None),
    page:         int = Query(1),
    limit:        int = Query(20),
):
    query = client.table("offres")\
        .select("id, titre, entreprise, ville, type_contrat, experience, salary, date_publication, competences, url")\
        .eq("statut", "active")

    if ville:                                   query = query.ilike("ville", f"%{ville}%")
    if type_contrat and type_contrat != "Tous": query = query.eq("type_contrat", type_contrat)
    if experience and experience != "Tous":     query = query.ilike("experience", f"%{experience}%")
    if q:                                       query = query.ilike("titre", f"%{q}%")

    count_query = client.table("offres").select("id", count="exact").eq("statut", "active")
    if ville:                                   count_query = count_query.ilike("ville", f"%{ville}%")
    if type_contrat and type_contrat != "Tous": count_query = count_query.eq("type_contrat", type_contrat)
    if experience and experience != "Tous":     count_query = count_query.ilike("experience", f"%{experience}%")
    if q:                                       count_query = count_query.ilike("titre", f"%{q}%")

    total  = count_query.execute().count
    offset = (page - 1) * limit
    result = query.order("date_publication", desc=True).range(offset, offset + limit - 1).execute()

    return {"offres": result.data, "page": page, "limit": limit, "total": total}

@app.get("/offres/stats")
def get_stats():
    total    = client.table("offres").select("id", count="exact").eq("statut", "active").execute()
    expirees = client.table("offres").select("id", count="exact").eq("statut", "expiree").execute()

    top_villes_res = client.table("stats_villes").select("*").execute()
    top_villes     = [{"ville": r["ville"], "count": r["total"]} for r in top_villes_res.data]

    contrats_data = client.table("offres").select("type_contrat").eq("statut", "active").execute()
    contrats = {}
    for o in contrats_data.data:
        c = o.get("type_contrat", "Non précisé")
        contrats[c] = contrats.get(c, 0) + 1

    aujourd_hui = datetime.utcnow().strftime("%Y-%m-%d")
    nouvelles = client.table("offres").select("id", count="exact")\
        .eq("statut", "active")\
        .gte("date_scraping", f"{aujourd_hui}T00:00:00")\
        .lt("date_scraping",  f"{aujourd_hui}T23:59:59")\
        .execute()

    return {
        "total_actives":  total.count,
        "total_expirees": expirees.count,
        "nouvelles_hoje": nouvelles.count,
        "top_villes":     top_villes,
        "contrats":       contrats,
    }

@app.get("/offres/{offre_id}")
def get_offre(offre_id: str):
    result = client.table("offres").select("*").eq("id", offre_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    return result.data[0]

# ─────────────────────────────────────────────
# MATCHING
# ─────────────────────────────────────────────
matching_results = {}

def run_matching(user_id: str, user: dict):
    try:
        print(f" Matching démarré pour {user_id}")
        matching_results[user_id] = {"statut": "en_cours"}

        if cache_embeddings is None or len(cache_offres) == 0:
            print(" Cache vide !")
            matching_results[user_id] = {"statut": "erreur", "message": "Cache non disponible"}
            return

        print(f" Cache OK — {len(cache_offres)} offres")

        profil_texte = f"{user.get('titre_poste', '')} | {user.get('competences', '')} | {user.get('experience', '')} | {user.get('niveau_etudes', '')}"
        print(f" Profil : {profil_texte[:100]}")

        print("⏳ Encodage du profil...")
        emb_profil = nlp_model.encode([profil_texte])
        print(" Encodage terminé")

        scores      = cosine_similarity(emb_profil, cache_embeddings)[0]
        top_indices = np.argsort(scores)[::-1][:10]

        resultats = []
        for i in top_indices:
            o = cache_offres[i]
            resultats.append({
                "id":           o["id"],
                "titre":        o["titre"],
                "entreprise":   o.get("entreprise", ""),
                "ville":        o.get("ville", ""),
                "type_contrat": o.get("type_contrat", ""),
                "experience":   o.get("experience", ""),
                "salary":       o.get("salary", ""),
                "url":          o.get("url", ""),
                "score":        round(float(scores[i]) * 100, 1),
            })

        print(f" Matching terminé — {len(resultats)} résultats")
        matching_results[user_id] = {"statut": "termine", "resultats": resultats}

    except Exception as e:
        print(f" ERREUR : {e}")
        import traceback
        traceback.print_exc()
        matching_results[user_id] = {"statut": "erreur", "message": str(e)}

@app.post("/matching/lancer")
def lancer_matching(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    user_result = client.table("utilisateurs").select("*").eq("id", current_user["id"]).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    user = user_result.data[0]
    matching_results[current_user["id"]] = {"statut": "en_cours"}
    background_tasks.add_task(run_matching, current_user["id"], user)
    return {"message": "Matching lancé "}

@app.get("/matching/statut")
def statut_matching(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if user_id not in matching_results:
        return {"statut": "aucun"}
    return matching_results[user_id]

@app.post("/matching/recharger-cache")
def recharger_cache(current_user: dict = Depends(get_current_user)):
    global cache_embeddings, cache_offres
    try:
        cache_embeddings = np.load(os.path.join(BASE_DIR, "embeddings.npy"))
        with open(os.path.join(BASE_DIR, "offres_cache.json"), "r", encoding="utf-8") as f:
            cache_offres = json.load(f)
        return {"message": f"Cache rechargé — {len(cache_offres)} offres indexées "}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur rechargement cache : {e}")

# ─────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────

@app.get("/analytics/evolution")
def analytics_evolution():
    """Offres publiées par mois — TOUTES les données"""
    offres = fetch_all(
        "date_publication",
        {"statut": "active"},
        [{"col": "date_publication", "val": "2025-01-01"}]
    )
    print(f"📊 Evolution — {len(offres)} offres analysées")

    mois_count = Counter()
    for o in offres:
        dp = o.get("date_publication")
        if dp:
            mois_count[dp[:7]] += 1

    evolution = [{"mois": k, "count": v} for k, v in sorted(mois_count.items())]
    return {"evolution": evolution, "total": len(offres)}


@app.get("/analytics/contrats")
def analytics_contrats():
    """Répartition types de contrat — TOUTES les données"""
    offres = fetch_all("type_contrat", {"statut": "active"})
    print(f"📊 Contrats — {len(offres)} offres analysées")

    counts = Counter()
    for o in offres:
        c = o.get("type_contrat") or "Non précisé"
        counts[c] += 1

    total    = sum(counts.values())
    contrats = [
        {"type": k, "count": v, "pct": round(v / total * 100, 1)}
        for k, v in counts.most_common()
        if k != "Non précisé"
    ]
    return {"contrats": contrats, "total": total}


@app.get("/analytics/competences")
def analytics_competences():
    """Top 20 compétences — TOUTES les données"""
    offres = fetch_all("competences", {"statut": "active"})
    print(f"📊 Compétences — {len(offres)} offres analysées")

    counts = Counter()
    for o in offres:
        comp = o.get("competences") or ""
        if comp and comp != "Non précisé":
            for c in comp.split(";"):
                c = c.strip().lower()
                if c and len(c) > 1:
                    counts[c] += 1

    top = [{"competence": k, "count": v} for k, v in counts.most_common(20)]
    return {"competences": top, "total_offres": len(offres)}


@app.get("/analytics/salaires")
def analytics_salaires():
    """Salaires — TOUTES les données"""
    offres = fetch_all("salary, type_contrat", {"statut": "active"})
    print(f"📊 Salaires — {len(offres)} offres analysées")

    def extraire_salaire(s):
        if not s or s == "Non précisé":
            return None
        nombres = re.findall(r'\d[\d\s]*(?:,\d+)?', s.replace('\xa0', ''))
        valeurs = []
        for n in nombres:
            try:
                v = float(n.replace(' ', '').replace(',', '.'))
                if 10000 < v < 200000:
                    valeurs.append(v)
            except:
                pass
        return sum(valeurs) / len(valeurs) if valeurs else None

    par_contrat  = defaultdict(list)
    distribution = []

    for o in offres:
        sal = extraire_salaire(o.get("salary"))
        if sal:
            distribution.append(sal)
            tc = o.get("type_contrat") or "Autre"
            par_contrat[tc].append(sal)

    moyenne_contrat = [
        {"type": k, "moyenne": round(sum(v) / len(v))}
        for k, v in par_contrat.items() if v
    ]

    tranches = [
        {"tranche": "< 25k",  "count": sum(1 for s in distribution if s < 25000)},
        {"tranche": "25-35k", "count": sum(1 for s in distribution if 25000 <= s < 35000)},
        {"tranche": "35-45k", "count": sum(1 for s in distribution if 35000 <= s < 45000)},
        {"tranche": "45-55k", "count": sum(1 for s in distribution if 45000 <= s < 55000)},
        {"tranche": "55-70k", "count": sum(1 for s in distribution if 55000 <= s < 70000)},
        {"tranche": "> 70k",  "count": sum(1 for s in distribution if s >= 70000)},
    ]

    return {
        "par_contrat":        moyenne_contrat,
        "tranches":           tranches,
        "total_avec_salaire": len(distribution),
        "total_offres":       len(offres),
        "moyenne_generale":   round(sum(distribution) / len(distribution)) if distribution else 0,
    }


@app.get("/analytics/experience")
def analytics_experience():
    """Expérience requise — TOUTES les données"""
    offres = fetch_all("experience", {"statut": "active"})
    print(f"📊 Expérience — {len(offres)} offres analysées")

    counts = Counter()
    for o in offres:
        e = o.get("experience") or "Non précisé"
        counts[e] += 1

    total = sum(counts.values())
    data  = [
        {"niveau": k, "count": v, "pct": round(v / total * 100, 1)}
        for k, v in counts.most_common()
        if k != "Non précisé"
    ]
    return {"experience": data, "total": total}
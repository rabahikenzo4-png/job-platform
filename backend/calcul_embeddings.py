from sentence_transformers import SentenceTransformer
from supabase import create_client
from dotenv import load_dotenv
import numpy as np
import json
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_all_offres():
    all_data  = []
    page      = 0
    page_size = 1000
    while True:
        result = client.table("offres")\
            .select("id, titre, entreprise, ville, type_contrat, experience, salary, url, competences, description")\
            .eq("statut", "active")\
            .range(page * page_size, (page + 1) * page_size - 1)\
            .execute()
        if not result.data:
            break
        all_data.extend(result.data)
        print(f"  Page {page + 1} - {len(all_data)} offres recuperees...")
        if len(result.data) < page_size:
            break
        page += 1
    return all_data

print("Chargement de toutes les offres depuis Supabase...")
offres = fetch_all_offres()
print(f"{len(offres)} offres chargees")

print("Calcul des embeddings...")
model  = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
textes = [
    f"{o.get('titre', '')} {o.get('competences', '')} {str(o.get('description', ''))[:300]}"
    for o in offres
]

embeddings = model.encode(textes, batch_size=64, show_progress_bar=True)

base_dir = os.path.dirname(os.path.abspath(__file__))
np.save(os.path.join(base_dir, "embeddings.npy"), embeddings)
with open(os.path.join(base_dir, "offres_cache.json"), "w", encoding="utf-8") as f:
    json.dump(offres, f, ensure_ascii=False)

print(f"Embeddings sauvegardes ! ({len(offres)} offres indexees)")
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
import os
import math

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

print(" Chargement du fichier nettoyé...")
df = pd.read_excel(r"data/processed/clean_france_travail.xlsx")
print(f" {len(df)} offres chargées")

# dédoublonner uniquement sur l'id officiel
avant = len(df)
df = df.drop_duplicates(subset=["id"], keep="first")
print(f" Doublons supprimés : {avant - len(df)}")
print(f" Offres à importer  : {len(df)}")

def preparer_ligne(row):
    def clean(val):
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return None
        s = str(val).strip()
        return s if s != "" else None

    return {
        "id":               clean(row.get("id")),
        "hash_offre":       clean(row.get("hash_offre")),
        "url":              clean(row.get("url")),
        "titre":            clean(row.get("titre")),
        "entreprise":       clean(row.get("entreprise")),
        "ville":            clean(row.get("ville")),
        "departement":      clean(row.get("departement")),
        "date_publication": clean(row.get("date_publication")),
        "date_expiration":  None,
        "statut_date":      clean(row.get("statut_date")),
        "type_contrat":     clean(row.get("type_contrat")),
        "duree_contrat":    clean(row.get("duree_contrat")),
        "experience":       clean(row.get("experience")),
        "education":        clean(row.get("education")),
        "work_time":        clean(row.get("work_time")),
        "salary":           clean(row.get("salary")),
        "competences":      clean(row.get("competences")),
        "langues":          clean(row.get("langues")),
        "industry":         clean(row.get("industry")),
        "qualification":    clean(row.get("qualification")),
        "description":      clean(row.get("description")),
        "statut":           "active",
        "source":           "france_travail",
    }

# ─────────────────────────────────────────────
# IMPORT PAR BATCH
# ─────────────────────────────────────────────
print("\ Début de l'import dans Supabase...")

BATCH_SIZE = 50
total      = len(df)
importees  = 0
doublons   = 0
reactivees = 0
erreurs    = 0

for i in range(0, total, BATCH_SIZE):
    batch_df = df.iloc[i:i + BATCH_SIZE]

    batch_data = [preparer_ligne(row) for _, row in batch_df.iterrows()]
    batch_data = [r for r in batch_data if r["id"] is not None]

    seen_ids = set()
    batch_unique = []
    for r in batch_data:
        if r["id"] not in seen_ids:
            seen_ids.add(r["id"])
            batch_unique.append(r)

    try:
        client.table("offres").insert(
            batch_unique,
            returning="minimal"
        ).execute()
        importees += len(batch_unique)

    except Exception as e:
        msg = str(e)
        if "duplicate" in msg.lower() or "23505" in msg:
            # insérer une par une pour gérer chaque cas
            for r in batch_unique:
                try:
                    client.table("offres").insert(r, returning="minimal").execute()
                    importees += 1

                except Exception as e2:
                    msg2 = str(e2)
                    if "duplicate" in msg2.lower() or "23505" in msg2:

                        # ─────────────────────────────────────────
                        # CORRECTION PRINCIPALE
                        # vérifier si l'offre est expirée en base
                        # si oui → la remettre active
                        # ─────────────────────────────────────────
                        try:
                            existing = client.table("offres")\
                                .select("id, statut")\
                                .eq("id", r["id"])\
                                .execute()

                            if existing.data and existing.data[0]["statut"] == "expiree":
                                # offre republiée → on la remet active
                                client.table("offres").update({
                                    "statut":           "active",
                                    "date_expiration":  None,
                                    "date_publication": r["date_publication"]
                                }).eq("id", r["id"]).execute()
                                reactivees += 1
                            else:
                                # offre déjà active → vrai doublon
                                doublons += 1

                        except:
                            doublons += 1
                    else:
                        erreurs += 1
        else:
            erreurs += len(batch_unique)
            print(f"    Erreur batch {i//BATCH_SIZE + 1} : {msg[:100]}")

    print(f"   {min(i + BATCH_SIZE, total)}/{total} | importées: {importees} | doublons: {doublons} | réactivées: {reactivees} | erreurs: {erreurs}")

# ─────────────────────────────────────────────
# RAPPORT FINAL
# ─────────────────────────────────────────────
print("\n" + "="*50)
print(" RAPPORT D'IMPORT")
print("="*50)
print(f"Total traitées    : {total}")
print(f"Importées         : {importees}")
print(f"Doublons ignorés  : {doublons}")
print(f"Réactivées        : {reactivees}")
print(f"Erreurs           : {erreurs}")

count = client.table("offres").select("id", count="exact").execute()
print(f"\n Total offres dans Supabase : {count.count}")
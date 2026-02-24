import requests
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()
client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def tester_expiration():
    print("📥 Chargement des offres actives depuis Supabase...")
    
    toutes = []
    offset = 0
    while True:
        result = client.table("offres")\
            .select("id, url")\
            .eq("statut", "active")\
            .range(offset, offset + 999)\
            .execute()
        if not result.data:
            break
        toutes.extend(result.data)
        if len(result.data) < 1000:
            break
        offset += 1000

    total = len(toutes)
    print(f" {total} offres actives à vérifier\n")

    resultats = []  # liste pour l'export Excel
    actives   = 0

    for i, offre in enumerate(toutes):
        try:
            r = requests.get(offre["url"], headers=HEADERS, timeout=10)
            
            if r.status_code == 404 or "offre n'est plus disponible" in r.text.lower() or "offre expirée" in r.text.lower():
                resultats.append({
                    "id":     offre["id"],
                    "url":    offre["url"],
                    "statut": "expiree"
                })
            else:
                actives += 1

        except Exception as e:
            resultats.append({
                "id":     offre["id"],
                "url":    offre["url"],
                "statut": "erreur_reseau"
            })

        # progression tous les 50
        if (i + 1) % 50 == 0:
            expirees = len([r for r in resultats if r["statut"] == "expiree"])
            erreurs  = len([r for r in resultats if r["statut"] == "erreur_reseau"])
            print(f"  → {i+1}/{total} vérifiées |  actives: {actives} |  expirées: {expirees} |  erreurs: {erreurs}")

    # compter les résultats
    df = pd.DataFrame(resultats)
    expirees = len(df[df["statut"] == "expiree"]) if len(df) > 0 else 0
    erreurs  = len(df[df["statut"] == "erreur_reseau"]) if len(df) > 0 else 0

    # rapport final
    print("\n" + "="*50)
    print(" RAPPORT DE VÉRIFICATION (mode test)")
    print("="*50)
    print(f"Total vérifiées   : {total}")
    print(f"Toujours actives  : {actives}")
    print(f"Expirées          : {expirees}")
    print(f"Erreurs réseau    : {erreurs}")
    print(f"\n  Mode TEST — aucune modification en base")

    # export Excel
    if len(df) > 0:
        date_now = datetime.now().strftime("%Y%m%d_%H%M")
        nom_fichier = f"data/processed/verification_expiration_{date_now}.xlsx"
        df.to_excel(nom_fichier, index=False)
        print(f"\n Fichier Excel créé : {nom_fichier}")
        print(f"   {expirees} expirées + {erreurs} erreurs réseau")

tester_expiration()
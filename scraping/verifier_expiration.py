import requests
from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()
client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def verifier_et_mettre_a_jour():
    print(" Chargement des offres actives depuis Supabase...")

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

    expirees  = 0
    actives   = 0
    erreurs   = 0

    for i, offre in enumerate(toutes):
        try:
            r = requests.get(offre["url"], headers=HEADERS, timeout=10)

            if r.status_code == 404 or \
               "offre n'est plus disponible" in r.text.lower() or \
               "offre expirée" in r.text.lower():

                # mettre à jour le statut dans Supabase
                client.table("offres").update({
                    "statut":          "expiree",
                    "date_expiration": datetime.now().isoformat()
                }).eq("id", offre["id"]).execute()

                expirees += 1

            else:
                actives += 1

        except Exception:
            erreurs += 1  # erreur réseau → on ne touche pas au statut

        # progression tous les 100
        if (i + 1) % 100 == 0:
            print(f"  → {i+1}/{total} |  actives: {actives} |  expirées: {expirees} |  erreurs: {erreurs}")

    # rapport final
    print("\n" + "="*50)
    print(" RAPPORT DE VÉRIFICATION")
    print("="*50)
    print(f"Total vérifiées   : {total}")
    print(f"Toujours actives  : {actives}")
    print(f"Marquées expirées : {expirees}")
    print(f"Erreurs réseau    : {erreurs}")
    print(f"\n Base Supabase mise à jour")

verifier_et_mettre_a_jour()
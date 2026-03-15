# 🧠 Emploitic — Plateforme de Recrutement Intelligent

> Plateforme de matching emploi basée sur le NLP sémantique — scraping automatisé des offres France Travail, analyse de CV par IA, et matching intelligent entre profils et offres.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions)

---

## 📌 Aperçu

**Emploitic** est une plateforme fullstack qui automatise la recherche d'emploi en combinant :

- **Scraping quotidien** des offres de Travail via GitHub Actions
- **Matching NLP sémantique** entre le profil utilisateur et les offres (SentenceTransformer + cosine similarity)
- **Analyse ATS de CV** par IA (Groq LLaMA 3.3 70B) avec score et conseils
- **CV Builder interactif** avec preview temps réel et génération PDF

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│  scraping → preprocess → import Supabase → embeddings   │
│  (scheduler quotidien 6h00 UTC)                         │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │   Supabase (PG)   │  ~3000 offres actives
        │   + Storage       │  utilisateurs, cv_analyse
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │  FastAPI Backend  │  Python 3.11
        │  + NLP Cache      │  embeddings.npy (384-dim)
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │   React Frontend  │  Vite + Tailwind CSS
        │   5 pages         │  Dashboard / Search /
        │                   │  Matching / Analytics / CV
        └───────────────────┘
```

---

## ✨ Fonctionnalités

### 🔍 Recherche d'offres
- Recherche full-text avec filtres (ville, contrat, expérience)
- Pagination côté serveur
- Accès direct à l'offre originale France Travail

### 🤖 Matching NLP
- Encodage sémantique du profil utilisateur
- Comparaison cosinus contre les embeddings pré-calculés (~3000 offres)
- Top 10 offres avec score de similarité en %
- Traitement en background task (non bloquant)

### 📊 Analytics
- Évolution des offres par mois
- Répartition CDI / CDD / Stage / Alternance
- Top 20 compétences les plus demandées
- Distribution des salaires par tranche et par contrat
- Niveaux d'expérience requis

### 📄 CV Builder + ATS
- Import PDF → extraction texte → analyse Groq IA
- Score ATS en temps réel (0-100)
- Éditeur interactif (ajouter, supprimer, réordonner les sections)
- Preview du CV en temps réel
- Suggestions IA pour améliorer les descriptions de postes
- Génération PDF professionnel (Times serif, template ATS)

---

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Base de données | Supabase (PostgreSQL) |
| NLP | SentenceTransformers `paraphrase-multilingual-MiniLM-L12-v2` |
| IA / LLM | Groq API — LLaMA 3.3 70B Versatile |
| PDF | ReportLab |
| Auth | JWT (python-jose) + bcrypt |
| Scraping | BeautifulSoup, requests |
| CI/CD | GitHub Actions |

---

## 🚀 Installation locale

### Prérequis
- Python 3.11+
- Node.js 18+
- Compte Supabase
- Clé API Groq (gratuit sur [console.groq.com](https://console.groq.com))

### 1. Cloner le repo

```bash
git clone https://github.com/rabahikenzo4-png/job-platform.git
cd job-platform
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Créer le fichier `.env` :

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJ...
SECRET_KEY=emploitic_secret_key_2026
GROQ_API_KEY=gsk_...
```

Calculer les embeddings (première fois) :

```bash
python calcul_embeddings.py
```

Lancer le backend :

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`

---

## 📁 Structure du projet

```
job-platform/
├── backend/
│   ├── main.py                 # API FastAPI (routes + logique)
│   ├── calcul_embeddings.py    # Calcul et sauvegarde des embeddings NLP
│   ├── embeddings.npy          # Cache embeddings (généré automatiquement)
│   ├── offres_cache.json       # Cache offres (généré automatiquement)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Matching.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Profile.jsx     # CV Builder + ATS
│   │   └── App.jsx
│   └── package.json
├── scraping/
│   ├── scraper.py              # Scraping France Travail
│   ├── preprocess.py           # Nettoyage et normalisation
│   └── import_supabase.py      # Import dans la base
└── .github/
    └── workflows/
        └── scraping.yml        # Scheduler GitHub Actions
```

---

## ⚙️ GitHub Actions — Scheduler

Le workflow tourne automatiquement chaque jour à 6h00 UTC :

```
1. Checkout code
2. Scraping France Travail (~3000 offres)
3. Preprocessing (déduplication, normalisation)
4. Import Supabase (upsert par URL)
5. Vérification expiration des offres
6. Calcul embeddings NLP (paraphrase-multilingual-MiniLM-L12-v2)
7. Commit et push embeddings.npy + offres_cache.json
```

---

## 🧮 NLP — Détails techniques

**Modèle** : `paraphrase-multilingual-MiniLM-L12-v2`
- Dimension : 384
- Langues : 50+ (français natif)
- Taille : ~470MB
- Licence : Apache 2.0

**Pipeline matching** :
```python
# Encodage profil utilisateur
profil = f"{titre_poste} | {competences} | {experience} | {niveau_etudes}"
emb_profil = model.encode([profil])  # shape (1, 384)

# Comparaison contre cache
scores = cosine_similarity(emb_profil, cache_embeddings)[0]  # shape (N,)
top_10 = np.argsort(scores)[::-1][:10]
```

**Complexité** : O(N) en mémoire, O(N·d) en calcul — ~50ms pour 3000 offres sur CPU.

---

## 📊 Base de données Supabase

### Table `offres`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| titre | TEXT | Intitulé du poste |
| entreprise | TEXT | Nom de l'entreprise |
| ville | TEXT | Localisation |
| type_contrat | TEXT | CDI/CDD/Stage/... |
| experience | TEXT | Niveau requis |
| salary | TEXT | Fourchette salariale |
| competences | TEXT | Skills séparés par `;` |
| description | TEXT | Description complète |
| url | TEXT | Lien offre originale |
| statut | TEXT | `active` / `expiree` |
| date_publication | DATE | Date de publication |
| date_scraping | TIMESTAMP | Date de collecte |

### Table `utilisateurs`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| nom | TEXT | Nom complet |
| email | TEXT | Email (unique) |
| password_hash | TEXT | Hash bcrypt |
| titre_poste | TEXT | Poste recherché |
| competences | TEXT | Compétences |
| cv_analyse | TEXT | JSON analyse CV ATS |

---

## 🔐 Authentification

- Inscription / Connexion avec email + mot de passe
- Hachage bcrypt des mots de passe
- Token JWT (7 jours d'expiration)
- Routes protégées via `HTTPBearer` FastAPI

---

## 📈 Performance

| Opération | Temps |
|-----------|-------|
| Calcul embeddings (3000 offres, CPU) | ~3min30 |
| Matching NLP (top 10) | ~50ms |
| Analyse CV par Groq IA | ~5-10s |
| Génération PDF | ~200ms |
| Chargement cache au démarrage | ~1s |

---

## 🤝 Contribution

Les contributions sont les bienvenues. Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'feat: ajout de ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence **MIT** — voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👤 Auteur

**Rabahi Kenzo Boussad**
- Étudiant Master 1 Data Science — Université d'Alger 1 Benyoucef Benkhedda
- GitHub : [@rabahikenzo4-png](https://github.com/rabahikenzo4-png)
- Email : rabahikenzo4@gmail.com
- LinkedIn : [Kenzo](https://www.linkedin.com/in/rbhkenzo/)

---

> Projet académique développé dans le cadre du Master Data Science — 2025/2026

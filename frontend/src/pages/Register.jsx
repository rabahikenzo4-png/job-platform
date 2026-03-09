import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, User, Mail, Lock, MapPin, GraduationCap, Briefcase, Eye, EyeOff, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { register } from '../api'

const COMPETENCES_LIST = [
  "Python", "SQL", "R", "Spark", "Hadoop", "TensorFlow", "Keras",
  "Scikit-learn", "Pandas", "NumPy", "Power BI", "Tableau", "Excel",
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
  "Azure", "AWS", "GCP", "MongoDB", "PostgreSQL", "Docker",
  "Kubernetes", "Git", "Airflow", "Databricks", "Looker", "SAS",
  "Scala", "Java", "JavaScript", "ETL", "Data Warehouse", "Big Data",
  "MLOps", "FastAPI", "Streamlit", "Jupyter", "DBT", "Kafka"
]

const NIVEAUX = ["Bac", "Bac+2", "Licence (Bac+3)", "Master (Bac+5)", "Doctorat"]
const EXPERIENCES = ["Débutant (0 an)", "1 an", "2 ans", "3 ans", "4 ans", "5 ans et plus"]
const CONTRATS = ["CDI", "CDD", "Stage", "Alternance", "Freelance", "Tous"]

export default function Register() {
  const navigate  = useNavigate()
  const [etape, setEtape]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur]   = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const [form, setForm] = useState({
    nom: '', email: '', password: '',
    ville: '', niveau_etudes: '', experience: '',
    competences: [], titre_poste: '', type_contrat: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErreur('')
  }

  const toggleCompetence = (comp) => {
    const exists = form.competences.includes(comp)
    setForm({
      ...form,
      competences: exists
        ? form.competences.filter(c => c !== comp)
        : [...form.competences, comp]
    })
  }

  const suivant = () => {
    if (etape === 1) {
      if (!form.nom || !form.email || !form.password) {
        setErreur('Veuillez remplir tous les champs')
        return
      }
      if (form.password.length < 6) {
        setErreur('Le mot de passe doit faire au moins 6 caractères')
        return
      }
    }
    setErreur('')
    setEtape(etape + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        ...form,
        competences: form.competences.join('; ')
      }
      const res = await register(payload)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const etapes = ['Compte', 'Profil', 'Compétences']

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#080b14] text-white flex items-center justify-center px-4 py-12">

      {/* Fond */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold">Emploitic</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md text-indigo-300"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>AI</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Créer votre compte</h1>
          <p className="text-gray-500 text-sm">Étape {etape} sur {etapes.length}</p>
        </div>

        {/* Indicateur étapes */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {etapes.map((nom, i) => (
            <div key={nom} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i + 1 < etape ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
                                i + 1 === etape ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
                                'rgba(255,255,255,0.08)',
                    border: i + 1 === etape ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: i + 1 <= etape ? 'white' : '#6b7280'
                  }}
                >
                  {i + 1 < etape ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-xs ${i + 1 === etape ? 'text-white' : 'text-gray-600'}`}>{nom}</span>
              </div>
              {i < etapes.length - 1 && (
                <div className="w-8 h-px" style={{ background: i + 1 < etape ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* ── ÉTAPE 1 : Compte ── */}
          {etape === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-6">Informations de connexion</h2>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Nom complet</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <User size={16} className="text-gray-500" />
                  <input name="nom" placeholder="Votre nom" value={form.nom}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Mail size={16} className="text-gray-500" />
                  <input name="email" type="email" placeholder="vous@exemple.com" value={form.email}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Mot de passe</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Lock size={16} className="text-gray-500" />
                  <input name="password" type={showPwd ? 'text' : 'password'} placeholder="6 caractères minimum"
                    value={form.password} onChange={handleChange}
                    className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm" />
                  <button onClick={() => setShowPwd(!showPwd)} className="text-gray-500 hover:text-gray-300 transition">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Profil ── */}
          {etape === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-6">Votre profil professionnel</h2>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Ville</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <MapPin size={16} className="text-gray-500" />
                  <input name="ville" placeholder="Paris, Lyon, Marseille..." value={form.ville}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Niveau d'études</label>
                <div className="grid grid-cols-2 gap-2">
                  {NIVEAUX.map(n => (
                    <button key={n} onClick={() => setForm({ ...form, niveau_etudes: n })}
                      className="px-3 py-2 rounded-lg text-sm transition-all text-left"
                      style={{
                        background: form.niveau_etudes === n ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        border: form.niveau_etudes === n ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        color: form.niveau_etudes === n ? '#a5b4fc' : '#9ca3af'
                      }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Expérience</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCES.map(e => (
                    <button key={e} onClick={() => setForm({ ...form, experience: e })}
                      className="px-3 py-2 rounded-lg text-xs transition-all"
                      style={{
                        background: form.experience === e ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        border: form.experience === e ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        color: form.experience === e ? '#a5b4fc' : '#9ca3af'
                      }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Titre recherché <span className="text-gray-600">(optionnel)</span></label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Briefcase size={16} className="text-gray-500" />
                  <input name="titre_poste" placeholder="Data Scientist, ML Engineer..." value={form.titre_poste}
                    onChange={handleChange}
                    className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm" />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-sm text-gray-400 mb-2">Type de contrat</label>
                <div className="flex flex-wrap gap-2">
                  {CONTRATS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, type_contrat: c })}
                      className="px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        background: form.type_contrat === c ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        border: form.type_contrat === c ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        color: form.type_contrat === c ? '#a5b4fc' : '#9ca3af'
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Compétences ── */}
          {etape === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Vos compétences</h2>
              <p className="text-gray-500 text-sm mb-6">
                Sélectionnez vos compétences techniques —{' '}
                <span className="text-indigo-400">{form.competences.length} sélectionnées</span>
              </p>

              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
                {COMPETENCES_LIST.map(comp => (
                  <button
                    key={comp}
                    onClick={() => toggleCompetence(comp)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      background: form.competences.includes(comp) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      border: form.competences.includes(comp) ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: form.competences.includes(comp) ? '#a5b4fc' : '#9ca3af'
                    }}
                  >
                    {form.competences.includes(comp) && <span className="mr-1">✓</span>}
                    {comp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Erreur */}
          {erreur && (
            <div className="mt-4 px-4 py-3 rounded-xl text-red-400 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {erreur}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {etape > 1 ? (
              <button onClick={() => setEtape(etape - 1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm">
                <ChevronLeft size={16} /> Retour
              </button>
            ) : (
              <div />
            )}

            {etape < 3 ? (
              <button onClick={suivant}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Continuer <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {loading ? 'Création...' : 'Créer mon compte'} <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Lien connexion */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Déjà un compte ?{' '}
          <button onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300 transition">
            Se connecter
          </button>
        </p>
      </div>
    </div>
  )
}
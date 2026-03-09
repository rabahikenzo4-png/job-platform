import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Search, Brain, TrendingUp, MapPin, Briefcase,
  ExternalLink, User, LogOut, BarChart2,
  Sparkles, Bell, ChevronRight, Clock, RefreshCw
} from 'lucide-react'
import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:8000' })

export default function Dashboard() {
  const navigate  = useNavigate()
  const [user, setUser]         = useState(null)
  const [stats, setStats]       = useState(null)
  const [offres, setOffres]     = useState([])
  const [matching, setMatching] = useState([])
  const [loading, setLoading]   = useState(true)
  const [loadingMatch, setLoadingMatch] = useState(false)

  const token       = localStorage.getItem('token')
  const intervalRef = useRef(null)

  // ── 1. polling ──
  const polling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(async () => {
      try {
        const res = await API.get('/matching/statut', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.statut === 'termine') {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setMatching(res.data.resultats)
          setLoadingMatch(false)
          localStorage.setItem('matching_statut', 'termine')
          localStorage.setItem('matching_resultats', JSON.stringify(res.data.resultats))
          alert('✅ Matching terminé ! Vos offres recommandées sont prêtes.')
        } else if (res.data.statut === 'erreur') {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setLoadingMatch(false)
          localStorage.setItem('matching_statut', 'erreur')
          alert('❌ Erreur lors du matching')
        }
      } catch (err) {
        console.error(err)
      }
    }, 3000)
  }

  // ── 2. useEffect ──
  useEffect(() => {
    if (!token) { navigate('/login'); return }
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
    chargerDonnees()

    // charger résultats matching sauvegardés
    const resultatsSauvegardes = localStorage.getItem('matching_resultats')
    if (resultatsSauvegardes) {
      setMatching(JSON.parse(resultatsSauvegardes))
    }

    // reprendre polling si matching était en cours
    const statutSauvegarde = localStorage.getItem('matching_statut')
    if (statutSauvegarde === 'en_cours') {
      setLoadingMatch(true)
      polling()
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const chargerDonnees = async () => {
    try {
      const [statsRes, offresRes] = await Promise.all([
        API.get('/offres/stats'),
        API.get('/offres?limit=6'),
      ])
      setStats(statsRes.data)
      setOffres(offresRes.data.offres)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ── 3. lancerMatching ──
  const lancerMatching = async () => {
    setLoadingMatch(true)
    setMatching([])
    localStorage.removeItem('matching_resultats')
    localStorage.setItem('matching_statut', 'en_cours')
    try {
      await API.post('/matching/lancer', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      polling()
    } catch (err) {
      console.error(err)
      setLoadingMatch(false)
    }
  }

  const deconnexion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('matching_statut')
    localStorage.removeItem('matching_resultats')
    navigate('/')
  }

  const getScoreColor = (score) => {
    if (score >= 75) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#6b7280'
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#080b14] text-white">

      {/* Fond */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── SIDEBAR ── */}
      <div className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col"
        style={{ background: 'rgba(8,11,20,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <div className="px-6 py-6 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold">Emploitic</span>
          <span className="text-xs px-1.5 py-0.5 rounded text-indigo-300"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>AI</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { icon: <BarChart2 size={16} />, label: 'Dashboard',  path: '/dashboard', active: true },
            { icon: <Search size={16} />,    label: 'Recherche',  path: '/search' },
            { icon: <Brain size={16} />,     label: 'Matching IA',path: '/matching' },
            { icon: <TrendingUp size={16} />,label: 'Analytics',  path: '/analytics' },
            { icon: <User size={16} />,      label: 'Profil',     path: '/profile' },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all"
              style={{
                background: item.active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color:      item.active ? '#a5b4fc' : '#6b7280',
                border:     item.active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              }}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {user?.nom?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nom}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={deconnexion}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 transition">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="ml-64 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Bonjour, {user?.nom?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/search')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Search size={15} className="text-gray-400" />
              <span className="text-gray-400">Rechercher...</span>
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Bell size={15} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── CARTES STATS ── */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Offres actives',       valeur: stats?.total_actives?.toLocaleString(),  icon: <Briefcase size={18} />, color: '#6366f1' },
              { label: 'Offres expirées',       valeur: stats?.total_expirees?.toLocaleString(), icon: <Clock size={18} />,     color: '#8b5cf6' },
              { label: "Nouvelles aujourd'hui", valeur: stats?.nouvelles_hoje || '0',            icon: <Sparkles size={18} />,  color: '#a78bfa' },
              { label: 'Top ville',             valeur: stats?.top_villes?.[0]?.ville || '-',   icon: <MapPin size={18} />,    color: '#c084fc' },
            ].map(card => (
              <div key={card.label} className="p-5 rounded-2xl transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-xs">{card.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${card.color}20`, color: card.color }}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold">{card.valeur}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">

          {/* ── MATCHING IA ── */}
          <div className="col-span-1 rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-indigo-400" />
                <h2 className="font-semibold text-sm">Matching IA</h2>
              </div>

              {/* Bouton toujours visible */}
              <button
                onClick={lancerMatching}
                disabled={loadingMatch}
                className="text-xs px-3 py-1.5 rounded-lg text-indigo-300 transition disabled:opacity-50 flex items-center gap-1"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                {loadingMatch ? (
                  '⏳ Analyse...'
                ) : matching.length > 0 ? (
                  <><RefreshCw size={11} /> Relancer</>
                ) : (
                  '✨ Lancer'
                )}
              </button>
            </div>

            {/* État vide */}
            {matching.length === 0 && !loadingMatch && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Brain size={20} className="text-indigo-400" />
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Lancez le matching pour voir les offres les plus adaptées à votre profil
                </p>
              </div>
            )}

            {/* Chargement */}
            {loadingMatch && (
              <div className="text-center py-8">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-xs">Analyse de votre profil...</p>
              </div>
            )}

            {/* Résultats persistants */}
            {!loadingMatch && matching.map((offre) => (
              <div key={offre.id} className="mb-3 p-3 rounded-xl transition-all hover:border-indigo-800 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                onClick={() => window.open(offre.url, '_blank')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{offre.titre}</p>
                    <p className="text-xs text-gray-500 truncate">{offre.entreprise}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: getScoreColor(offre.score) }}>
                    {offre.score}%
                  </span>
                </div>
              </div>
            ))}

            {matching.length > 0 && !loadingMatch && (
              <button onClick={() => navigate('/matching')}
                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 transition mt-2">
                Voir plus →
              </button>
            )}
          </div>

          {/* ── OFFRES RÉCENTES ── */}
          <div className="col-span-2 rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-400" />
                <h2 className="font-semibold text-sm">Offres récentes</h2>
              </div>
              <button onClick={() => navigate('/search')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
                Voir tout <ChevronRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.05)' }} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {offres.map(offre => (
                  <div key={offre.id}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer group"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={() => window.open(offre.url, '_blank')}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {offre.entreprise?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{offre.titre}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-500">{offre.entreprise || 'Non précisé'}</span>
                        {offre.ville && (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin size={10} /> {offre.ville}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {offre.type_contrat && offre.type_contrat !== 'Non précisé' && (
                        <span className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                          {offre.type_contrat}
                        </span>
                      )}
                      <ExternalLink size={13} className="text-gray-600 group-hover:text-indigo-400 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── TOP VILLES ── */}
        {stats && (
          <div className="mt-6 rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-5">
              <MapPin size={16} className="text-indigo-400" />
              <h2 className="font-semibold text-sm">Top villes qui recrutent</h2>
            </div>
            <div className="flex items-end gap-4">
              {stats.top_villes?.map((v, i) => {
                const max    = stats.top_villes[0]?.count || 1
                const pct    = Math.round((v.count / max) * 100)
                const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#d8b4fe']
                return (
                  <div key={v.ville} className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-2">{v.count}</p>
                    <div className="rounded-lg mx-auto w-full"
                      style={{ height: `${Math.max(pct * 0.8, 8)}px`, background: colors[i], opacity: 0.8 }} />
                    <p className="text-xs mt-2 truncate">{v.ville}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
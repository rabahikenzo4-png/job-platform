import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Zap, Search as Searchicon, Brain, TrendingUp, MapPin, Briefcase,
  User, LogOut, BarChart2, ChevronRight, ChevronLeft,
  SlidersHorizontal, X, ExternalLink, Calendar, Clock
} from 'lucide-react'
import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:8000' })

const CONTRATS    = ['Tous', 'CDI', 'CDD', 'Interim', 'Stage', 'Alternance']
const EXPERIENCES = ['Tous', 'Debutant', '1 an(s)', '2 an(s)', '3 an(s)', '5 an(s)', 'Experience exigee']

export default function Search() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  const [user, setUser]       = useState(null)
  const [offres, setOffres]   = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [showFiltres, setShowFiltres] = useState(false)

  const [filtres, setFiltres] = useState({
    q:            searchParams.get('q') || '',
    ville:        '',
    type_contrat: 'Tous',
    experience:   'Tous',
  })

  const token = localStorage.getItem('token')

  // La fonction prend les filtres en parametre pour eviter le probleme de closure
  const rechercher = useCallback(async (p = 1, f = null) => {
    const filtresActifs = f || filtres
    setLoading(true)
    try {
      const params = { limit: 20, page: p }
      if (filtresActifs.q)                               params.q            = filtresActifs.q
      if (filtresActifs.ville)                           params.ville        = filtresActifs.ville
      if (filtresActifs.type_contrat !== 'Tous')         params.type_contrat = filtresActifs.type_contrat
      if (filtresActifs.experience   !== 'Tous')         params.experience   = filtresActifs.experience

      const res = await API.get('/offres', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setOffres(res.data.offres)
      setTotal(res.data.total)
      setPage(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filtres, token])

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
    rechercher(1)
  }, [])

  // Quand on change un filtre bouton (contrat, experience), on relance directement avec la nouvelle valeur
  const setFiltreEtRechercher = (cle, valeur) => {
    const nouveauxFiltres = { ...filtres, [cle]: valeur }
    setFiltres(nouveauxFiltres)
    rechercher(1, nouveauxFiltres)
  }

  const resetFiltres = () => {
    const vide = { q: '', ville: '', type_contrat: 'Tous', experience: 'Tous' }
    setFiltres(vide)
    rechercher(1, vide)
  }

  const nbFiltresActifs = [
    filtres.ville,
    filtres.type_contrat !== 'Tous' ? filtres.type_contrat : '',
    filtres.experience   !== 'Tous' ? filtres.experience   : '',
  ].filter(Boolean).length

  const deconnexion = () => {
    localStorage.clear()
    navigate('/')
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#080b14] text-white">

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* SIDEBAR */}
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
            { icon: <BarChart2 size={16} />,  label: 'Dashboard',   path: '/dashboard' },
            { icon: <Searchicon size={16} />, label: 'Recherche',   path: '/search',   active: true },
            { icon: <Brain size={16} />,      label: 'Matching IA', path: '/matching' },
            { icon: <TrendingUp size={16} />, label: 'Analytics',   path: '/analytics' },
            { icon: <User size={16} />,       label: 'Profil',      path: '/profile' },
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
            <LogOut size={14} /> Deconnexion
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="ml-64 p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Recherche d'offres</h1>
          <p className="text-gray-500 text-sm">Trouvez l'offre qui correspond a votre profil</p>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Searchicon size={17} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Titre du poste, mots cles..."
              value={filtres.q}
              onChange={(e) => setFiltres({ ...filtres, q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // passe les filtres a jour directement pour eviter le closure
                  rechercher(1, { ...filtres, q: e.target.value })
                }
              }}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
            />
            {filtres.q && (
              <button onClick={() => setFiltreEtRechercher('q', '')} className="text-gray-600 hover:text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFiltres(!showFiltres)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all relative"
            style={{
              background: showFiltres ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              border: showFiltres ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: showFiltres ? '#a5b4fc' : '#9ca3af'
            }}>
            <SlidersHorizontal size={15} />
            Filtres
            {nbFiltresActifs > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white"
                style={{ background: '#6366f1' }}>
                {nbFiltresActifs}
              </span>
            )}
          </button>

          <button
            onClick={() => rechercher(1, filtres)}
            className="px-6 py-3 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Rechercher
          </button>
        </div>

        {/* Filtres depliants */}
        {showFiltres && (
          <div className="mb-6 p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="grid grid-cols-3 gap-4">

              <div>
                <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin size={11} /> Ville
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <input
                    type="text"
                    placeholder="Paris, Lyon..."
                    value={filtres.ville}
                    onChange={(e) => setFiltres({ ...filtres, ville: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') rechercher(1, { ...filtres, ville: e.target.value })
                    }}
                    className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
                  />
                  {filtres.ville && (
                    <button onClick={() => setFiltreEtRechercher('ville', '')} className="text-gray-600 hover:text-gray-400">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Briefcase size={11} /> Type de contrat
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CONTRATS.map(c => (
                    <button key={c} onClick={() => setFiltreEtRechercher('type_contrat', c)}
                      className="px-2.5 py-1 rounded-lg text-xs transition-all"
                      style={{
                        background: filtres.type_contrat === c ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        border:     filtres.type_contrat === c ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color:      filtres.type_contrat === c ? '#a5b4fc' : '#6b7280'
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Clock size={11} /> Experience
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EXPERIENCES.map(e => (
                    <button key={e} onClick={() => setFiltreEtRechercher('experience', e)}
                      className="px-2.5 py-1 rounded-lg text-xs transition-all"
                      style={{
                        background: filtres.experience === e ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                        border:     filtres.experience === e ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color:      filtres.experience === e ? '#a5b4fc' : '#6b7280'
                      }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {nbFiltresActifs > 0 && (
              <button onClick={resetFiltres}
                className="mt-4 text-xs text-gray-500 hover:text-red-400 transition flex items-center gap-1">
                <X size={11} /> Reinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Resultats header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? 'Recherche...' : `${total} offre${total > 1 ? 's' : ''} trouvee${total > 1 ? 's' : ''}`}
          </p>
          <p className="text-xs text-gray-600">Page {page} sur {totalPages || 1}</p>
        </div>

        {/* Liste offres */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : offres.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Searchicon size={24} className="text-indigo-400" />
            </div>
            <p className="text-gray-400 font-medium mb-1">Aucune offre trouvee</p>
            <p className="text-gray-600 text-sm">Essayez avec d'autres mots cles ou filtres</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offres.map(offre => (
              <div key={offre.id}
                className="flex items-center gap-5 p-5 rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer group"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                onClick={() => window.open(offre.url, '_blank')}>

                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {offre.entreprise?.charAt(0) || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-indigo-300 transition">
                    {offre.titre}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{offre.entreprise || 'Non precise'}</span>
                    {offre.ville && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {offre.ville}
                      </span>
                    )}
                    {offre.date_publication && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {offre.date_publication}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {offre.type_contrat && offre.type_contrat !== 'Non precise' && (
                    <span className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {offre.type_contrat}
                    </span>
                  )}
                  {offre.experience && offre.experience !== 'Non precise' && (
                    <span className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {offre.experience}
                    </span>
                  )}
                  <ExternalLink size={14} className="text-gray-600 group-hover:text-indigo-400 transition ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => rechercher(page - 1, filtres)}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
              <ChevronLeft size={15} /> Precedent
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p
              if (totalPages <= 5)          p = i + 1
              else if (page <= 3)           p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else                          p = page - 2 + i
              return (
                <button key={p} onClick={() => rechercher(p, filtres)}
                  className="w-9 h-9 rounded-xl text-sm transition-all"
                  style={{
                    background: p === page ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                    border:     p === page ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color:      p === page ? 'white' : '#9ca3af'
                  }}>
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => rechercher(page + 1, filtres)}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
              Suivant <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
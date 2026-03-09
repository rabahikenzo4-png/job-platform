import { useNavigate } from 'react-router-dom'
import { Search, Brain, FileText, TrendingUp, ChevronRight, Sparkles, Database, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const [recherche, setRecherche] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  const handleRecherche = () => {
    if (recherche.trim()) {
      navigate(`/search?q=${recherche}`)
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Outfit', sans-serif" }} className="min-h-screen bg-[#080b14] text-white overflow-x-hidden">

      {/* ── FOND ANIMÉ ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(60px)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav
        className="relative z-50 px-8 py-5 flex items-center justify-between"
        style={{
          borderBottom: '1px solid rgba(99,102,241,0.15)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(8,11,20,0.8)',
          transition: 'all 0.6s ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-20px)'
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', filter: 'blur(6px)' }} />
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap size={16} className="text-white" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">Emploitic</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-md text-indigo-300 font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              AI
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <button onClick={() => navigate('/search')} className="hover:text-white transition">Offres</button>
          <button onClick={() => navigate('/matching')} className="hover:text-white transition">Matching IA</button>
          <button className="hover:text-white transition">Analytics</button>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-400 hover:text-white transition-all px-4 py-2 rounded-lg text-sm"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Connexion
          </button>
          <button
            onClick={() => navigate('/register')}
            className="relative text-white px-4 py-2 rounded-lg text-sm font-medium overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <span className="relative z-10">S'inscrire</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 px-8 pt-28 pb-20 text-center max-w-5xl mx-auto">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full mb-10"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#a5b4fc',
            transition: 'all 0.8s ease 0.1s',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <Sparkles size={13} />
          Powered by NLP & Sentence Transformers
        </div>

        {/* Titre */}
        <h1
          className="text-6xl font-bold mb-6 leading-[1.1] tracking-tight"
          style={{
            transition: 'all 0.8s ease 0.2s',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)'
          }}
        >
          L'emploi{' '}
          <span style={{
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Data Science
          </span>
          <br />
          qui vous correspond vraiment
        </h1>

        {/* Sous-titre */}
        <p
          className="text-gray-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed"
          style={{
            transition: 'all 0.8s ease 0.3s',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          Notre IA compare votre profil avec des milliers d'offres
          et vous propose uniquement ce qui vous correspond.
        </p>

        {/* Barre de recherche */}
        <div
          className="flex items-center gap-2 max-w-2xl mx-auto mb-6 p-2 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.8s ease 0.4s',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <div className="flex items-center gap-3 flex-1 px-4">
            <Search size={18} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Data Scientist, ML Engineer, Power BI..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRecherche()}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-base py-2"
            />
          </div>
          <button
            onClick={handleRecherche}
            className="px-6 py-3 rounded-xl text-white text-sm font-medium shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Rechercher
          </button>
        </div>

        {/* Tags populaires */}
        <div
          className="flex items-center justify-center gap-3 text-sm flex-wrap"
          style={{
            transition: 'all 0.8s ease 0.5s',
            opacity: visible ? 1 : 0
          }}
        >
          <span className="text-gray-600">Tendances :</span>
          {['Data Scientist', 'Data Engineer', 'ML Engineer', 'Power BI', 'NLP'].map(tag => (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${tag}`)}
              className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all text-xs"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className="relative z-10 py-12 px-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          {[
            { valeur: '3 000+', label: 'Offres indexées', icon: <Database size={16} /> },
            { valeur: 'NLP', label: 'Matching intelligent', icon: <Brain size={16} /> },
            { valeur: '100%', label: 'Gratuit', icon: <Sparkles size={16} /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-center gap-2 text-indigo-400 mb-2 text-xs uppercase tracking-widest">
                {stat.icon}
                {stat.label}
              </div>
              <div className="text-3xl font-bold text-white">{stat.valeur}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section className="relative z-10 py-28 px-8 max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-indigo-400 text-sm uppercase tracking-widest mb-4">Processus</p>
          <h2 className="text-4xl font-bold tracking-tight">Simple. Rapide. Précis.</h2>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: <FileText size={22} />,
              num: '01',
              titre: 'Créez votre profil',
              desc: 'Compétences, diplôme, expérience. L\'IA construit votre empreinte professionnelle.',
              color: '#6366f1'
            },
            {
              icon: <Brain size={22} />,
              num: '02',
              titre: 'L\'IA analyse et match',
              desc: 'Sentence Transformers compare votre profil à des milliers d\'offres en temps réel.',
              color: '#8b5cf6'
            },
            {
              icon: <TrendingUp size={22} />,
              num: '03',
              titre: 'Postulez avec l\'IA',
              desc: 'CV et lettre de motivation générés et adaptés automatiquement à chaque offre.',
              color: '#a78bfa'
            },
          ].map((item, i) => (
            <div
              key={item.num}
              className="group p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}30` }}
                >
                  {item.icon}
                </div>
                <span className="text-gray-700 font-mono text-sm">{item.num}</span>
              </div>
              <h3 className="text-lg font-semibold mb-3 tracking-tight">{item.titre}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-20 px-8 text-center">
        <div
          className="max-w-xl mx-auto p-12 rounded-3xl"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={22} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Prêt à commencer ?</h2>
          <p className="text-gray-500 mb-8 text-sm">Créez votre profil et trouvez votre prochain poste en quelques minutes.</p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-medium transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Créer mon profil gratuitement
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 px-8 py-8 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={14} className="text-indigo-400" />
          <span className="text-sm font-semibold">Emploitic AI</span>
        </div>
        <p className="text-gray-600 text-xs">Projet PFE Master Data Science — 2026</p>
      </footer>

    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Search, Brain, TrendingUp, MapPin, Briefcase,
  User, LogOut, BarChart2, Sparkles, ArrowUpRight,
  Activity, PieChart, Code2, DollarSign
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart as RechartsPie, Pie, Legend
} from 'recharts'
import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:8000' })

const COLORS_DONUT = ['#6366f1', '#8b5cf6', '#a78bfa', '#c084fc', '#e879f9', '#f0abfc']

const moisLabel = (m) => {
  const [annee, mois] = m.split('-')
  const noms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  return noms[parseInt(mois) - 1] + ' ' + annee.slice(2)
}

const formatSalaire = (v) => `${(v / 1000).toFixed(0)}k€`

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,17,30,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: '#a5b4fc', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
          {typeof p.value === 'number' && p.value > 1000 ? formatSalaire(p.value) : p.value}
          <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 11 }}> {p.name}</span>
        </p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const token = localStorage.getItem('token')

  const [evolution,    setEvolution]    = useState(null)
  const [contrats,     setContrats]     = useState(null)
  const [competences,  setCompetences]  = useState(null)
  const [salaires,     setSalaires]     = useState(null)
  const [experience,   setExperience]   = useState(null)

  const [loadingEvo,   setLoadingEvo]   = useState(true)
  const [loadingCont,  setLoadingCont]  = useState(true)
  const [loadingComp,  setLoadingComp]  = useState(true)
  const [loadingSal,   setLoadingSal]   = useState(true)
  const [loadingExp,   setLoadingExp]   = useState(true)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))

    // chargement par section
    API.get('/analytics/evolution').then(r => { setEvolution(r.data); setLoadingEvo(false) }).catch(() => setLoadingEvo(false))
    API.get('/analytics/contrats').then(r => { setContrats(r.data); setLoadingCont(false) }).catch(() => setLoadingCont(false))
    API.get('/analytics/competences').then(r => { setCompetences(r.data); setLoadingComp(false) }).catch(() => setLoadingComp(false))
    API.get('/analytics/salaires').then(r => { setSalaires(r.data); setLoadingSal(false) }).catch(() => setLoadingSal(false))
    API.get('/analytics/experience').then(r => { setExperience(r.data); setLoadingExp(false) }).catch(() => setLoadingExp(false))
  }, [])

  const deconnexion = () => {
    localStorage.clear()
    navigate('/')
  }

  const Skeleton = ({ h = 'h-48' }) => (
    <div className={`${h} rounded-2xl animate-pulse`} style={{ background: 'rgba(99,102,241,0.06)' }} />
  )

  const SectionCard = ({ icon, title, subtitle, children, loading, h }) => (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-indigo-400">{icon}</span>
            <h2 className="font-semibold text-sm text-white">{title}</h2>
          </div>
          {subtitle && <p className="text-xs text-gray-500 ml-6">{subtitle}</p>}
        </div>
      </div>
      {loading ? <Skeleton h={h} /> : children}
    </div>
  )

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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold">Emploitic</span>
          <span className="text-xs px-1.5 py-0.5 rounded text-indigo-300"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>AI</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { icon: <BarChart2 size={16} />, label: 'Dashboard',   path: '/dashboard' },
            { icon: <Search size={16} />,    label: 'Recherche',   path: '/search' },
            { icon: <Brain size={16} />,     label: 'Matching IA', path: '/matching' },
            { icon: <TrendingUp size={16} />,label: 'Analytics',   path: '/analytics', active: true },
            { icon: <User size={16} />,      label: 'Profil',      path: '/profile' },
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
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
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

      {/* ── CONTENU ── */}
      <div className="ml-64 p-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={20} className="text-indigo-400" />
            <h1 className="text-2xl font-bold">Analytics</h1>
          </div>
          <p className="text-gray-500 text-sm">Analyse du marché de l'emploi en temps réel</p>
        </div>

        {/* KPIs rapides */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Avec salaire renseigné',
              value: salaires ? `${salaires.total_avec_salaire}` : '—',
              sub:   salaires ? `Moy. ${salaires.moyenne_generale?.toLocaleString()}€` : '…',
              icon:  <DollarSign size={16} />, color: '#6366f1'
            },
            {
              label: 'Types de contrat',
              value: contrats ? `${contrats.contrats?.length}` : '—',
              sub:   contrats ? `${contrats.total?.toLocaleString()} offres` : '…',
              icon:  <PieChart size={16} />, color: '#8b5cf6'
            },
            {
              label: 'Compétences uniques',
              value: competences ? `${competences.competences?.length}+` : '—',
              sub:   'Top 20 analysées',
              icon:  <Code2 size={16} />, color: '#a78bfa'
            },
            {
              label: 'Mois de données',
              value: evolution ? `${evolution.evolution?.length}` : '—',
              sub:   evolution ? `Depuis ${evolution.evolution?.[0]?.mois ? moisLabel(evolution.evolution[0].mois) : '…'}` : '…',
              icon:  <Activity size={16} />, color: '#c084fc'
            },
          ].map(card => (
            <div key={card.label} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500 text-xs">{card.label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${card.color}20`, color: card.color }}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-gray-600 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── LIGNE 1 : Évolution + Contrats ── */}
        <div className="grid grid-cols-3 gap-6 mb-6">

          {/* Évolution temporelle */}
          <div className="col-span-2">
            <SectionCard
              icon={<Activity size={15} />}
              title="Évolution des offres"
              subtitle="Nombre de publications par mois"
              loading={loadingEvo}
              h="h-56">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={evolution?.evolution?.map(d => ({ ...d, mois: moisLabel(d.mois) }))}>
                  <defs>
                    <linearGradient id="gradEvo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="mois" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="offres" stroke="#6366f1" strokeWidth={2} fill="url(#gradEvo)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          {/* Donut contrats */}
          <div className="col-span-1">
            <SectionCard
              icon={<PieChart size={15} />}
              title="Types de contrat"
              subtitle="Répartition actuelle"
              loading={loadingCont}
              h="h-56">
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={140}>
                  <RechartsPie>
                    <Pie
                      data={contrats?.contrats?.slice(0, 5)}
                      dataKey="count"
                      nameKey="type"
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={65}
                      paddingAngle={3}>
                      {contrats?.contrats?.slice(0, 5).map((_, i) => (
                        <Cell key={i} fill={COLORS_DONUT[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="w-full space-y-1.5 mt-1">
                  {contrats?.contrats?.slice(0, 4).map((c, i) => (
                    <div key={c.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS_DONUT[i] }} />
                        <span className="text-xs text-gray-400">{c.type}</span>
                      </div>
                      <span className="text-xs font-medium text-white">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── LIGNE 2 : Compétences + Expérience ── */}
        <div className="grid grid-cols-3 gap-6 mb-6">

          {/* Top compétences */}
          <div className="col-span-2">
            <SectionCard
              icon={<Code2 size={15} />}
              title="Top compétences demandées"
              subtitle="Les 15 technologies & skills les plus recherchés"
              loading={loadingComp}
              h="h-72">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={competences?.competences?.slice(0, 15)} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="competence" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="offres" radius={[0, 4, 4, 0]}>
                    {competences?.competences?.slice(0, 15).map((_, i) => (
                      <Cell key={i} fill={`rgba(99,102,241,${1 - i * 0.055})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          {/* Expérience requise */}
          <div className="col-span-1">
            <SectionCard
              icon={<Sparkles size={15} />}
              title="Expérience requise"
              subtitle="Niveau demandé par les offres"
              loading={loadingExp}
              h="h-72">
              <div className="space-y-3">
                {experience?.experience?.slice(0, 6).map((e, i) => {
                  const max = experience.experience[0]?.count || 1
                  const pct = Math.round(e.count / max * 100)
                  return (
                    <div key={e.niveau}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-400 truncate pr-2">{e.niveau}</span>
                        <span className="text-xs font-medium text-white shrink-0">{e.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, #6366f1, #a78bfa)` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── LIGNE 3 : Salaires ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Distribution salaires */}
          <SectionCard
            icon={<DollarSign size={15} />}
            title="Distribution des salaires"
            subtitle={salaires ? `${salaires.total_avec_salaire} offres avec salaire renseigné` : ''}
            loading={loadingSal}
            h="h-48">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={salaires?.tranches}>
                <XAxis dataKey="tranche" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="offres" radius={[4, 4, 0, 0]}>
                  {salaires?.tranches?.map((_, i) => (
                    <Cell key={i} fill={COLORS_DONUT[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Salaire moyen par contrat */}
          <SectionCard
            icon={<ArrowUpRight size={15} />}
            title="Salaire moyen par type de contrat"
            subtitle="Moyenne annuelle estimée"
            loading={loadingSal}
            h="h-48">
            <div className="space-y-3">
              {salaires?.par_contrat?.sort((a, b) => b.moyenne - a.moyenne).map((c, i) => (
                <div key={c.type} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS_DONUT[i] }} />
                  <span className="text-xs text-gray-400 w-24 truncate">{c.type}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${Math.min((c.moyenne / 80000) * 100, 100)}%`,
                        background: COLORS_DONUT[i]
                      }} />
                  </div>
                  <span className="text-xs font-semibold text-white shrink-0">{c.moyenne?.toLocaleString()}€</span>
                </div>
              ))}
              {salaires?.moyenne_generale > 0 && (
                <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Moyenne générale</span>
                    <span className="text-sm font-bold text-indigo-400">{salaires.moyenne_generale?.toLocaleString()}€</span>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

      </div>
    </div>
  )
}
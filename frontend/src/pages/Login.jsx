import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react'
import { login } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [erreur, setErreur]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErreur('')
  }

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setErreur('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    try {
      const res = await login(form)
      localStorage.removeItem('matching_statut')
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setErreur(err.response?.data?.detail || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#080b14] text-white flex items-center justify-center px-4">

      {/* Fond */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold">Emploitic</span>
            <span className="text-xs px-1.5 py-0.5 rounded-md text-indigo-300"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>AI</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Bon retour !</h1>
          <p className="text-gray-500 text-sm">Connectez-vous pour accéder à votre espace</p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Mail size={16} className="text-gray-500 shrink-0" />
              <input
                type="email"
                name="email"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={handleChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Mot de passe</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Lock size={16} className="text-gray-500 shrink-0" />
              <input
                type={showPwd ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
              />
              <button onClick={() => setShowPwd(!showPwd)} className="text-gray-500 hover:text-gray-300 transition">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Erreur */}
          {erreur && (
            <div className="mb-4 px-4 py-3 rounded-xl text-red-400 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {erreur}
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>

        {/* Lien inscription */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Pas encore de compte ?{' '}
          <button onClick={() => navigate('/register')} className="text-indigo-400 hover:text-indigo-300 transition">
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  )
}
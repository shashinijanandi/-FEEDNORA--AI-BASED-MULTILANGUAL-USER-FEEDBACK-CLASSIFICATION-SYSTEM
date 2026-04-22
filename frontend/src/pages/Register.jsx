import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { authAPI } from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', full_name: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authAPI.register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glow-blue mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">FeedbackAI</h1>
          <p className="text-sm text-slate-500 mt-1">Create your account</p>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-5">Register</h2>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-accent-red/10 border border-accent-red/20 rounded-xl text-sm text-accent-red">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" required value={form.full_name}
                  onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
                  placeholder="Your full name" className="input-field pl-9" />
              </div>
            </div>
            <div>
              <label className="label mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  placeholder="you@sliit.lk" className="input-field pl-9" />
              </div>
            </div>
            <div>
              <label className="label mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" required value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  placeholder="Min. 6 characters" className="input-field pl-9" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-50">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</>
              ) : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-xs text-slate-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

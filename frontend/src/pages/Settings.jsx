import { useMemo, useState } from 'react'
import { User, Shield, KeyRound, Bell, Globe, Moon, Sun, CheckCircle2, AlertCircle, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function SettingRow({ label, value, sub }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
      <div className="min-w-0">
        <div className="text-sm text-slate-300">{label}</div>
        {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
      <div className="text-sm text-right flex-shrink-0 text-slate-400">{value}</div>
    </div>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [username, setUsername] = useState(user?.full_name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [prefs, setPrefs] = useState(() => ({
    emailAlerts: localStorage.getItem('pref_email_alerts') !== 'false',
    productUpdates: localStorage.getItem('pref_product_updates') !== 'false',
    weeklySummary: localStorage.getItem('pref_weekly_summary') !== 'false',
    language: localStorage.getItem('pref_language') || 'English',
    theme: localStorage.getItem('theme') || 'dark',
  }))

  const initials = useMemo(() => {
    const source = user?.full_name || username || 'User'
    return source
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user?.full_name, username])

  const setPref = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }))
    if (typeof value === 'boolean') {
      localStorage.setItem(`pref_${key}`, String(value))
      return
    }
    if (key === 'theme') {
      document.documentElement.classList.toggle('light', value === 'light')
      localStorage.setItem('theme', value)
      return
    }
    localStorage.setItem(`pref_${key}`, value)
  }

  const handleUsernameSave = e => {
    e.preventDefault()
    const cleaned = username.trim()
    if (cleaned.length < 3) {
      setSaveMessage('Username must be at least 3 characters.')
      return
    }
    setSaveMessage('Username updated in profile settings. Connect backend endpoint to persist globally.')
  }

  const handlePasswordChange = e => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Fill all password fields.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New password and confirm password do not match.')
      return
    }
    setPasswordMessage('Password validation passed. Connect backend endpoint to apply change.')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">User Account</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-600/10 border border-brand-600/20">
              <User size={17} className="text-brand-400"/>
            </div>
            <h2 className="section-title">Profile Details</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center text-white font-bold">
                {initials}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{username || user?.full_name || 'User'}</div>
                <div className="text-xs text-slate-500">{user?.email || 'No email available'}</div>
              </div>
            </div>

            <form onSubmit={handleUsernameSave} className="space-y-3">
              <label className="block text-xs text-slate-500">Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-3 py-2 rounded-xl bg-surface-700 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
              />
              <button type="submit" className="btn-secondary text-xs">Save Username</button>
            </form>

            {saveMessage && (
              <div className="mt-3 flex items-center gap-2 text-xs text-accent-cyan">
                <CheckCircle2 size={14} />
                {saveMessage}
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-amber/10 border border-accent-amber/20">
              <KeyRound size={17} className="text-accent-amber"/>
            </div>
            <h2 className="section-title">Security</h2>
          </div>
          <div className="p-5">
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 rounded-xl bg-surface-700 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 rounded-xl bg-surface-700 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 rounded-xl bg-surface-700 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500"
              />
              <button type="submit" className="btn-secondary text-xs">Change Password</button>
            </form>

            {passwordMessage && (
              <div className="mt-3 flex items-center gap-2 text-xs text-accent-amber">
                <AlertCircle size={14} />
                {passwordMessage}
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20">
              <Bell size={17} className="text-accent-cyan"/>
            </div>
            <h2 className="section-title">Notification Preferences</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { key: 'emailAlerts', label: 'Email alerts', sub: 'Receive important account notifications.' },
              { key: 'productUpdates', label: 'Product updates', sub: 'News about feature improvements.' },
              { key: 'weeklySummary', label: 'Weekly summary', sub: 'Digest of your account activity.' },
            ].map(option => (
              <label key={option.key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-700/50 border border-white/5">
                <div>
                  <div className="text-sm text-slate-200">{option.label}</div>
                  <div className="text-[11px] text-slate-500">{option.sub}</div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[option.key]}
                  onChange={e => setPref(option.key, e.target.checked)}
                  className="w-4 h-4 accent-brand-500"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-green/10 border border-accent-green/20">
              <Shield size={17} className="text-accent-green"/>
            </div>
            <h2 className="section-title">Account Options</h2>
          </div>
          <div className="px-5 py-2">
            <SettingRow label="Email" value={user?.email || '-'} sub="Primary login email" />
            <SettingRow label="Role" value={user?.role || 'user'} sub="Permission level in platform" />
            <SettingRow label="Language" value={prefs.language} sub="Display language for interface" />
            {/*<SettingRow label="Theme" value={prefs.theme} sub="Current appearance preference" />

            <div className="flex gap-2 mt-4">
              <button onClick={() => setPref('language', 'English')} className="btn-ghost text-xs">
                <Globe size={13} />
                English
              </button>
              <button onClick={() => setPref('theme', prefs.theme === 'dark' ? 'light' : 'dark')} className="btn-ghost text-xs">
                {prefs.theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                {prefs.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>*/}
          </div>
        </div>
      </div>

      <div className="card p-5 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <LogOut size={17} className="text-brand-400"/>
          <h2 className="section-title">Session</h2>
        </div>
        <div className="flex items-center justify-between p-4 bg-surface-700/50 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{username || user?.full_name || 'User'}</div>
              <div className="text-xs text-slate-500">{user?.email} · {user?.role || 'user'}</div>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary text-xs">Sign Out</button>
        </div>
      </div>
    </div>
  )
}

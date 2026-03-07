import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersAPI } from '../api/client'
import { User, Lock, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', username: user?.username || '' })
  const [pw, setPw] = useState({ current_password: '', new_password: '' })
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPw, setLoadingPw] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setLoadingProfile(true)
    try {
      await usersAPI.updateProfile(form)
      toast.success('Profile updated')
    } catch {}
    finally { setLoadingProfile(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pw.new_password.length < 8) { toast.error('New password must be at least 8 characters'); return }
    setLoadingPw(true)
    try {
      await usersAPI.changePassword(pw)
      toast.success('Password changed')
      setPw({ current_password: '', new_password: '' })
    } catch {}
    finally { setLoadingPw(false) }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-7 flex items-center gap-2">
        <User size={24} /> Profile Settings
      </h1>

      {/* Profile info card */}
      <div className="card mb-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.full_name || user?.username}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className={`badge text-xs mt-1 ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'} capitalize`}>
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h3 className="font-medium text-gray-700 flex items-center gap-2"><User size={16} /> Update Profile</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Full Name</label>
            <input type="text" className="input-field" value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Username</label>
            <input type="text" className="input-field" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Email</label>
            <input type="email" className="input-field bg-gray-50 cursor-not-allowed" value={user?.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={loadingProfile} className="btn-primary flex items-center gap-2">
            {loadingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Password change */}
      <div className="card">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <h3 className="font-medium text-gray-700 flex items-center gap-2"><Lock size={16} /> Change Password</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Current Password</label>
            <input type="password" className="input-field" required value={pw.current_password}
              onChange={e => setPw({ ...pw, current_password: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">New Password</label>
            <input type="password" className="input-field" required value={pw.new_password}
              onChange={e => setPw({ ...pw, new_password: e.target.value })}
              placeholder="Min 8 chars, 1 uppercase, 1 number" />
          </div>
          <button type="submit" disabled={loadingPw} className="btn-primary flex items-center gap-2">
            {loadingPw ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}

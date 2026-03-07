import { useState, useEffect } from 'react'
import { usersAPI, feedbackAPI, analyticsAPI } from '../api/client'
import { Shield, Users, MessageSquare, Loader2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      usersAPI.listUsers({ page: 1, page_size: 20 }),
      analyticsAPI.getDashboard(),
      feedbackAPI.listAll({ page: 1, page_size: 10 }),
    ]).then(([u, s, f]) => {
      setUsers(u.data)
      setStats(s.data.overall)
      setFeedbacks(f.data.items)
    }).catch(() => toast.error('Failed to load admin data'))
    .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={32} className="animate-spin text-indigo-600" />
    </div>
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield size={24} /> Admin Panel
        </h1>
        <p className="text-gray-500 mt-1">System management and oversight</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats?.total_users ?? 0, icon: '👥' },
          { label: 'Total Feedbacks', value: stats?.total_feedbacks ?? 0, icon: '💬' },
          { label: 'Processed Today', value: stats?.processed_today ?? 0, icon: '⚡' },
          { label: 'Top Sentiment', value: stats?.most_common_sentiment ?? 'N/A', icon: '📊' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-xl font-bold text-gray-900 mt-1 capitalize">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={18} /> User Management
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">User</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Email</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Role</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Joined</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      {u.username}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-500">{u.email}</td>
                  <td className="py-3 px-2">
                    <span className={`badge capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2">
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All feedbacks preview */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare size={18} /> Recent Feedbacks (All Users)
        </h2>
        <div className="space-y-2">
          {feedbacks.map(fb => (
            <div key={fb.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
              <span className="text-gray-400 text-xs w-6">#{fb.id}</span>
              <p className="flex-1 text-gray-700 truncate">{fb.original_text}</p>
              <span className={`badge capitalize sentiment-${fb.sentiment} text-xs`}>{fb.sentiment}</span>
              <span className="text-gray-400 text-xs">{new Date(fb.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

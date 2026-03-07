import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { MessageSquarePlus, Users, TrendingUp, Target, ArrowRight, Loader2 } from 'lucide-react'

const SENTIMENT_COLORS = {
  happiness: '#22c55e', sadness: '#3b82f6', anger: '#ef4444',
  disgust: '#6b7280', fear: '#f59e0b', surprise: '#06b6d4', neutral: '#94a3b8',
}
const SENTIMENT_EMOJI = {
  happiness: '😊', sadness: '😢', anger: '😠', disgust: '🤢',
  fear: '😨', surprise: '😲', neutral: '😐',
}

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.getDashboard(30)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={32} className="animate-spin text-indigo-600" />
    </div>
  )

  const overall = data?.overall || {}
  const sentimentDist = data?.sentiment_distribution || []
  const dailyTrends = data?.daily_trends || []
  const recentFeedbacks = data?.recent_feedbacks || []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.username}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your feedback analytics overview</p>
        </div>
        <Link to="/feedback/submit" className="btn-primary flex items-center gap-2">
          <MessageSquarePlus size={18} />
          Submit Feedback
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={MessageSquarePlus} label="Total Feedbacks" value={overall.total_feedbacks ?? 0} sub="All time" color="indigo" />
        <StatCard icon={Users} label="Total Users" value={overall.total_users ?? 0} sub="Registered users" color="blue" />
        <StatCard icon={TrendingUp} label="Processed Today" value={overall.processed_today ?? 0} sub="Since midnight" color="green" />
        <StatCard icon={Target} label="Avg Confidence" value={`${((overall.avg_confidence ?? 0) * 100).toFixed(1)}%`} sub="Model accuracy" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sentiment Distribution Pie */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Sentiment Distribution</h2>
          {sentimentDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sentimentDist} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                    {sentimentDist.map((entry) => (
                      <Cell key={entry.label} fill={SENTIMENT_COLORS[entry.label] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {sentimentDist.slice(0, 4).map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{SENTIMENT_EMOJI[s.label]}</span>
                      <span className="capitalize text-gray-600">{s.label}</span>
                    </span>
                    <span className="font-medium text-gray-900">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data yet. Submit some feedback!
            </div>
          )}
        </div>

        {/* Daily Trend Bar */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Daily Feedback Volume (Last 8 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="happiness" stackId="a" fill="#22c55e" name="Happy" />
              <Bar dataKey="sadness" stackId="a" fill="#3b82f6" name="Sad" />
              <Bar dataKey="anger" stackId="a" fill="#ef4444" name="Angry" />
              <Bar dataKey="neutral" stackId="a" fill="#94a3b8" name="Neutral" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Feedbacks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Feedbacks</h2>
          <Link to="/feedback/history" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentFeedbacks.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <MessageSquarePlus size={40} className="mx-auto mb-3 opacity-40" />
            <p>No feedback yet. <Link to="/feedback/submit" className="text-indigo-600 hover:underline">Submit your first one!</Link></p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentFeedbacks.map((fb) => (
              <div key={fb.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-xl mt-0.5">{SENTIMENT_EMOJI[fb.sentiment] || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{fb.text_preview}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    <span className="capitalize font-medium text-gray-600">{fb.sentiment}</span>
                    {fb.confidence && ` · ${(fb.confidence * 100).toFixed(0)}% confidence`}
                    {' · '}{new Date(fb.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

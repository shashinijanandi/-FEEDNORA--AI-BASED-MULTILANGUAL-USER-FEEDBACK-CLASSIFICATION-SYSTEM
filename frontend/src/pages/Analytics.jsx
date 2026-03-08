import { useState, useEffect } from 'react'
import { analyticsAPI } from '../api/client'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Loader2, BarChart3 } from 'lucide-react'

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#06b6d4']
const SENTIMENT_COLORS = {
  happiness:'#22c55e', sadness:'#3b82f6', anger:'#ef4444',
  disgust:'#6b7280', fear:'#f59e0b', surprise:'#06b6d4', neutral:'#94a3b8'
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    analyticsAPI.getDashboard(days)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={32} className="animate-spin text-indigo-600" />
    </div>
  )

  const sentimentDist = data?.sentiment_distribution || []
  const dailyTrends = data?.daily_trends || []
  const langDist = data?.language_distribution || []
  const topics = data?.top_topics || []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={24} /> Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Insights from your feedback data</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                days === d ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sentiment distribution pie */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Sentiment Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sentimentDist} dataKey="count" nameKey="label" cx="50%" cy="50%"
                outerRadius={110} label={({ label, percentage }) => `${label} ${percentage}%`} labelLine>
                {sentimentDist.map((entry) => (
                  <Cell key={entry.label} fill={SENTIMENT_COLORS[entry.label] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily line chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Daily Trends</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="happiness" stroke="#22c55e" strokeWidth={2} dot={false} name="Happy" />
              <Line type="monotone" dataKey="sadness" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sad" />
              <Line type="monotone" dataKey="anger" stroke="#ef4444" strokeWidth={2} dot={false} name="Angry" />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Total" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Language distribution */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Language Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={langDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="language" type="category" tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Topics bar */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Top Topics by Volume</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topics.slice(0, 5).map(t => ({ name: t.label.split(' ')[0], count: t.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic cards */}
      {topics.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Trending Topics Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {topics.map((t, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl text-center">
                <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                  {i + 1}
                </div>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{t.label}</p>
                <p className="text-xs text-gray-400 mt-1 capitalize">{t.trend}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

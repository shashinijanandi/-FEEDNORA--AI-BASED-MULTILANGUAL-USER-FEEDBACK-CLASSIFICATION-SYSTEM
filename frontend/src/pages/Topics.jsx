import { useState, useEffect } from 'react'
import { topicsAPI } from '../api/client'
import { Tags, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from 'lucide-react'

const TREND_CONFIG = {
  rising:  { icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50',  label: 'Rising'  },
  falling: { icon: TrendingDown, color: 'text-red-500',    bg: 'bg-red-50',    label: 'Falling' },
  stable:  { icon: Minus,        color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Stable'  },
}

const PERIOD_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

function TopicCard({ topic, rank }) {
  const trend = TREND_CONFIG[topic.trend] || TREND_CONFIG.stable
  const TrendIcon = trend.icon

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
            #{rank}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{topic.label}</h3>
            <p className="text-xs text-gray-400">{topic.document_count} feedbacks</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trend.bg} ${trend.color}`}>
          <TrendIcon size={12} />
          {trend.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Coverage</span>
          <span className="font-medium text-gray-700">{topic.percentage}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
            style={{ width: `${Math.min(topic.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Keywords */}
      <div className="flex flex-wrap gap-1.5">
        {(topic.keywords || []).slice(0, 6).map((kw, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600"
            style={{ opacity: Math.max(0.5, kw.weight || 0.7) }}
          >
            {kw.word}
          </span>
        ))}
      </div>

      {topic.coherence_score && (
        <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
          Coherence score: <span className="font-medium text-gray-600">{topic.coherence_score.toFixed(3)}</span>
        </div>
      )}
    </div>
  )
}

export default function TopicsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const load = async () => {
    setLoading(true)
    try {
      const { data: res } = await topicsAPI.getTrending(days)
      setData(res)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [days])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tags size={24} /> Dynamic Topic Modeling
          </h1>
          <p className="text-gray-500 mt-1">
            Automatically extracted trending topics from feedback corpus
            {data && ` · ${data.total_feedbacks_analyzed} feedbacks analyzed`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === opt.value ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} className="btn-secondary p-2.5">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
          🧠
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-900">Dynamic Topic Modeling (Component 2)</p>
          <p className="text-xs text-purple-700 mt-0.5">
            This component uses LDA-based dynamic topic extraction to identify trending themes from the feedback corpus.
            Topics are updated in real-time as new feedback arrives and are ranked by frequency and trend direction.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <Loader2 size={36} className="animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Extracting topics from feedback corpus...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Rising Topics', count: data?.topics?.filter(t => t.trend === 'rising').length || 0, color: 'green' },
              { label: 'Stable Topics', count: data?.topics?.filter(t => t.trend === 'stable').length || 0, color: 'yellow' },
              { label: 'Falling Topics', count: data?.topics?.filter(t => t.trend === 'falling').length || 0, color: 'red' },
            ].map(s => (
              <div key={s.label} className={`card text-center bg-${s.color}-50 border-${s.color}-100`}>
                <p className="text-3xl font-bold text-gray-900">{s.count}</p>
                <p className="text-sm text-gray-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Topic cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.topics || []).map((topic, i) => (
              <TopicCard key={topic.topic_id || i} topic={topic} rank={i + 1} />
            ))}
          </div>

          {data && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Generated at {new Date(data.generated_at).toLocaleString()} · Period: last {days} days
            </p>
          )}
        </>
      )}
    </div>
  )
}

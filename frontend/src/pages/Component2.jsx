import { useState, useEffect } from 'react'
import { topicsAPI, feedbackAPI } from '../api/client'
import { Tags, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Send, Brain } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import toast from 'react-hot-toast'

const TREND_CONFIG = {
  rising:  { icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  label: 'Rising'  },
  falling: { icon: TrendingDown, color: 'text-red-500',    bg: 'bg-red-50 border-red-200',      label: 'Falling' },
  stable:  { icon: Minus,        color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200',label: 'Stable'  },
}

const TOPIC_COLORS = [
  '#6366f1','#22c55e','#f59e0b','#ef4444',
  '#3b82f6','#8b5cf6','#06b6d4','#f97316'
]

export default function Component2Page() {
  const [trendingData, setTrendingData] = useState(null)
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [days, setDays] = useState(30)

  // Single text analysis
  const [text, setText] = useState('')
  const [loadingText, setLoadingText] = useState(false)
  const [textTopics, setTextTopics] = useState(null)

  const loadTrending = async () => {
    setLoadingTrending(true)
    try {
      const { data } = await topicsAPI.getTrending(days)
      setTrendingData(data)
    } catch {}
    finally { setLoadingTrending(false) }
  }

  useEffect(() => { loadTrending() }, [days])

  const handleAnalyzeText = async () => {
    if (text.trim().length < 5) { toast.error('Please enter at least 5 characters'); return }
    setLoadingText(true)
    try {
      const { data } = await feedbackAPI.submit({ text: text.trim(), category: 'general' })
      setTextTopics(data.topics || [])
      toast.success('Topics extracted!')
    } catch {
      toast.error('Failed. Please try again.')
    } finally {
      setLoadingText(false)
    }
  }

  const topics = trendingData?.topics || []
  const barData = topics.slice(0, 6).map(t => ({
    name: t.label.split(' ').slice(0, 2).join(' '),
    count: t.document_count,
    percentage: t.percentage,
  }))

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* ── Component Header ─────────────────────────────────────── */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center">
            <Tags size={28} className="text-white" />
          </div>
          <div>
            <p className="text-purple-200 text-sm font-medium uppercase tracking-wider">Research Component 2</p>
            <h1 className="text-2xl font-bold">Dynamic Topic Modeling</h1>
            <p className="text-purple-200 text-sm mt-1">
              Feedback Corpus → LDA-Based Topic Extraction → Trend Analysis → Ranked Topic Visualization
            </p>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { step: '01', label: 'Collect Corpus',    desc: 'Gather feedback texts'         },
            { step: '02', label: 'Preprocess Text',   desc: 'Tokenize & remove stopwords'   },
            { step: '03', label: 'LDA Extraction',    desc: 'Extract latent topic clusters' },
            { step: '04', label: 'Trend Analysis',    desc: 'Rising / Stable / Falling'     },
          ].map((s, i) => (
            <div key={i} className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
              <span className="text-purple-300 text-xs font-bold">STEP {s.step}</span>
              <p className="text-white font-semibold text-sm mt-1">{s.label}</p>
              <p className="text-purple-200 text-xs mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Single Text Topic Extraction ─────────────────────────── */}
      <div className="card mb-6 border-2 border-purple-100">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain size={18} className="text-purple-600" />
          Extract Topics from Single Feedback
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Enter any feedback text to extract topics instantly..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAnalyzeText() }}
          />
          <button
            onClick={handleAnalyzeText}
            disabled={loadingText || text.length < 5}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            {loadingText ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Extract Topics
          </button>
        </div>

        {/* Topic results for single text */}
        {textTopics && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-3">
              Extracted Topics
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {textTopics.map((t, i) => (
                <div key={i} className="p-3 rounded-xl border border-purple-100 bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }}>
                      {i + 1}
                    </div>
                    <span className="text-xs font-semibold text-purple-700">
                      {Math.round((t.probability || 0) * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(t.keywords || []).slice(0, 4).map((kw, j) => (
                      <span key={j} className="text-xs bg-white border border-purple-100 text-purple-700 px-2 py-0.5 rounded-lg">
                        {kw.word}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Trending Topics Section ───────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 text-lg">
          Trending Topics from Feedback Corpus
          {trendingData && (
            <span className="text-sm text-gray-400 font-normal ml-2">
              — {trendingData.total_feedbacks_analyzed} feedbacks analyzed
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === d ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={loadTrending} disabled={loadingTrending}
            className="btn-secondary p-2.5">
            <RefreshCw size={16} className={loadingTrending ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loadingTrending ? (
        <div className="flex justify-center py-20">
          <div className="text-center">
            <Loader2 size={36} className="animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Extracting topics from feedback corpus...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Trend summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Rising Topics',  count: topics.filter(t => t.trend === 'rising').length,  color: 'green' },
              { label: 'Stable Topics',  count: topics.filter(t => t.trend === 'stable').length,  color: 'yellow' },
              { label: 'Falling Topics', count: topics.filter(t => t.trend === 'falling').length, color: 'red'   },
            ].map(s => (
              <div key={s.label} className={`card text-center bg-${s.color}-50 border border-${s.color}-100`}>
                <p className="text-3xl font-bold text-gray-900">{s.count}</p>
                <p className="text-sm text-gray-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Bar chart */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Topic Volume Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v) => [v, 'Feedbacks']} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {barData.map((_, i) => (
                      <rect key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Topic Coverage Radar</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={topics.slice(0, 6).map(t => ({
                  topic: t.label.split(' ')[0],
                  value: t.percentage,
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fontSize: 9 }} />
                  <Radar name="Coverage" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Topic cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topics.map((topic, i) => {
              const trend = TREND_CONFIG[topic.trend] || TREND_CONFIG.stable
              const TrendIcon = trend.icon
              return (
                <div key={i} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }}>
                      #{i + 1}
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border ${trend.bg} ${trend.color}`}>
                      <TrendIcon size={11} />
                      {trend.label}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{topic.label}</h3>
                  <p className="text-xs text-gray-400 mb-3">{topic.document_count} feedbacks · {topic.percentage}%</p>

                  {/* Coverage bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(topic.percentage * 3, 100)}%`,
                        backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length]
                      }}
                    />
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1">
                    {(topic.keywords || []).slice(0, 5).map((kw, j) => (
                      <span key={j}
                        className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">
                        {kw.word}
                      </span>
                    ))}
                  </div>

                  {topic.coherence_score && (
                    <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-50">
                      Coherence: <span className="font-medium text-gray-600">{topic.coherence_score.toFixed(3)}</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {trendingData && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Generated: {new Date(trendingData.generated_at).toLocaleString()} · Period: last {days} days
            </p>
          )}
        </>
      )}
    </div>
  )
}

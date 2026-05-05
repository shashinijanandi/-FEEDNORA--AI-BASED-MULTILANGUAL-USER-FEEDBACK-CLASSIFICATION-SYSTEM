import { useState } from 'react'
import { feedbackAPI } from '../api/client'
import { Send, Loader2, CheckCircle2, MessageSquare, Tag, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const SENTIMENT_CONFIG = {
  happiness: { emoji: '😊', color: 'green', label: 'Happiness' },
  sadness:   { emoji: '😢', color: 'blue',  label: 'Sadness'  },
  anger:     { emoji: '😠', color: 'red',   label: 'Anger'    },
  disgust:   { emoji: '🤢', color: 'gray',  label: 'Disgust'  },
  fear:      { emoji: '😨', color: 'yellow',label: 'Fear'     },
  surprise:  { emoji: '😲', color: 'cyan',  label: 'Surprise' },
  neutral:   { emoji: '😐', color: 'slate', label: 'Neutral'  },
}

const CATEGORIES = ['general', 'product', 'service', 'delivery', 'support', 'pricing', 'other']

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-600">Confidence</span>
        <span className="font-semibold text-gray-900">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (text.trim().length < 5) { toast.error('Please enter at least 5 characters'); return }
    setLoading(true)
    setResult(null)
    try {
      const { data } = await feedbackAPI.submit({ text: text.trim(), category })
      setResult(data)
      toast.success('Feedback analyzed successfully!')
    } catch (err) {
      toast.error('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sentiment = result?.sentiment?.label
  const cfg = sentiment ? SENTIMENT_CONFIG[sentiment] : null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Submit Feedback</h1>
        <p className="text-gray-500 mt-1">Your feedback is analyzed in real-time using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={16} className="inline mr-1.5" />
                Your Feedback
              </label>
              <textarea
                rows={7}
                className="input-field resize-none"
                placeholder="Write your feedback here... (e.g., 'The product quality exceeded my expectations. Delivery was fast and packaging was excellent!')"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') handleSubmit(e) }}
              />
              <p className="text-xs text-gray-400 mt-1.5">{text.length} chars · Ctrl+Enter to submit</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} className="inline mr-1.5" />
                Category
              </label>
              <select
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading || text.length < 5} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? 'Analyzing...' : 'Analyze Feedback'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          {loading && (
            <div className="card flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                <Zap size={28} className="text-indigo-600 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Analyzing your feedback...</p>
                <p className="text-sm text-gray-400 mt-1">Running sentiment model & topic extraction</p>
              </div>
            </div>
          )}

          {result && !loading && cfg && (
            <div className="space-y-4">
              {/* Sentiment result */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <h3 className="font-semibold text-gray-900">Analysis Complete</h3>
                  <span className="text-xs text-gray-400 ml-auto">{result.processing_time_ms}ms</span>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-semibold mb-4 sentiment-${sentiment}`}>
                  <span>{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                </div>

                <ConfidenceBar value={result.sentiment?.confidence || 0} />

                {/* Probability breakdown */}
                <div className="mt-4 space-y-1.5">
                  {Object.entries(result.sentiment?.probabilities || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([label, prob]) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        <span className="w-20 text-gray-500 capitalize">{label}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-400"
                            style={{ width: `${Math.round(prob * 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-gray-500">{Math.round(prob * 100)}%</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Generated Response */}
              <div className="card border-l-4 border-indigo-400">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">
                  Generated Response
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{result.generated_response}</p>
              </div>

              {/* Topics */}
              {result.topics?.length > 0 && (
                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-3">
                    Extracted Topics
                  </p>
                  <div className="space-y-2">
                    {result.topics.map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.label}</p>
                          <p className="text-xs text-gray-400">
                            {t.keywords?.slice(0, 3).map(k => k.word).join(', ')}
                          </p>
                        </div>
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg font-medium">
                          {Math.round((t.probability || 0) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-gray-400">Language detected: <strong>{result.detected_language?.toUpperCase()}</strong></p>
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center min-h-[300px] text-center text-gray-400">
              <MessageSquare size={40} className="mb-3 opacity-30" />
              <p className="font-medium">Results will appear here</p>
              <p className="text-sm mt-1">Submit feedback to see AI analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

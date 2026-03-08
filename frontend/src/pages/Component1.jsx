import { useState } from 'react'
import { feedbackAPI } from '../api/client'
import { Send, Loader2, Brain, MessageSquare, BarChart2, CheckCircle2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const SENTIMENT_CONFIG = {
  happiness: { emoji: '😊', color: 'bg-green-100 text-green-800',  bar: 'bg-green-500',  label: 'Happiness' },
  sadness:   { emoji: '😢', color: 'bg-blue-100 text-blue-800',    bar: 'bg-blue-500',   label: 'Sadness'   },
  anger:     { emoji: '😠', color: 'bg-red-100 text-red-800',      bar: 'bg-red-500',    label: 'Anger'     },
  disgust:   { emoji: '🤢', color: 'bg-gray-100 text-gray-800',    bar: 'bg-gray-500',   label: 'Disgust'   },
  fear:      { emoji: '😨', color: 'bg-yellow-100 text-yellow-800',bar: 'bg-yellow-500', label: 'Fear'      },
  surprise:  { emoji: '😲', color: 'bg-cyan-100 text-cyan-800',    bar: 'bg-cyan-500',   label: 'Surprise'  },
  neutral:   { emoji: '😐', color: 'bg-slate-100 text-slate-700',  bar: 'bg-slate-400',  label: 'Neutral'   },
}

const SAMPLE_FEEDBACKS = [
  "This product is absolutely amazing! I love everything about it.",
  "I am very disappointed. The quality is terrible and I want a refund.",
  "I am really angry. This is the worst service I have ever experienced!",
  "I am worried about the safety of this product. Please check it.",
  "I didn't expect this at all! What a surprising experience.",
  "This is disgusting. I cannot believe you sold me this.",
]

export default function Component1Page() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const handleAnalyze = async () => {
    if (text.trim().length < 5) { toast.error('Please enter at least 5 characters'); return }
    setLoading(true)
    try {
      const { data } = await feedbackAPI.submit({ text: text.trim(), category: 'general' })
      setResult(data)
      setHistory(prev => [{ text: text.trim(), result: data }, ...prev].slice(0, 5))
      toast.success('Analysis complete!')
    } catch {
      toast.error('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sentiment = result?.sentiment?.label
  const cfg = sentiment ? SENTIMENT_CONFIG[sentiment] : null

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* ── Component Header ─────────────────────────────────────── */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">Research Component 1</p>
            <h1 className="text-2xl font-bold">Personalized Feedback Response Generation</h1>
            <p className="text-indigo-200 text-sm mt-1">
              TF-IDF Vectorization → Logistic Regression Classification → Template-Based Response Generation
            </p>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { step: '01', label: 'Input Text',         desc: 'User submits feedback'         },
            { step: '02', label: 'TF-IDF Vectorize',   desc: 'Text → numerical features'     },
            { step: '03', label: 'LR Classify',        desc: 'Predict sentiment + confidence' },
            { step: '04', label: 'Generate Response',  desc: 'Return personalized reply'     },
          ].map((s, i) => (
            <div key={i} className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
              <span className="text-indigo-300 text-xs font-bold">STEP {s.step}</span>
              <p className="text-white font-semibold text-sm mt-1">{s.label}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Input ──────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Input card */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-600" />
              Input Feedback Text
            </h2>

            <textarea
              rows={6}
              className="input-field resize-none mb-3"
              placeholder="Enter any feedback text here to test the model..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') handleAnalyze() }}
            />
            <p className="text-xs text-gray-400 mb-4">{text.length} characters · Ctrl+Enter to analyze</p>

            <button
              onClick={handleAnalyze}
              disabled={loading || text.length < 5}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? 'Running Model...' : 'Analyze with Trained Model'}
            </button>
          </div>

          {/* Sample inputs */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Quick Test Samples</h3>
            <div className="space-y-2">
              {SAMPLE_FEEDBACKS.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setText(sample)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-gray-50
                             hover:bg-indigo-50 hover:text-indigo-700 text-gray-600
                             border border-gray-100 hover:border-indigo-200 transition-all"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Recent Predictions</h3>
              <div className="space-y-2">
                {history.map((h, i) => {
                  const c = SENTIMENT_CONFIG[h.result?.sentiment?.label]
                  return (
                    <div key={i}
                      className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => { setText(h.text); setResult(h.result) }}
                    >
                      <span className="text-lg">{c?.emoji}</span>
                      <p className="text-xs text-gray-600 truncate flex-1">{h.text}</p>
                      <span className={`badge text-xs capitalize ${c?.color}`}>{h.result?.sentiment?.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Results ───────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Loading state */}
          {loading && (
            <div className="card flex flex-col items-center justify-center min-h-[200px] gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                <Brain size={28} className="text-indigo-600 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Running Component 1...</p>
                <p className="text-sm text-gray-400 mt-1">TF-IDF → Logistic Regression → Response</p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && cfg && (
            <>
              {/* Sentiment Result */}
              <div className="card border-2 border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-600" />
                    Sentiment Classification Result
                  </h3>
                  <span className="text-xs text-gray-400">{result.processing_time_ms}ms</span>
                </div>

                {/* Big sentiment badge */}
                <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-xl font-bold mb-5 ${cfg.color}`}>
                  <span className="text-3xl">{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                </div>

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Model Confidence</span>
                    <span className="font-bold text-gray-900">
                      {Math.round((result.sentiment?.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                      style={{ width: `${Math.round((result.sentiment?.confidence || 0) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* All class probabilities */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    All Class Probabilities
                  </p>
                  {Object.entries(result.sentiment?.probabilities || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, prob]) => {
                      const c = SENTIMENT_CONFIG[label]
                      return (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-sm w-4">{c?.emoji}</span>
                          <span className="text-xs text-gray-500 capitalize w-20">{label}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c?.bar || 'bg-gray-400'}`}
                              style={{ width: `${Math.round(prob * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10 text-right">
                            {Math.round(prob * 100)}%
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Generated Response */}
              <div className="card border-l-4 border-indigo-500">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} />
                  Generated Personalized Response
                </p>
                <p className="text-gray-800 leading-relaxed">{result.generated_response}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Response type:</span>
                  <span className={`badge text-xs capitalize ${cfg.color}`}>
                    {cfg.emoji} {cfg.label} Response
                  </span>
                </div>
              </div>

              {/* Technical details */}
              <div className="card bg-gray-50">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Technical Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: 'Model Type',        value: 'Logistic Regression'     },
                    { label: 'Vectorizer',         value: 'TF-IDF'                 },
                    { label: 'Detected Language',  value: result.detected_language?.toUpperCase() || 'EN' },
                    { label: 'Processing Time',    value: `${result.processing_time_ms}ms`   },
                    { label: 'Feedback ID',        value: `#${result.feedback_id}`            },
                    { label: 'Response Method',    value: 'Template-Based'                    },
                  ].map(d => (
                    <div key={d.label} className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-gray-400">{d.label}</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center min-h-[300px] text-center text-gray-400">
              <Brain size={48} className="mb-4 opacity-20" />
              <p className="font-semibold text-gray-500">Component 1 Ready</p>
              <p className="text-sm mt-1">Enter feedback text and click Analyze</p>
              <p className="text-xs mt-1 text-gray-300">or click a sample feedback on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

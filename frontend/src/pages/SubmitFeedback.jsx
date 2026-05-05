import { useState } from 'react'
import {
  Send, RefreshCw, Edit3, CheckCircle2, AlertCircle, ChevronDown,
  ChevronUp, FileText, Brain, BarChart2, Sparkles, Zap, Copy, ThumbsUp
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ConfidenceRing, ProgressBar, SentimentBadge, CustomTooltip } from '../components/UI'
import { feedbackAPI } from '../api/client'

const PIPELINE_STEPS = [
  { id: 'preprocess', label: 'Preprocessing Text',              sub: 'Tokenization · Stopword removal · Lemmatization',      icon: FileText  },
  { id: 'topic',      label: 'Running Dynamic Topic Model',     sub: 'Keyword extraction · topic ranking',     icon: Brain     },
  { id: 'sentiment',  label: 'Detecting Sentiment',             sub: 'sentiment_model.pkl → LR classifier · TF-IDF features',icon: BarChart2 },
  { id: 'generate',   label: 'Generating Intelligent Response', sub: 'Context-conditioned response template + T5 beam search',icon: Sparkles  },
  { id: 'evaluate',   label: 'Evaluating Response Quality',     sub: 'BLEU · ROUGE-L · Semantic similarity scoring',         icon: Zap       },
]

const CATEGORIES = ['Electronics','Fashion','Home & Kitchen','Books','Beauty & Health','Sports & Outdoors','Toys & Games','Automotive']

const SAMPLE_FEEDBACKS = [
  'My order has been stuck in transit for 5 days without any tracking update. Completely unacceptable.',
  'Excellent quality product! Arrived earlier than expected and the packaging was absolutely perfect.',
  'Payment failed three times but money was still deducted from my account each time. Need urgent resolution.',
  'The mobile app keeps crashing every time I try to view order tracking. Very frustrating experience.',
  'Great customer support! The agent resolved my issue within minutes. Highly satisfied with the service.',
]

export default function SubmitFeedback() {
  const [feedbackText, setFeedbackText] = useState('')
  const [category,     setCategory]     = useState('Electronics')
  const [language,     setLanguage]     = useState('EN')
  const [pipelineState, setPipelineState] = useState({})
  const [analyzing,    setAnalyzing]    = useState(false)
  const [results,      setResults]      = useState(null)
  const [error,        setError]        = useState(null)
  const [evalOpen,     setEvalOpen]     = useState(false)
  const [editMode,     setEditMode]     = useState(false)
  const [editedResp,   setEditedResp]   = useState('')
  const [copied,       setCopied]       = useState(false)

  /* ── Animate pipeline steps while API call is in-flight ── */
  const animatePipeline = async () => {
    for (const step of PIPELINE_STEPS) {
      setPipelineState(prev => ({ ...prev, [step.id]: 'active' }))
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300))
    }
  }

  const handleAnalyze = async () => {
    if (!feedbackText.trim()) return
    setResults(null)
    setError(null)
    setAnalyzing(true)
    setPipelineState({})

    // Start animation + real API call simultaneously
    const [apiResult] = await Promise.all([
      feedbackAPI.submit({ text: feedbackText, language, product_category: category })
        .then(r => r.data)
        .catch(err => { throw err }),
      animatePipeline(),
    ])

    // Mark all steps done
    const done = {}
    PIPELINE_STEPS.forEach(s => { done[s.id] = 'done' })
    setPipelineState(done)

    setResults(apiResult)
    setEditedResp(apiResult.generated_response)
    setAnalyzing(false)
  }

  const handleRegenerate = async () => {
    if (!results) return
    setAnalyzing(true)
    try {
      const { data } = await feedbackAPI.regenerate(results.id)
      setResults(prev => ({ ...prev, generated_response: data.generated_response,
        evaluation: { bleu_score: data.bleu_score, rouge_l_score: data.rouge_l_score,
          semantic_similarity: data.semantic_similarity, model_confidence: data.model_confidence } }))
      setEditedResp(data.generated_response)
    } catch (e) {
      setError('Regeneration failed: ' + (e.response?.data?.detail || e.message))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(results?.generated_response || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStepStatus = (id) => pipelineState[id] || 'pending'

  const sentimentColor = { positive: '#34d399', neutral: '#64748b', negative: '#f87171' }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Submit & Analyze Feedback</h1>
        {/*p className="text-sm text-slate-500 mt-1">
          Live pipeline: your <span className="font-mono text-brand-400">sentiment_model.pkl</span> →
          Dynamic LDA → Response Generation → BLEU/ROUGE Evaluation
        </p*/}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── LEFT PANEL ── */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">Customer Feedback Input</h2>

            {/* Sample buttons */}
            <div className="mb-3">
              <div className="label mb-2">Quick Fill</div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_FEEDBACKS.map((s, i) => (
                  <button key={i} onClick={() => setFeedbackText(s)}
                    className="text-[11px] px-2.5 py-1 bg-surface-700 hover:bg-surface-600 text-slate-400
                               hover:text-slate-200 rounded-lg border border-white/5 transition-all">
                    Sample {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Enter customer feedback text here…"
              rows={6}
              className="input-field resize-none mb-4"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="label mb-1.5 block">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block">Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="input-field">
                  <option value="EN">English (EN)</option>
                  <option value="SI">Sinhala (SI)</option>
                  <option value="TA">Tamil (TA)</option>
                </select>
              </div>
            </div>

            <button onClick={handleAnalyze}
              disabled={!feedbackText.trim() || analyzing}
              className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {analyzing
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Calling API…</>
                : <><Send size={15}/>Analyze</>}
            </button>

            {error && (
              <div className="mt-3 p-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-xs text-accent-red">
                {error}
              </div>
            )}
          </div>

          {/* Pipeline Steps — shown when analyzing or after result */}
          {(analyzing || results) && (
            <div className="card p-5 animate-slide-in-up">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="section-title">AI Processing Pipeline</h2>
                <span className="text-[10px] px-2 py-0.5 bg-brand-900/40 text-brand-400 border border-brand-700/30 rounded-lg font-mono">
                  POST /api/v1/feedback/submit
                </span>
              </div>
              <div className="space-y-2">
                {PIPELINE_STEPS.map((step, idx) => {
                  const status = getStepStatus(step.id)
                  const Icon = step.icon
                  return (
                    <div key={step.id}
                      className={`pipeline-step ${status==='done' ? 'pipeline-step-done' : status==='active' ? 'pipeline-step-active' : 'pipeline-step-pending'}`}
                      style={{ animationDelay: `${idx * 0.08}s` }}>
                      <div className="flex-shrink-0">
                        {status === 'active' && (
                          <div className="w-7 h-7 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-brand-400/40 border-t-brand-400 rounded-full animate-spin"/>
                          </div>
                        )}
                        {status === 'done' && (
                          <div className="w-7 h-7 rounded-lg bg-accent-green/20 border border-accent-green/30 flex items-center justify-center">
                            <CheckCircle2 size={14} className="text-accent-green"/>
                          </div>
                        )}
                        {status === 'pending' && (
                          <div className="w-7 h-7 rounded-lg bg-surface-600 border border-white/5 flex items-center justify-center">
                            <Icon size={14} className="text-slate-600"/>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${status==='done' ? 'text-accent-green' : status==='active' ? 'text-brand-300' : 'text-slate-600'}`}>
                          {step.label}
                        </div>
                        <div className="text-[10px] text-slate-600 truncate">{step.sub}</div>
                      </div>
                      <span className={`text-[10px] font-mono ${status==='done' ? 'text-accent-green' : status==='active' ? 'text-brand-400' : 'text-slate-700'}`}>
                        {status === 'done' ? 'done' : status === 'active' ? 'running…' : 'waiting'}
                      </span>
                    </div>
                  )
                })}
              </div>

              {results && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green"/>
                  <span className="text-[11px] text-accent-green">
                    Feedback #{results.id} saved to PostgreSQL ·
                    processed by <span className="font-mono">sentiment_model.pkl</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — real API results ── */}
        {results && (
          <div className="space-y-4 animate-slide-in-right">

            {/* ① Sentiment — from your .pkl model */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="label">① Sentiment Detection</div>
                <span className="text-[10px] font-mono text-slate-600">sentiment_model.pkl → LR classifier</span>
              </div>
              <div className="flex items-center gap-6">
                <ConfidenceRing
                  value={results.sentiment_conf}
                  color={sentimentColor[results.sentiment] || '#64748b'}
                  label="Confidence"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <SentimentBadge sentiment={results.sentiment}/>
                    <span className="text-xs text-slate-500">from your trained LR model</span>
                  </div>
                  <div className="text-2xl font-display font-bold capitalize"
                    style={{ color: sentimentColor[results.sentiment] }}>
                    {results.sentiment}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 font-mono">
                    vectorizer.pkl → TF-IDF → predict_proba()
                  </div>
                  <ProgressBar value={results.sentiment_conf}
                    color={sentimentColor[results.sentiment]} showPct className="mt-3"/>
                </div>
              </div>
            </div>

            {/* ② Topic Modeling — from topic detection */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="label">② Dynamic Topic Modeling</div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-display font-bold text-white">{results.topic.name}</div>
                  <div className="text-sm text-slate-500">
                    Probability: <span className="text-accent-cyan font-medium">{results.topic.probability.toFixed(1)}%</span>
                  </div>
                </div>
                
              </div>

              {results.topic.keywords?.length > 0 && (
                <div className="mb-4">
                  <div className="label mb-2">Matched Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    {results.topic.keywords.map(k => (
                      <span key={k} className="keyword-tag">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {results.topic.all_topics?.length > 0 && (
                <div className="mb-4">
                  <div className="label mb-2">All Topic Scores</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={results.topic.all_topics}
                      margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }}/>
                      <YAxis hide/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="prob" radius={[4,4,0,0]}>
                        {results.topic.all_topics.map((d,i) => (
                          <Cell key={i} fill={d.color || '#22d3ee'}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="p-3 bg-surface-700/50 rounded-xl border border-white/5">
                <div className="label mb-2">Context Passed to Generator</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-600">Sentiment:</span> <span className="text-slate-300 capitalize">{results.sentiment}</span></div>
                  <div><span className="text-slate-600">Topic:</span> <span className="text-slate-300">{results.topic.name.split(' ')[0]}</span></div>
                  <div><span className="text-slate-600">Keywords:</span> <span className="text-slate-300">{results.topic.keywords?.slice(0,2).join(', ') || '—'}</span></div>
                </div>
              </div>
            </div>

            {/* ③ Generated Response */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="label">③ Generated Response</div>
                {results.approval_status === 'auto' ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-green/10 border border-accent-green/20 rounded-lg">
                    <CheckCircle2 size={11} className="text-accent-green"/>
                    <span className="text-[11px] text-accent-green">Auto Approved</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-amber/10 border border-accent-amber/20 rounded-lg">
                    <AlertCircle size={11} className="text-accent-amber"/>
                    <span className="text-[11px] text-accent-amber">Needs Review</span>
                  </div>
                )}
              </div>

              {editMode ? (
                <textarea value={editedResp} onChange={e => setEditedResp(e.target.value)}
                  rows={5} className="input-field resize-none mb-3"/>
              ) : (
                <div className="p-4 bg-surface-700/50 rounded-xl border border-white/5 mb-3">
                  <p className="text-sm text-slate-300 leading-relaxed">{results.generated_response}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleRegenerate} disabled={analyzing}
                  className="btn-primary flex-1 justify-center text-xs py-2 disabled:opacity-50">
                  <RefreshCw size={13}/> Regenerate
                </button>
                <button onClick={() => setEditMode(v => !v)} className="btn-secondary text-xs py-2 px-3">
                  <Edit3 size={13}/> {editMode ? 'Save' : 'Edit'}
                </button>
                <button onClick={handleCopy} className="btn-secondary text-xs py-2 px-3">
                  {copied ? <ThumbsUp size={13} className="text-accent-green"/> : <Copy size={13}/>}
                </button>
              </div>
            </div>

            {/* ④ Evaluation — collapsible */}
            <div className="card overflow-hidden">
              <button onClick={() => setEvalOpen(v => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-700/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="label">④ Evaluation Metrics</div>
                  <span className="text-[10px] font-mono text-slate-600">BLEU · ROUGE-L · Semantic</span>
                </div>
                {evalOpen ? <ChevronUp size={15} className="text-slate-500"/> : <ChevronDown size={15} className="text-slate-500"/>}
              </button>
              {evalOpen && results.evaluation && (
                <div className="px-5 pb-5 space-y-3 animate-slide-in-up">
                  {[
                    { label: 'BLEU Score',           value: results.evaluation.bleu_score * 100,          display: results.evaluation.bleu_score.toFixed(3),          color: '#22d3ee' },
                    { label: 'ROUGE-L Score',         value: results.evaluation.rouge_l_score * 100,       display: results.evaluation.rouge_l_score.toFixed(3),        color: '#34d399' },
                    { label: 'Semantic Similarity',   value: results.evaluation.semantic_similarity,       display: `${results.evaluation.semantic_similarity.toFixed(1)}%`, color: '#a78bfa' },
                    { label: 'Model Confidence',      value: results.evaluation.model_confidence,          display: `${results.evaluation.model_confidence.toFixed(1)}%`, color: '#fbbf24' },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-500">{m.label}</span>
                        <span className="text-xs font-mono font-medium text-white">{m.display}</span>
                      </div>
                      <ProgressBar value={m.value} color={m.color}/>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/5 text-[11px] text-slate-600 font-mono">
                    Feedback ID #{results.id} · Saved to feedbacks table
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* import { useState } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Brain, Hash, RefreshCw } from 'lucide-react'
import { topicsAPI } from '../api/client'
import { useApi, LoadingSpinner, ApiError } from '../hooks/useApi'
import { SectionHeader, ProgressBar, CustomTooltip } from '../components/UI'

function WordCloud({ keywords, color }) {
  if (!keywords?.length) return <div className="p-4 text-slate-600 text-sm text-center">No keywords</div>
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-surface-700/30 rounded-xl min-h-[80px] items-center justify-center">
      {[...keywords].sort((a,b) => b.weight - a.weight).map(kw => (
        <span key={kw.word} className="font-mono font-medium transition-all hover:scale-110 cursor-default"
          style={{ fontSize: 10 + kw.weight * 10, color, opacity: 0.4 + kw.weight * 0.6 }}>
          {kw.word}
        </span>
      ))}
    </div>
  )
}

function TrendBadge({ trend, delta }) {
  if (trend === 'Rising')  return <div className="flex items-center gap-1 text-accent-cyan  text-xs font-medium"><TrendingUp  size={13}/><span>+{Math.abs(delta)}%</span></div>
  if (trend === 'Falling') return <div className="flex items-center gap-1 text-accent-amber text-xs font-medium"><TrendingDown size={13}/><span>-{Math.abs(delta)}%</span></div>
  return <div className="flex items-center gap-1 text-slate-500 text-xs font-medium"><Minus size={13}/><span>Stable</span></div>
}

export default function TopicModeling() {
  {/*const { data: topics, loading, error, refetch } = useApi(() => topicsAPI.list())
  const { data: topics, loading, error, refetch } = useApi(() =>
    topicsAPI.list({ from_user_feedback: true }),
  )
  const { data: artifactData } = useApi(() => topicsAPI.artifacts())
  const [selectedId, setSelectedId] = useState(null)
  const [reloadState, setReloadState] = useState({ loading: false, error: '', ok: '' })

  const refreshFromTrainedModel = async () => {
    setReloadState({ loading: true, error: '', ok: '' })
    try {
      const res = await topicsAPI.reload()
      await refetch()
      setReloadState({ loading: false, error: '', ok: `Synced ${res.data?.synced_topics ?? 0} topics from trained artifacts.` })
    } catch (e) {
      setReloadState({ loading: false, error: e?.response?.data?.detail || 'Failed to sync trained model artifacts.', ok: '' })
    }
  }

  if (loading) return <LoadingSpinner message="Loading topic model data…" />
  if (error)   return <div className="p-6"><ApiError error={error} onRetry={refetch} /></div>
  if (!topics?.length) return (

    <div className="p-6 flex flex-col items-center justify-center py-20 text-slate-500 text-center max-w-md mx-auto">
      <p className="font-medium text-slate-400">No matching topics yet</p>
      <p className="text-sm mt-2">
        This list shows LDA topics that match your <strong className="text-slate-300">analyzed feedback</strong> (the topic name saved when you submit feedback).
        Submit feedback while signed in, then refresh this page.
      </p>
    </div>
  )

  const activeId = selectedId || topics[0]?.id
  const selected = topics.find(t => t.id === activeId) || topics[0]
  const modelMeta = {
    version: selected?.model_version || 'unknown',
    trainedAt: selected?.trained_at,
    datasetSize: selected?.dataset_size,
  }
  const artifacts = artifactData?.items || []

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Dynamic Topic Modeling</h1>
          <p className="text-sm text-slate-500 mt-1">
            {/*LDA-based topic extraction · {topics.length} topics discovered · Live from <span className="font-mono text-brand-400">topics</span> + <span className="font-mono text-brand-400">topic_time_series</span> tables
            Topics from your analyzed feedback · {topics.length} matched in <span className="font-mono text-brand-400">topics</span> + <span className="font-mono text-brand-400">topic_time_series</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Model <span className="font-mono text-brand-400">{modelMeta.version}</span>
            {modelMeta.trainedAt ? ` · Trained ${new Date(modelMeta.trainedAt).toLocaleString()}` : ''}
            {typeof modelMeta.datasetSize === 'number' ? ` · Dataset ${modelMeta.datasetSize.toLocaleString()} rows` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshFromTrainedModel} className="btn-primary text-xs" disabled={reloadState.loading}>
            <RefreshCw size={13} className={reloadState.loading ? 'animate-spin' : ''} />
            {reloadState.loading ? 'Syncing…' : 'Sync Trained Model'}
          </button>
          <button onClick={refetch} className="btn-ghost text-xs"><RefreshCw size={13}/> Refresh</button>
        </div>
      </div>
      {reloadState.error && <div className="mb-4 text-xs text-rose-400">{reloadState.error}</div>}
      {reloadState.ok && <div className="mb-4 text-xs text-emerald-400">{reloadState.ok}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Topic list 
        <div className="space-y-3">
      {/*<div className="label mb-1">Discovered Topics ({topics.length})</div>
      <div className="label mb-1">Your analyzed topics ({topics.length})</div>
         {topics.map(t => (
            <button key={t.id} onClick={() => setSelectedId(t.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                activeId === t.id ? 'bg-surface-700 border-white/10 shadow-card' : 'bg-surface-800/50 border-white/5 hover:bg-surface-700/50'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                  <span className="text-sm font-medium text-white">{t.name}</span>
                </div>
                <TrendBadge trend={t.trend} delta={t.trend_delta} />
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">{(t.probability * 100).toFixed(1)}% of corpus</span>
                <span className="text-xs text-slate-600">{t.doc_count.toLocaleString()} docs</span>
              </div>
              <ProgressBar value={t.probability * 100} color={t.color} />
            </button>
          ))}
        </div>

        {/* Detail }
        {selected && (
          <div className="xl:col-span-2 space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{ background: `${selected.color}15`, borderColor: `${selected.color}30` }}>
                    <Brain size={18} style={{ color: selected.color }} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white text-lg">{selected.name}</div>
                    <div className="text-xs text-slate-500">Topic #{selected.id} · {selected.doc_count.toLocaleString()} documents · DB data</div>
                  </div>
                </div>
                <TrendBadge trend={selected.trend} delta={selected.trend_delta} />
              </div>
              <div className="mb-4">
                <div className="label mb-2">Word Cloud (from DB keywords JSON)</div>
                <WordCloud keywords={selected.keywords} color={selected.color} />
              </div>
              <div>
                <div className="label mb-2">Keyword Weights</div>
                <div className="grid grid-cols-2 gap-2">
                  {(selected.keywords || []).map(kw => (
                    <div key={kw.word} className="flex items-center gap-2">
                      <Hash size={11} className="text-slate-600 flex-shrink-0" />
                      <span className="text-xs text-slate-400 w-20">{kw.word}</span>
                      <div className="flex-1 progress-bar h-1">
                        <div className="h-full rounded-full" style={{ width: `${kw.weight*100}%`, background: selected.color }} />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 w-10 text-right">{kw.weight.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time evolution — from topic_time_series DB table }
            {selected.time_series?.length > 0 ? (
              <div className="card p-5">
                <SectionHeader title="Topic Probability Over Time"
                  subtitle="Dynamic evolution · topic_time_series table · weekly re-training" />
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={selected.time_series.map(s => ({ t: s.period, prob: s.probability }))}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={selected.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={selected.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                    <Tooltip content={<CustomTooltip />} formatter={v => `${(v*100).toFixed(1)}%`} />
                    <Area type="monotone" dataKey="prob" stroke={selected.color} fill="url(#tg)"
                      strokeWidth={2.5} dot={{ fill: selected.color, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="card p-5 text-sm text-slate-500">
                No time-series points for this topic yet. Re-train and sync to populate trend history.
              </div>
            )}

            {/* All topics bar comparison }
            <div className="card p-5">
              {/* <SectionHeader title="All Topics — Current Probability" subtitle="Comparative view · from topics table" /> 
              <SectionHeader title="Your topics — current probability" subtitle="Compared among topics from your analyzed feedback · topics table" />
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={topics.map(t => ({ name: t.name.split(' ')[0], prob: +(t.probability*100).toFixed(1), color: t.color }))}
                  margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="prob" radius={[4,4,0,0]}>
                    {topics.map((t,i) => <Cell key={i} fill={t.color} opacity={t.id === activeId ? 1 : 0.4} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
*/
          /*   {artifacts.length > 0 && (
              <div className="card p-5">
                <SectionHeader title="Model Artifacts (Optional)" subtitle="Generated PNG outputs from latest training run" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {artifacts.map(item => (
                    <a key={item.name} href={item.absoluteUrl} target="_blank" rel="noreferrer"
                      className="p-3 rounded-lg bg-surface-800/50 border border-white/5 hover:border-white/20 transition">
                      <div className="text-sm text-white">{item.name}</div>
                      <div className="text-xs text-slate-500 mt-1">Open generated artifact</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} */

import { useState } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Brain, Hash, RefreshCw } from 'lucide-react'
import { topicsAPI } from '../api/client'
import { useApi, LoadingSpinner, ApiError } from '../hooks/useApi'
import { SectionHeader, ProgressBar, CustomTooltip } from '../components/UI'

function WordCloud({ keywords, color }) {
  if (!keywords?.length) return <div className="p-4 text-slate-600 text-sm text-center">No keywords</div>
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-surface-700/30 rounded-xl min-h-[80px] items-center justify-center">
      {[...keywords].sort((a,b) => b.weight - a.weight).map(kw => (
        <span key={kw.word} className="font-mono font-medium transition-all hover:scale-110 cursor-default"
          style={{ fontSize: 10 + kw.weight * 10, color, opacity: 0.4 + kw.weight * 0.6 }}>
          {kw.word}
        </span>
      ))}
    </div>
  )
}

function TrendBadge({ trend, delta }) {
  if (trend === 'Rising')  return <div className="flex items-center gap-1 text-accent-cyan  text-xs font-medium"><TrendingUp  size={13}/><span>+{Math.abs(delta)}%</span></div>
  if (trend === 'Falling') return <div className="flex items-center gap-1 text-accent-amber text-xs font-medium"><TrendingDown size={13}/><span>-{Math.abs(delta)}%</span></div>
  return <div className="flex items-center gap-1 text-slate-500 text-xs font-medium"><Minus size={13}/><span>Stable</span></div>
}

export default function TopicModeling() {
  const { data: latest, loading, error, refetch } = useApi(() => topicsAPI.latestFromFeedback())
  const topics = latest?.topic ? [latest.topic] : []
  const latestFeedback = latest?.feedback || null
  const { data: artifactData } = useApi(() => topicsAPI.artifacts())
  const [selectedId, setSelectedId] = useState(null)
  const [reloadState, setReloadState] = useState({ loading: false, error: '', ok: '' })

  const refreshFromTrainedModel = async () => {
    setReloadState({ loading: true, error: '', ok: '' })
    try {
      const res = await topicsAPI.reload()
      await refetch()
      setReloadState({ loading: false, error: '', ok: `Synced ${res.data?.synced_topics ?? 0} topics from trained artifacts.` })
    } catch (e) {
      setReloadState({ loading: false, error: e?.response?.data?.detail || 'Failed to sync trained model artifacts.', ok: '' })
    }
  }

  if (loading) return <LoadingSpinner message="Loading topic model data…" />
  if (error)   return <div className="p-6"><ApiError error={error} onRetry={refetch} /></div>
  const hasTopics = !!topics?.length
  const activeId = selectedId || topics?.[0]?.id
  const selected = hasTopics ? (topics.find(t => t.id === activeId) || topics[0]) : null
  const modelMeta = {
    version: selected?.model_version || 'unknown',
    trainedAt: selected?.trained_at,
    datasetSize: selected?.dataset_size,
  }
  const artifacts = artifactData?.items || []

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Dynamic Topic Modeling</h1>
          {/* <p className="text-sm text-slate-500 mt-1">
            Last analyzed feedback topic · live from <span className="font-mono text-brand-400">feedbacks</span> table
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Model <span className="font-mono text-brand-400">{modelMeta.version}</span>
            {modelMeta.trainedAt ? ` · Trained ${new Date(modelMeta.trainedAt).toLocaleString()}` : ''}
            {typeof modelMeta.datasetSize === 'number' ? ` · Dataset ${modelMeta.datasetSize.toLocaleString()} rows` : ''}
          </p> */}
        </div>
        <div className="flex gap-2">
          <button onClick={refreshFromTrainedModel} className="btn-primary text-xs" disabled={reloadState.loading}>
            <RefreshCw size={13} className={reloadState.loading ? 'animate-spin' : ''} />
            {reloadState.loading ? 'Syncing…' : 'Sync Trained Model'}
          </button>
          <button onClick={refetch} className="btn-ghost text-xs"><RefreshCw size={13}/> Refresh</button>
        </div>
      </div>
      {reloadState.error && <div className="mb-4 text-xs text-rose-400">{reloadState.error}</div>}
      {reloadState.ok && <div className="mb-4 text-xs text-emerald-400">{reloadState.ok}</div>}

      {latestFeedback && (
        <div className="mb-5 p-3 rounded-xl border border-white/5 bg-surface-800/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-slate-500">From feedback</span>
          <span className="font-mono text-brand-400">#{latestFeedback.id}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 truncate max-w-xl">{latestFeedback.text}</span>
          {latestFeedback.created_at && (
            <span className="text-slate-600 ml-auto">
              {new Date(latestFeedback.created_at).toLocaleString()}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Topic list */}
        <div className="space-y-3">
          <div className="label mb-1">Last analyzed topic ({topics?.length || 0})</div>
          {hasTopics ? (
            topics.map(t => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  activeId === t.id ? 'bg-surface-700 border-white/10 shadow-card' : 'bg-surface-800/50 border-white/5 hover:bg-surface-700/50'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                    <span className="text-sm font-medium text-white">{t.name}</span>
                  </div>
                  <TrendBadge trend={t.trend} delta={t.trend_delta} />
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">{(t.probability * 100).toFixed(1)}% of corpus</span>
                  <span className="text-xs text-slate-600">{t.doc_count.toLocaleString()} docs</span>
                </div>
                <ProgressBar value={t.probability * 100} color={t.color} />
              </button>
            ))
          ) : (
            <div className="p-4 rounded-xl border border-white/5 bg-surface-800/30 text-slate-500 text-sm">
              No analyzed topic found from the latest feedback record.
            </div>
          )}
        </div>

        {/* Detail */}
        {selected ? (
          <div className="xl:col-span-2 space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{ background: `${selected.color}15`, borderColor: `${selected.color}30` }}>
                    <Brain size={18} style={{ color: selected.color }} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white text-lg">{selected.name}</div>
                    <div className="text-xs text-slate-500">Topic #{selected.id} · {selected.doc_count.toLocaleString()} documents · DB data</div>
                  </div>
                </div>
                <TrendBadge trend={selected.trend} delta={selected.trend_delta} />
              </div>
              <div className="mb-4">
                <div className="label mb-2">Word Cloud (from DB keywords JSON)</div>
                <WordCloud keywords={selected.keywords} color={selected.color} />
              </div>
              <div>
                <div className="label mb-2">Keyword Weights</div>
                <div className="grid grid-cols-2 gap-2">
                  {(selected.keywords || []).map(kw => (
                    <div key={kw.word} className="flex items-center gap-2">
                      <Hash size={11} className="text-slate-600 flex-shrink-0" />
                      <span className="text-xs text-slate-400 w-20">{kw.word}</span>
                      <div className="flex-1 progress-bar h-1">
                        <div className="h-full rounded-full" style={{ width: `${kw.weight*100}%`, background: selected.color }} />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 w-10 text-right">{kw.weight.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time evolution — from topic_time_series DB table */}
            {selected.time_series?.length > 0 ? (
              <div className="card p-5">
                <SectionHeader title="Topic Probability Over Time"
                  subtitle="Dynamic evolution · topic_time_series table · weekly re-training" />
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={selected.time_series.map(s => ({ t: s.period, prob: s.probability }))}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={selected.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={selected.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                    <Tooltip content={<CustomTooltip />} formatter={v => `${(v*100).toFixed(1)}%`} />
                    <Area type="monotone" dataKey="prob" stroke={selected.color} fill="url(#tg)"
                      strokeWidth={2.5} dot={{ fill: selected.color, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="card p-5 text-sm text-slate-500">
                No time-series points for this topic yet. Re-train and sync to populate trend history.
              </div>
            )}

            {/* All topics bar comparison */}
            <div className="card p-5">
              <SectionHeader title="Current probability" subtitle="Latest analyzed feedback topic · topics table" />
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={topics.map(t => ({ name: t.name.split(' ')[0], prob: +(t.probability*100).toFixed(1), color: t.color }))}
                  margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="prob" radius={[4,4,0,0]}>
                    {topics.map((t,i) => <Cell key={i} fill={t.color} opacity={t.id === activeId ? 1 : 0.4} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        ) : (
          <div className="xl:col-span-2 card p-5 text-sm text-slate-500">
            No last analyzed topic yet. Analyze feedback from the Submit Feedback page, then click Refresh.
          </div>
        )}

        {/* <div className="xl:col-span-3 card p-5">
          <SectionHeader title="Model artifact charts" subtitle="Generated PNG outputs from latest training run" />
          {artifacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {artifacts.map(item => (
                <a key={item.name} href={item.absoluteUrl} target="_blank" rel="noreferrer"
                  className="p-3 rounded-lg bg-surface-800/50 border border-white/5 hover:border-white/20 transition">
                  <div className="text-sm text-white">{item.name}</div>
                  <div className="text-xs text-slate-500 mt-1">Open generated artifact</div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Artifact charts are not available yet. Run training and sync the model to load chart images here.
            </div>
          )}
        </div> */}
      </div>
    </div>
  )
}
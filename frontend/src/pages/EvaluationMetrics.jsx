import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, ArrowUpRight } from 'lucide-react'
import { analyticsAPI } from '../api/client'
import { useApi, LoadingSpinner, ApiError } from '../hooks/useApi'
import { SectionHeader, ProgressBar, CustomTooltip } from '../components/UI'


const METRICS = [
  { key: 'accuracy',  label: 'Accuracy',           format: v => v.toFixed(1)+'%',  isScore: false },
  { key: 'precision', label: 'Precision',           format: v => v.toFixed(1)+'%',  isScore: false },
  { key: 'recall',    label: 'Recall',              format: v => v.toFixed(1)+'%',  isScore: false },
  { key: 'f1',        label: 'F1 Score',            format: v => v.toFixed(1)+'%',  isScore: false },
  { key: 'bleu',      label: 'BLEU Score',          format: v => v.toFixed(3),       isScore: true  },
  { key: 'rouge',     label: 'ROUGE-L Score',       format: v => v.toFixed(3),       isScore: true  },
  { key: 'semantic',  label: 'Semantic Similarity', format: v => v.toFixed(1)+'%',  isScore: false },
]

function cmColor(value, max) {
  const t = value / max
  if (t > 0.8) return '#22d3ee'
  if (t > 0.4) return '#0c93e7'
  if (t > 0.1) return '#172a42'
  return '#0c1726'
}

export default function EvaluationMetrics() {
  const { data, loading, error, refetch } = useApi(() => analyticsAPI.evaluation())
  const { data: trainingCurves } = useApi(() => analyticsAPI.trainingCurves())
  const { data: bleuProgression } = useApi(() => analyticsAPI.bleuProgression())

  if (loading) return <LoadingSpinner message="Loading evaluation metrics…" />
  if (error)   return <div className="p-6"><ApiError error={error} onRetry={refetch} /></div>

  const { baseline, proposed, confusion_matrix } = data
  const maxCM = Math.max(...confusion_matrix.data.flat())

  const radarData = METRICS.map(m => ({
    metric: m.label,
    baseline: m.isScore ? baseline[m.key]*100 : baseline[m.key],
    proposed: m.isScore ? proposed[m.key]*100 : proposed[m.key],
  }))

  const perfCards = [
    { label: 'Accuracy Improvement', value: `+${(proposed.accuracy - baseline.accuracy).toFixed(1)}%`, color: '#22d3ee' },
    { label: 'F1 Score Improvement',  value: `+${(proposed.f1      - baseline.f1).toFixed(1)}%`,       color: '#34d399' },
    { label: 'BLEU Score Gain',       value: `+${(proposed.bleu    - baseline.bleu).toFixed(3)}`,       color: '#a78bfa' },
    { label: 'Semantic Similarity',   value: `${proposed.semantic.toFixed(1)}%`,                        color: '#fbbf24' },
  ]

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Evaluation Metrics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Baseline vs Proposed · From <span className="font-mono text-brand-400">/api/v1/analytics/evaluation</span> · Research contribution evidence
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {perfCards.map(c => (
          <div key={c.label} className="card p-4">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{c.label}</div>
            <div className="font-display font-bold text-2xl" style={{ color: c.color }}>{c.value}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
              <TrendingUp size={11}/><span>vs Baseline model</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table — from /analytics/evaluation */}
      <div className="card overflow-hidden mb-6">
        <div className="p-5 border-b border-white/5">
          <h2 className="section-title">Baseline vs Proposed Model Comparison</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Data served from <span className="font-mono text-brand-400">GET /api/v1/analytics/evaluation</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Metric','Baseline','Proposed','Improvement','Visual'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map(m => {
                const b = baseline[m.key], p = proposed[m.key]
                const diff = p - b
                const bPct = m.isScore ? b*100 : b
                const pPct = m.isScore ? p*100 : p
                return (
                  <tr key={m.key} className="border-b border-white/5 hover:bg-surface-700/20">
                    <td className="px-5 py-4"><span className="text-sm font-medium text-white">{m.label}</span></td>
                    <td className="px-5 py-4"><span className="text-sm font-mono text-slate-400">{m.format(b)}</span></td>
                    <td className="px-5 py-4"><span className="text-sm font-mono font-bold text-accent-cyan">{m.format(p)}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight size={13} className="text-accent-green"/>
                        <span className="text-sm font-mono text-accent-green">+{m.isScore ? diff.toFixed(3) : diff.toFixed(1)}{!m.isScore ? '%' : ''}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 w-48">
                      <div className="space-y-1">
                        <ProgressBar value={bPct} color="#475569"/>
                        <ProgressBar value={pPct} color="#22d3ee"/>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <SectionHeader title="Radar Comparison" subtitle="Multi-metric performance overview" />
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)"/>
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748b' }}/>
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize: 9, fill: '#334155' }}/>
              <Radar name="Baseline" dataKey="baseline" stroke="#475569" fill="#475569" fillOpacity={0.2}/>
              <Radar name="Proposed" dataKey="proposed" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2}/>
              <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }}/>
              <Tooltip content={<CustomTooltip/>}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Confusion matrix from API */}
        <div className="card p-5">
          <SectionHeader title="Confusion Matrix" subtitle="Proposed model · Test set"/>
          <div className="flex flex-col items-center mt-2">
            <div className="text-[10px] text-slate-600 mb-3">Predicted →</div>
            <div className="flex gap-1">
              <div className="w-8"/>
              {confusion_matrix.labels.map(l => (
                <div key={l} className="w-20 text-center text-[10px] text-slate-500 mb-1">{l}</div>
              ))}
            </div>
            {confusion_matrix.data.map((row, ri) => (
              <div key={ri} className="flex gap-1 items-center mb-1">
                <div className="w-8 text-[10px] text-slate-500 text-right pr-1">{confusion_matrix.labels[ri].slice(0,3)}</div>
                {row.map((val, ci) => (
                  <div key={ci} className="w-20 h-14 rounded-xl flex flex-col items-center justify-center text-sm font-bold"
                    style={{ background: cmColor(val, maxCM) }}>
                    <span className={val > 200 ? 'text-white' : 'text-slate-400'}>{val}</span>
                    {ri === ci && <span className="text-[9px] text-accent-green/70 mt-0.5">✓</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <SectionHeader title="Training vs Validation Loss" subtitle="T5-Base fine-tuning · 10 epochs"/>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trainingCurves || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="epoch"/>
              <YAxis/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: '11px' }}/>
              <Line type="monotone" dataKey="trainLoss" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} name="Train Loss"/>
              <Line type="monotone" dataKey="valLoss"   stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" name="Val Loss"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <SectionHeader title="BLEU Score Progression" subtitle="Model improvement over versions"/>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bleuProgression || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="version" tick={{ fontSize: 11 }}/>
              <YAxis domain={[0.48, 0.85]} tickFormatter={v => v.toFixed(2)}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: '11px' }}/>
              <Line type="monotone" dataKey="baseline" stroke="#475569" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" name="Baseline"/>
              <Line type="monotone" dataKey="proposed"  stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, fill: '#22d3ee' }} name="Proposed"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

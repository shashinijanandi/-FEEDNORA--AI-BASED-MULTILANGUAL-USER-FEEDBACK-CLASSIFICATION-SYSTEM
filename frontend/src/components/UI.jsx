import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react'

// ─── KPI Metric Card ──────────────────────────────────────────────────────────
export function MetricCard({ title, value, unit, delta, deltaLabel, icon: Icon, color = 'brand', accent }) {
  const colorMap = {
    brand:  { bg: 'bg-brand-600/10',        border: 'border-brand-600/20',   icon: 'text-brand-400',        glow: '' },
    green:  { bg: 'bg-accent-green/10',      border: 'border-accent-green/20', icon: 'text-accent-green',     glow: '' },
    red:    { bg: 'bg-accent-red/10',         border: 'border-accent-red/20',  icon: 'text-accent-red',       glow: '' },
    cyan:   { bg: 'bg-accent-cyan/10',        border: 'border-accent-cyan/20', icon: 'text-accent-cyan',      glow: '' },
    amber:  { bg: 'bg-accent-amber/10',       border: 'border-accent-amber/20',icon: 'text-accent-amber',     glow: '' },
    violet: { bg: 'bg-accent-violet/10',      border: 'border-accent-violet/20',icon: 'text-accent-violet',   glow: '' },
  }
  const c = colorMap[color]
  const isPositive = delta > 0
  const isNegative = delta < 0

  return (
    <div className={`metric-card group hover:scale-[1.01] transition-transform`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${c.bg}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
            <Icon size={18} className={c.icon} />
          </div>
          {delta !== undefined && (
            <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg ${
              isPositive ? 'bg-accent-green/10 text-accent-green' :
              isNegative ? 'bg-accent-red/10 text-accent-red' :
                           'bg-slate-500/10 text-slate-500'
            }`}>
              {isPositive ? <TrendingUp size={10} /> : isNegative ? <TrendingDown size={10} /> : <Minus size={10} />}
              {Math.abs(delta)}%
            </div>
          )}
        </div>
        <div className="stat-value mb-0.5">{value}{unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}</div>
        <div className="text-xs text-slate-500">{title}</div>
        {deltaLabel && <div className="text-[10px] text-slate-600 mt-1">{deltaLabel}</div>}
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Sentiment Badge ──────────────────────────────────────────────────────────
export function SentimentBadge({ sentiment }) {
  const map = {
    positive: { cls: 'badge-positive', label: 'Positive' },
    negative: { cls: 'badge-negative', label: 'Negative' },
    neutral:  { cls: 'badge-neutral',  label: 'Neutral'  },
  }
  const s = map[sentiment] || map.neutral
  return <span className={s.cls}>{s.label}</span>
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#0c93e7', height = 'h-1.5', label, showPct = false }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      {(label || showPct) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-[11px] text-slate-500">{label}</span>}
          {showPct && <span className="text-[11px] font-medium text-slate-400">{value.toFixed(1)}%</span>}
        </div>
      )}
      <div className={`${height} rounded-full bg-surface-600 overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ─── Confidence Ring ──────────────────────────────────────────────────────────
export function ConfidenceRing({ value, size = 96, label = 'Confidence', color = '#0c93e7' }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="48" cy="48" r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-white text-lg">{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  )
}

// ─── Mini Metric ─────────────────────────────────────────────────────────────
export function MiniMetric({ label, value, color }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-surface-700/60 border border-white/5">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="font-display font-bold text-base" style={{ color }}>{value}</div>
    </div>
  )
}

// ─── Chart Container ──────────────────────────────────────────────────────────
export function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <SectionHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-700 border border-white/5 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

// ─── Tooltip custom ───────────────────────────────────────────────────────────
export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-xs shadow-xl">
      <div className="text-slate-400 mb-2 font-medium">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-medium">{typeof p.value === 'number' && p.value < 1 ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

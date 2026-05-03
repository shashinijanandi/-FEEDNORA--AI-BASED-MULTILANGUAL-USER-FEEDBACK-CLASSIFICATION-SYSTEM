import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { MessageSquare, ThumbsUp, AlertTriangle, Sparkles, Activity, Cpu, RefreshCw } from 'lucide-react'
import { MetricCard, SentimentBadge, ProgressBar, ChartCard, CustomTooltip } from '../components/UI'
import { analyticsAPI } from '../api/client'
import { useApi, LoadingSpinner, ApiError } from '../hooks/useApi'

const TOPIC_COLORS = ['#22d3ee','#34d399','#fbbf24','#a78bfa','#f87171','#fb923c']

export default function Dashboard() {
  const { data,           loading,  error,  refetch  } = useApi(() => analyticsAPI.dashboard())
  const { data: evolution, loading: evoLoading }        = useApi(() => analyticsAPI.topicEvolution())
  const { data: weekly,    loading: weekLoading }        = useApi(() => analyticsAPI.weeklyComplaints())

  if (loading) return <LoadingSpinner message="Loading dashboard…" />
  if (error)   return <div className="p-6"><ApiError error={error} onRetry={refetch} /></div>

  const { kpi, sentiment_dist, topic_dist, recent_feedback } = data

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Intelligence Overview</h1>
          {/*<p className="text-sm text-slate-500 mt-1">
            All data live from PostgreSQL · Processed by your trained AI models
          </p*/}
        </div>
        <button onClick={refetch} className="btn-ghost text-xs"><RefreshCw size={13}/> Refresh</button>
      </div>

      {/* KPI — 100% live from /analytics/dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Total Feedback"     value={kpi.total_feedback.toLocaleString()}    delta={null} icon={MessageSquare} color="brand"  />
        <MetricCard title="Satisfaction Rate"  value={kpi.satisfaction_rate.toFixed(1)} unit="%" icon={ThumbsUp}    color="green"  />
        <MetricCard title="Negative Feedback"  value={kpi.negative_percent.toFixed(1)}  unit="%" icon={AlertTriangle} color="red"  />
        <MetricCard title="AI Responses Today" value={kpi.ai_responses_today.toLocaleString()} icon={Sparkles}    color="cyan"   />
        <MetricCard title="Avg BLEU Score"     value={kpi.avg_bleu > 0 ? kpi.avg_bleu.toFixed(3) : '—'} icon={Activity} color="violet"/>
        <MetricCard title="Model Confidence"   value={kpi.avg_confidence > 0 ? kpi.avg_confidence.toFixed(1) : '—'} unit="%" icon={Cpu} color="amber"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Topic Evolution — from topic_time_series table */}
        <div className="lg:col-span-2">
          <ChartCard title="Dynamic Topic Evolution"
            subtitle="topic_time_series table · probability per period from topics seeded in DB">
            {evoLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Loading…</div>
            ) : !evolution?.length ? (
              <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
                No topic time-series data yet. Topics are seeded on startup.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={evolution} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                  <defs>{TOPIC_COLORS.map((c,i) => (
                    <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0.02}/>
                    </linearGradient>
                  ))}</defs>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="month"/>
                  <YAxis tickFormatter={v => `${v}%`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize:'11px', color:'#64748b' }}/>
                  {['Delivery','Product','Payment','Customer','Returns'].map((k,i) => (
                    <Area key={k} type="monotone" dataKey={k}
                      stroke={TOPIC_COLORS[i]} fill={`url(#g${i})`} strokeWidth={2}/>
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Sentiment — live from feedbacks table */}
        <ChartCard title="Sentiment Distribution"
          subtitle="Live · classified by sentiment_model.pkl">
          {!sentiment_dist?.length ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
              Submit feedback to see live sentiment data
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sentiment_dist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {sentiment_dist.map((e,i) => <Cell key={i} fill={e.color} stroke="none"/>)}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {sentiment_dist.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }}/>
                      <span className="text-xs text-slate-400">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.value} color={s.color}/>
                      <span className="text-xs font-medium text-white w-10 text-right">{s.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Topic Distribution — live */}
        <ChartCard title="Topic Distribution"
          subtitle="Live · detected_topic from feedbacks table ">
          {!topic_dist?.length ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
              Submit feedback to see topic distribution
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topic_dist} layout="vertical" margin={{ top:0, right:10, left:10, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                <XAxis type="number"/><YAxis dataKey="topic" type="category" width={130} tick={{ fontSize:11 }}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="count" radius={[0,6,6,0]}>
                  {topic_dist.map((_,i) => <Cell key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Weekly Complaints — live from DB */}
        <ChartCard title="Weekly Complaint Trend"
          subtitle="Live · last 7 days from feedbacks table · grouped by detected_topic">
          {weekLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Loading…</div>
          ) : !weekly?.some(d => Object.keys(d).length > 1) ? (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
              No feedback in the last 7 days yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekly} margin={{ top:0, right:5, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="day"/>
                <YAxis allowDecimals={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend wrapperStyle={{ fontSize:'11px' }}/>
                {['Delivery','Payment','Product','Customer','Returns','App'].map((k,i) => (
                  <Bar key={k} dataKey={k} stackId="a" fill={TOPIC_COLORS[i]}
                    radius={i===5?[4,4,0,0]:[0,0,0,0]}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Recent Feedback — live from feedbacks table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="section-title">Recent Feedback</h2>
            {/*<p className="text-xs text-slate-500 mt-0.5">
              Live · feedbacks table · sentiment + topic from your AI models
            </p*/}
          </div>
          <button onClick={refetch} className="btn-ghost text-xs"><RefreshCw size={12}/> Refresh</button>
        </div>
        {!recent_feedback?.length ? (
          <div className="flex items-center justify-center py-16 text-slate-600 text-sm">
            No feedback yet — submit some via the Submit Feedback page to test your model
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['#','Feedback','Sentiment','Topic','AI Response','Confidence','BLEU'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent_feedback.map(fb => (
                  <tr key={fb.id} className="border-b border-white/5 hover:bg-surface-700/30 transition-colors">
                    <td className="px-5 py-3.5"><span className="text-xs font-mono text-brand-400">#{fb.id}</span></td>
                    <td className="px-5 py-3.5 max-w-xs"><p className="text-sm text-slate-300 truncate">{fb.text}</p></td>
                    <td className="px-5 py-3.5"><SentimentBadge sentiment={fb.sentiment}/></td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-400 bg-surface-700 px-2 py-1 rounded-lg border border-white/5">{fb.detected_topic || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs"><p className="text-xs text-slate-500 truncate">{fb.generated_response || '—'}</p></td>
                    <td className="px-5 py-3.5 w-32">
                      {fb.model_confidence ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 progress-bar"><div className="progress-fill bg-brand-500" style={{width:`${fb.model_confidence}%`}}/></div>
                          <span className="text-[11px] text-slate-400 w-10 text-right">{fb.model_confidence.toFixed(1)}%</span>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {fb.bleu_score
                        ? <span className="text-xs font-mono text-accent-cyan">{fb.bleu_score.toFixed(3)}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

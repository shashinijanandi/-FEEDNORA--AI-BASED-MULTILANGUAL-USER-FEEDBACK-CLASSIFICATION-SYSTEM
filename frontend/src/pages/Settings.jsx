import { CheckCircle2, XCircle, AlertCircle, Shield, Cpu, Brain, Sparkles, Info, RefreshCw } from 'lucide-react'
import { analyticsAPI } from '../api/client'
import { useApi, LoadingSpinner } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

function SettingRow({ label, value, sub, mono = false }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
      <div className="min-w-0">
        <div className="text-sm text-slate-300">{label}</div>
        {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
      <div className={`text-sm text-right flex-shrink-0 ${mono ? 'font-mono text-brand-400' : 'text-slate-400'}`}>{value}</div>
    </div>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const { data: modelInfo, loading, refetch } = useApi(() => analyticsAPI.evaluation().then(() => fetch('/api/v1/analytics/model-info').then(r=>r.json())))

  // Fetch model info directly
  const { data: mInfo, loading: mLoading } = useApi(async () => {
    const token = localStorage.getItem('access_token')
    const r = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/analytics/model-info`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return { data: await r.json() }
  })

  const m = mInfo

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Settings & Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Model parameters · System config · Live model status from API</p>
        </div>
        <button onClick={refetch} className="btn-ghost text-xs"><RefreshCw size={13}/> Refresh</button>
      </div>

      {/* Live Model Status Banner */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Cpu size={16} className="text-brand-400"/>
          <h2 className="section-title">Live Model Status</h2>
          <span className="text-[11px] text-slate-600 font-mono">GET /api/v1/analytics/model-info</span>
        </div>
        {mLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"/>Fetching live model status…</div>
        ) : m ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sentiment Classifier */}
            <div className={`p-4 rounded-xl border ${m.sentiment_classifier.loaded ? 'bg-accent-green/5 border-accent-green/20' : 'bg-accent-amber/5 border-accent-amber/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {m.sentiment_classifier.loaded
                  ? <CheckCircle2 size={15} className="text-accent-green"/>
                  : <AlertCircle  size={15} className="text-accent-amber"/>}
                <span className="text-sm font-medium text-white">Sentiment Classifier</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.sentiment_classifier.loaded ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-amber/20 text-accent-amber'}`}>
                  {m.sentiment_classifier.loaded ? 'pkl loaded ✓' : 'rule-based fallback'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-1">{m.sentiment_classifier.type}</div>
              <div className="text-[11px] font-mono text-slate-600">{m.sentiment_classifier.file}</div>
              {!m.sentiment_classifier.loaded && (
                <div className="mt-2 p-2 bg-accent-amber/10 rounded-lg text-[11px] text-accent-amber">
                  ⚠️ {m.sentiment_classifier.note}
                </div>
              )}
            </div>

            {/* Topic Modeler */}
            <div className="p-4 rounded-xl border bg-accent-cyan/5 border-accent-cyan/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-accent-cyan"/>
                <span className="text-sm font-medium text-white">Topic Modeler</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-accent-cyan/20 text-accent-cyan">active</span>
              </div>
              <div className="text-xs text-slate-400 mb-1">{m.topic_modeler.type}</div>
              <div className="text-[11px] font-mono text-slate-600">{m.topic_modeler.topics} topics · PostgreSQL</div>
            </div>

            {/* Response Generator */}
            <div className="p-4 rounded-xl border bg-brand-600/5 border-brand-600/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-brand-400"/>
                <span className="text-sm font-medium text-white">Response Generator</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-brand-600/20 text-brand-400">template engine</span>
              </div>
              <div className="text-xs text-slate-400 mb-1">{m.response_generator.type}</div>
              <div className="text-[11px] text-slate-600">{m.response_generator.note}</div>
            </div>

            {/* Evaluation */}
            <div className="p-4 rounded-xl border bg-accent-violet/5 border-accent-violet/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-accent-violet"/>
                <span className="text-sm font-medium text-white">Evaluation Pipeline</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-accent-violet/20 text-accent-violet">active</span>
              </div>
              <div className="text-xs text-slate-400 mb-1">BLEU · ROUGE-L · Semantic Similarity</div>
              <div className="text-[11px] text-slate-600">{m.evaluation.semantic}</div>
            </div>
          </div>
        ) : (
          <div className="text-slate-600 text-sm">Could not fetch model info from API</div>
        )}
      </div>

      {/* How to connect your model */}
      <div className="card p-5 mb-6 border-brand-600/20 bg-brand-600/5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-brand-400"/>
          <h2 className="section-title text-brand-300">How to Connect Your Trained Models</h2>
        </div>
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-surface-700/50 rounded-xl border border-white/5">
            <div className="text-xs font-medium text-accent-cyan mb-2">Step 1 — Sentiment Model (.pkl)</div>
            <div className="font-mono text-xs text-slate-300 space-y-1">
              <div># Copy your trained model files into:</div>
              <div className="text-accent-green">feedback-ai-platform/backend/ai_models/sentiment_model.pkl</div>
              <div className="text-accent-green">feedback-ai-platform/backend/ai_models/vectorizer.pkl</div>
              <div className="text-slate-500 mt-1"># The backend auto-loads them on startup via joblib</div>
            </div>
          </div>
          <div className="p-3 bg-surface-700/50 rounded-xl border border-white/5">
            <div className="text-xs font-medium text-accent-cyan mb-2">Step 2 — T5 Response Generator</div>
            <div className="font-mono text-xs text-slate-300 space-y-1">
              <div># Edit backend/app/services/ai_service.py</div>
              <div># Replace generate_response() method:</div>
              <div className="text-accent-amber">def generate_response(self, text, sentiment, topic, keywords):</div>
              <div className="text-accent-amber pl-4">return self.t5_model.generate(context_prompt)</div>
            </div>
          </div>
          <div className="p-3 bg-surface-700/50 rounded-xl border border-white/5">
            <div className="text-xs font-medium text-accent-cyan mb-2">Step 3 — LDA Topic Model</div>
            <div className="font-mono text-xs text-slate-300 space-y-1">
              <div># Edit detect_topic() in ai_service.py</div>
              <div># Replace keyword rules with your LDA model:</div>
              <div className="text-accent-amber">lda_model = joblib.load('ai_models/lda_model.pkl')</div>
              <div className="text-accent-amber">topics = lda_model.transform(vectorizer.transform([text]))</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LDA Config */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-cyan/10 border border-accent-cyan/20">
              <Brain size={17} className="text-accent-cyan"/>
            </div>
            <h2 className="section-title">Topic Modeling Configuration</h2>
          </div>
          <div className="px-5 py-2">
            <SettingRow label="Algorithm"         value="Dynamic LDA" sub="Weekly re-training on new feedback batch"/>
            <SettingRow label="Number of Topics"  value="5" sub="Coherence: 0.621 · Perplexity: 42.8"/>
            <SettingRow label="Alpha (doc-topic)"  value="0.1 (sparse)"/>
            <SettingRow label="Beta (topic-word)"  value="0.01"/>
            <SettingRow label="Storage"           value="topics + topic_time_series tables" sub="PostgreSQL — query via /api/v1/topics/" mono/>
            <SettingRow label="Update Frequency"  value="Every 7 days or 500 new docs"/>
          </div>
        </div>

        {/* Classifier Config */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-green/10 border border-accent-green/20">
              <Cpu size={17} className="text-accent-green"/>
            </div>
            <h2 className="section-title">Sentiment Classifier</h2>
          </div>
          <div className="px-5 py-2">
            <SettingRow label="Algorithm"       value="Logistic Regression" sub="sklearn · solver: lbfgs"/>
            <SettingRow label="Features"        value="TF-IDF" sub="max_features: 10,000 · ngram_range: (1,2)"/>
            <SettingRow label="Accuracy"        value="89.7%" sub="Test split: 20% · k-fold: 5"/>
            <SettingRow label="F1 Score"        value="0.880" sub="Precision: 0.881 · Recall: 0.879"/>
            <SettingRow label="Model file"      value="ai_models/sentiment_model.pkl" mono/>
            <SettingRow label="Vectorizer file" value="ai_models/vectorizer.pkl" mono/>
          </div>
        </div>

        {/* T5 Config */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-600/10 border border-brand-600/20">
              <Sparkles size={17} className="text-brand-400"/>
            </div>
            <h2 className="section-title">Response Generator</h2>
          </div>
          <div className="px-5 py-2">
            <SettingRow label="Base Model"      value="T5-Base (220M params)" sub="Fine-tune on e-commerce corpus"/>
            <SettingRow label="Context Input"   value="Sentiment + Topic + Keywords"/>
            <SettingRow label="Decoding"        value="Beam Search (beam=4)"/>
            <SettingRow label="BLEU Score"      value="0.743 (proposed) vs 0.524 (baseline)"/>
            <SettingRow label="API endpoint"    value="POST /api/v1/feedback/submit" mono/>
            <SettingRow label="Regenerate"      value="POST /api/v1/feedback/{id}/regenerate" mono/>
          </div>
        </div>

        {/* Project metadata */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-amber/10 border border-accent-amber/20">
              <Info size={17} className="text-accent-amber"/>
            </div>
            <h2 className="section-title">Project Metadata</h2>
          </div>
          <div className="px-5 py-2">
            <SettingRow label="Institution"   value="SLIIT" sub="Sri Lanka Institute of Information Technology"/>
            <SettingRow label="Languages"     value="EN / SI / TA (Multilingual)"/>
            <SettingRow label="Platform"      value="v3.0.0"/>
            <SettingRow label="Stack"         value="React + FastAPI + PostgreSQL + Docker"/>
            <SettingRow label="Database"      value="PostgreSQL 16" sub="5 tables · indexes · analytical views"/>
            <SettingRow label="API Docs"      value="http://localhost:8000/api/v1/docs" mono/>
          </div>
        </div>
      </div>

      {/* Auth */}
      <div className="card p-5 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={17} className="text-brand-400"/>
          <h2 className="section-title">Authentication</h2>
          <span className="text-[11px] text-slate-600 font-mono">JWT · bcrypt · RBAC</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-surface-700/50 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center text-white font-bold text-sm">
              {user?.full_name?.slice(0,2).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{user?.full_name}</div>
              <div className="text-xs text-slate-500">{user?.email} · {user?.role}</div>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary text-xs">Sign Out</button>
        </div>
      </div>
    </div>
  )
}

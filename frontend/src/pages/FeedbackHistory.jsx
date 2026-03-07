import { useState, useEffect } from 'react'
import { feedbackAPI } from '../api/client'
import { Link } from 'react-router-dom'
import { History, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const EMOJI = { happiness:'😊',sadness:'😢',anger:'😠',disgust:'🤢',fear:'😨',surprise:'😲',neutral:'😐' }
const SENTIMENTS = ['all','happiness','sadness','anger','disgust','fear','surprise','neutral']

export default function FeedbackHistoryPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 10 }
      if (filter !== 'all') params.sentiment = filter
      const { data: res } = await feedbackAPI.getMy(params)
      setData(res)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, filter])

  const totalPages = Math.ceil(data.total / data.page_size)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History size={24} /> My Feedback History
          </h1>
          <p className="text-gray-500 mt-1">{data.total} total feedbacks</p>
        </div>
        <Link to="/feedback/submit" className="btn-primary text-sm">+ New Feedback</Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        {SENTIMENTS.map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s !== 'all' && EMOJI[s]} {s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
        </div>
      ) : data.items.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">
          <History size={40} className="mx-auto mb-3 opacity-30" />
          <p>No feedbacks found.</p>
          <Link to="/feedback/submit" className="text-indigo-600 text-sm hover:underline mt-2 block">Submit your first feedback</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((fb) => (
            <div key={fb.id} className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpanded(expanded === fb.id ? null : fb.id)}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{EMOJI[fb.sentiment] || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2">{fb.original_text}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className={`badge sentiment-${fb.sentiment} capitalize`}>{fb.sentiment}</span>
                    {fb.confidence_score && <span>{(fb.confidence_score*100).toFixed(0)}% confidence</span>}
                    <span>{fb.detected_language?.toUpperCase()}</span>
                    <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {expanded === fb.id && fb.generated_response && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Generated Response</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{fb.generated_response}</p>
                  {fb.dominant_topic && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Topic:</span>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg">{fb.dominant_topic}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="btn-secondary p-2 disabled:opacity-40">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
            className="btn-secondary p-2 disabled:opacity-40">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

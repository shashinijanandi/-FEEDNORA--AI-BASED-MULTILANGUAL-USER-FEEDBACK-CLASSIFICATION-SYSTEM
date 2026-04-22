import { useState, useEffect, useCallback } from 'react'

/**
 * useApi — fetch data from API on mount, with loading/error/refetch
 * @param {Function} apiFn  — a function that returns a Promise (axios call)
 * @param {any[]}    deps   — dependency array (re-fetches when these change)
 */
export function useApi(apiFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn()
      setData(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }, deps)  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/** Spinner shown while loading */
export function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

/** Error state card */
export function ApiError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-sm text-accent-red max-w-md text-center">
        {error}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">Retry</button>
      )}
    </div>
  )
}

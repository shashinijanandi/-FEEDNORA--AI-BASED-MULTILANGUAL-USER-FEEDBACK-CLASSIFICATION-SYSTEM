import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach JWT ────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor — auto-refresh on 401 ──────────────────────────────
let refreshing = false
let queue = []

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      refreshing = true

      try {
        const refresh_token = localStorage.getItem('refresh_token')
        if (!refresh_token) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token })
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)

        queue.forEach(p => p.resolve(data.access_token))
        queue = []

        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        queue.forEach(p => p.reject())
        queue = []
        localStorage.clear()
        window.location.href = '/login'
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  logout:   ()     => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token') },
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const feedbackAPI = {
  submit:     (data)         => api.post('/feedback/submit', data),
  myFeedback: (page=1,size=20) => api.get('/feedback/my', { params: {page,size} }),
  allFeedback:(params={})    => api.get('/feedback/', { params }),
  approve:    (id, data={})  => api.post(`/feedback/${id}/approve`, data),
  regenerate: (id)           => api.post(`/feedback/${id}/regenerate`),
}

// ─── Topics ───────────────────────────────────────────────────────────────────
export const topicsAPI = {
  list:   ()   => api.get('/topics/'),
  getOne: (id) => api.get(`/topics/${id}`),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard:         ()  => api.get('/analytics/dashboard'),
  evaluation:        ()  => api.get('/analytics/evaluation'),
  languageDist:      ()  => api.get("/analytics/language-distribution"),
  topicEvolution:    ()  => api.get("/analytics/topic-evolution"),
  weeklyComplaints:  ()  => api.get("/analytics/weekly-complaints"),
  categoryStats:     ()  => api.get("/analytics/category-stats"),
  responseTime:      ()  => api.get("/analytics/response-time"),
  trainingCurves:    ()  => api.get("/analytics/training-curves"),
  bleuProgression:   ()  => api.get("/analytics/bleu-progression"),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:       (page=1) => api.get('/users/', { params: {page} }),
  updateRole: (id, role) => api.put(`/users/${id}/role`, {role}),
}

export default api

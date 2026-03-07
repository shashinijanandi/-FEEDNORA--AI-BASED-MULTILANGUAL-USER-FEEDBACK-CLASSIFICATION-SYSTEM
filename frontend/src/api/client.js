import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor: handle 401 token refresh ──────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        isRefreshing = false
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const newToken = res.data.access_token
        localStorage.setItem('access_token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    const message = error.response?.data?.detail || 'Something went wrong'
    if (error.response?.status !== 401) {
      toast.error(typeof message === 'string' ? message : JSON.stringify(message))
    }

    return Promise.reject(error)
  }
)

// ─── API Methods ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (token) => api.post('/auth/refresh', { refresh_token: token }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

export const feedbackAPI = {
  submit: (data) => api.post('/feedback/submit', data),
  getMy: (params) => api.get('/feedback/my', { params }),
  getById: (id) => api.get(`/feedback/${id}`),
  delete: (id) => api.delete(`/feedback/${id}`),
  listAll: (params) => api.get('/feedback/', { params }),  // admin
}

export const topicsAPI = {
  getTrending: (days = 30) => api.get('/topics/trending', { params: { days } }),
  getFeedbackTopics: (id) => api.get(`/topics/for-feedback/${id}`),
}

export const analyticsAPI = {
  getDashboard: (days = 30) => api.get('/analytics/dashboard', { params: { days } }),
  getSentimentSummary: () => api.get('/analytics/sentiment-summary'),
  getUserAnalytics: () => api.get('/analytics/users'),  // admin
}

export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.post('/users/me/change-password', data),
  listUsers: (params) => api.get('/users/', { params }),  // admin
  updateRole: (id, role) => api.put(`/users/${id}/role`, null, { params: { role } }),
}

export default api

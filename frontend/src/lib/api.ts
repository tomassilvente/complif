import axios from 'axios'
import { getToken, removeToken } from './auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // Unwrap backend envelope: { status, data } → return inner data directly
    if (response.data && response.data.status === 'success' && 'data' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

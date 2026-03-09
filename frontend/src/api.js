import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000',
})

// Ajouter automatiquement le token JWT à chaque requête
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// AUTH
export const register = (data) => API.post('/auth/register', data)
export const login    = (data) => API.post('/auth/login', data)
export const getMe    = ()     => API.get('/auth/me')
export const updateProfile = (data) => API.put('/auth/profile', data)

export default API
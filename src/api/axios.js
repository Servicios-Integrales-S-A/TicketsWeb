import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

// Agregar token JWT a cada request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Manejar 401 globalmente — solo redirige si había sesión activa
// Si no hay token (ej. login fallido), deja pasar el error al componente
api.interceptors.response.use(
  res => res,
  err => {
    const tieneToken = !!localStorage.getItem('token')
    if (err.response?.status === 401 && tieneToken) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

import api from './axios'

export const consultarTicketPublico = (numero) =>
  api.get(`/api/tickets/consulta/${encodeURIComponent(numero.trim().toUpperCase())}`)

export const crearTicketPublico = (datos) =>
  api.post('/api/tickets/publico', datos)

export const listarCategoriasPublicas = () =>
  api.get('/api/categorias')

import api from './axios'

export const getNoLeidas    = ()       => api.get('/api/notificaciones/no-leidas')
export const getNotificaciones = (params) => api.get('/api/notificaciones', { params })
export const leerUna        = (id)     => api.put(`/api/notificaciones/${id}/leer`)
export const leerTodas      = ()       => api.put('/api/notificaciones/leer-todas')

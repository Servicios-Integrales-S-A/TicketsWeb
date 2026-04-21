import api from '@/api/axios'

const state = () => ({
  token:   localStorage.getItem('token')   || null,
  usuario: JSON.parse(localStorage.getItem('usuario')) || null,
})

const getters = {
  isAuthenticated: state => !!state.token,
  usuario:         state => state.usuario,
  rol:             state => state.usuario?.rol || null,
  nombreCompleto:  state => state.usuario
    ? `${state.usuario.nombre} ${state.usuario.apellido}`
    : '',
}

const mutations = {
  SET_SESSION(state, { token, usuario }) {
    state.token   = token
    state.usuario = usuario
    localStorage.setItem('token',   token)
    localStorage.setItem('usuario', JSON.stringify(usuario))
  },
  CLEAR_SESSION(state) {
    state.token   = null
    state.usuario = null
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  },
}

const actions = {
  async login({ commit }, credenciales) {
    const { data } = await api.post('/api/auth/login', credenciales)
    commit('SET_SESSION', { token: data.token, usuario: data.usuario })
    return data.usuario
  },

  async logout({ commit }) {
    try {
      await api.post('/api/auth/logout')
    } finally {
      commit('CLEAR_SESSION')
    }
  },
}

export default { namespaced: true, state, getters, mutations, actions }

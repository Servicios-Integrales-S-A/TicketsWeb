<template>
  <div class="login-modal-backdrop" @click.self="cerrar">
    <div class="login-modal-card rounded-4" style="box-shadow: 0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08);">

      <div class="d-flex justify-content-end">
        <button type="button" class="btn-close" @click="cerrar"></button>
      </div>

      <div class="text-center mb-4">
        <i class="bi bi-ticket-perforated-fill text-primary fs-1"></i>
        <h5 class="mt-2 mb-0 fw-semibold">Servicios Integrales S.A.</h5>
        <small class="text-muted">Sistema de Tickets</small>
      </div>

      <h5 class="fw-semibold mb-4">Iniciar sesión</h5>

      <form @submit.prevent="submit">

        <AuthInput
          id="modal-email"
          label="Correo electrónico"
          type="email"
          v-model="form.email"
          :error="errores.email"
          autocomplete="email"
          :autofocus="true"
        />

        <AuthInput
          id="modal-password"
          label="Contraseña"
          type="password"
          v-model="form.password"
          :error="errores.password"
          autocomplete="current-password"
        />

        <div class="text-end mb-3" style="margin-top: -0.75rem;">
          <a href="#" class="text-decoration-none" style="font-size: 0.85rem;" @click.prevent="irA('forgot-password')">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <div v-if="errorServidor" class="alert alert-danger py-2 mb-3" style="font-size: 0.875rem;">
          <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2" :disabled="cargando">
          <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
          {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>

      </form>

      <p class="text-center mt-4 mb-0 text-muted" style="font-size: 0.875rem;">
        ¿No tienes cuenta?
        <a href="#" class="text-decoration-none fw-medium" @click.prevent="irA('register')">Regístrate</a>
      </p>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import AuthInput from '@/components/ui/AuthInput.vue'

const store  = useStore()
const router = useRouter()

const form          = reactive({ email: '', password: '' })
const errores       = ref({})
const errorServidor = ref(null)
const cargando      = ref(false)

function cerrar() {
  store.commit('auth/HIDE_LOGIN_MODAL')
}

function irA(name) {
  cerrar()
  router.push({ name })
}

function validar() {
  const e = {}
  if (!form.email)
    e.email = 'El correo es requerido.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = 'Ingresa un correo válido.'
  if (!form.password)
    e.password = 'La contraseña es requerida.'
  errores.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  errorServidor.value = null
  if (!validar()) return
  cargando.value = true
  try {
    const usuario = await store.dispatch('auth/login', form)
    cerrar()
    // Todos van a /home; HomeView detecta el rol y muestra la vista correcta
    router.push({ name: 'home' })
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'Error al iniciar sesión.'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.login-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1055;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-modal-card {
  background: #fff;
  width: 100%;
  max-width: 440px;
  padding: 2rem;
}
</style>

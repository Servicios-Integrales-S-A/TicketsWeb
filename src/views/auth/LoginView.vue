<template>
  <div>
    <h5 class="fw-semibold mb-4">Iniciar sesión</h5>

    <form @submit.prevent="submit">

      <AuthInput
        id="email"
        label="Correo electrónico"
        type="email"
        v-model="form.email"
        :error="errores.email"
        autocomplete="email"
        :autofocus="true"
      />

      <AuthInput
        id="password"
        label="Contraseña"
        type="password"
        v-model="form.password"
        :error="errores.password"
        autocomplete="current-password"
      />

      <div class="text-end mb-3" style="margin-top: -0.75rem;">
        <router-link :to="{ name: 'forgot-password' }" class="text-decoration-none" style="font-size: 0.85rem;">
          ¿Olvidaste tu contraseña?
        </router-link>
      </div>

      <div v-if="errorServidor" class="alert alert-danger py-2 mb-3" style="font-size: 0.875rem;">
        <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
      </div>

      <button type="submit" class="btn btn-primary w-100 rounded-pill py-2" :disabled="cargando">
        <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
        {{ cargando ? 'Ingresando...' : 'Ingresar' }}
      </button>

    </form>

    <p class="text-center mt-4 mb-0 text-muted" style="font-size: 0.875rem;">
      ¿No tienes cuenta?
      <router-link :to="{ name: 'register' }" class="text-decoration-none fw-medium">Regístrate</router-link>
    </p>
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

const validar = () => {
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

const submit = async () => {
  errorServidor.value = null
  if (!validar()) return
  cargando.value = true
  try {
    await store.dispatch('auth/login', form)
    router.push({ name: 'home' })
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'Error al iniciar sesión.'
  } finally {
    cargando.value = false
  }
}
</script>

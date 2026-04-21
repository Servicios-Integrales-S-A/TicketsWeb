<template>
  <div>

    <!-- Formulario de solicitud -->
    <template v-if="!enviado">
      <h5 class="fw-semibold mb-1">Recuperar contraseña</h5>
      <p class="text-muted mb-4" style="font-size: 0.9rem;">
        Ingresa tu correo y te enviaremos un código de verificación.
      </p>

      <form @submit.prevent="submit">
        <AuthInput
          id="email"
          label="Correo electrónico"
          type="email"
          v-model="email"
          :error="errorEmail"
          autocomplete="email"
          :autofocus="true"
        />

        <div v-if="errorServidor" class="alert alert-danger py-2 mb-3" style="font-size: 0.875rem;">
          <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
        </div>

        <button type="submit" class="btn btn-primary w-100 py-2" :disabled="cargando">
          <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
          {{ cargando ? 'Enviando...' : 'Enviar código' }}
        </button>
      </form>
    </template>

    <!-- Confirmación -->
    <template v-else>
      <div class="text-center">
        <i class="bi bi-envelope-check text-primary" style="font-size: 2.5rem;"></i>
        <h5 class="fw-semibold mt-3 mb-2">Revisa tu correo</h5>
        <p class="text-muted mb-4" style="font-size: 0.9rem;">
          Si el correo <strong>{{ email }}</strong> está registrado, recibirás un código de 6 dígitos.
        </p>
        <router-link :to="{ name: 'reset-password' }" class="btn btn-primary w-100 py-2">
          Ingresar código
        </router-link>
      </div>
    </template>

    <p class="text-center mt-4 mb-0 text-muted" style="font-size: 0.875rem;">
      <router-link :to="{ name: 'login' }" class="text-decoration-none fw-medium">
        <i class="bi bi-arrow-left me-1"></i>Volver al inicio de sesión
      </router-link>
    </p>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api/axios'
import AuthInput from '@/components/ui/AuthInput.vue'

const email         = ref('')
const errorEmail    = ref('')
const errorServidor = ref(null)
const cargando      = ref(false)
const enviado       = ref(false)

const submit = async () => {
  errorEmail.value    = ''
  errorServidor.value = null

  if (!email.value)
    return (errorEmail.value = 'El correo es requerido.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
    return (errorEmail.value = 'Ingresa un correo válido.')

  cargando.value = true
  try {
    await api.post('/api/auth/forgot-password', { email: email.value })
    enviado.value = true
  } catch {
    errorServidor.value = 'Error al enviar el código. Intenta de nuevo.'
  } finally {
    cargando.value = false
  }
}
</script>

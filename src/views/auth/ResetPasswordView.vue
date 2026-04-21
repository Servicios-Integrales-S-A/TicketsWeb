<template>
  <div>

    <!-- Paso 1: correo + código -->
    <template v-if="paso === 1">
      <h5 class="fw-semibold mb-1">Verificar código</h5>
      <p class="text-muted mb-4" style="font-size: 0.9rem;">
        Ingresa el correo y el código de 6 dígitos que recibiste.
      </p>

      <form @submit.prevent="verificarCodigo">
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
          id="token"
          label="Código de verificación"
          v-model="form.token"
          :error="errores.token"
          autocomplete="one-time-code"
        />

        <button type="submit" class="btn btn-primary w-100 py-2">
          Continuar
        </button>
      </form>
    </template>

    <!-- Paso 2: nueva contraseña -->
    <template v-else>
      <h5 class="fw-semibold mb-1">Nueva contraseña</h5>
      <p class="text-muted mb-4" style="font-size: 0.9rem;">
        Elige una contraseña segura para tu cuenta.
      </p>

      <form @submit.prevent="submit">
        <AuthInput
          id="password_nuevo"
          label="Nueva contraseña"
          type="password"
          v-model="form.password_nuevo"
          :error="errores.password_nuevo"
          autocomplete="new-password"
          :autofocus="true"
        />

        <AuthInput
          id="confirmar_password"
          label="Confirmar nueva contraseña"
          type="password"
          v-model="form.confirmar_password"
          :error="errores.confirmar_password"
          autocomplete="new-password"
        />

        <div v-if="errorServidor" class="alert alert-danger py-2 mb-3" style="font-size: 0.875rem;">
          <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
        </div>

        <div v-if="exito" class="alert alert-success py-2 mb-3" style="font-size: 0.875rem;">
          <i class="bi bi-check-circle me-1"></i>Contraseña actualizada. Redirigiendo...
        </div>

        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-secondary py-2 px-3"
            :disabled="cargando || exito"
            @click="paso = 1"
          >
            <i class="bi bi-arrow-left"></i>
          </button>
          <button type="submit" class="btn btn-primary w-100 py-2" :disabled="cargando || exito">
            <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
            {{ cargando ? 'Guardando...' : 'Cambiar contraseña' }}
          </button>
        </div>
      </form>
    </template>

    <p class="text-center mt-4 mb-0 text-muted" style="font-size: 0.875rem;">
      <router-link :to="{ name: 'login' }" class="text-decoration-none fw-medium">
        <i class="bi bi-arrow-left me-1"></i>Volver al inicio de sesión
      </router-link>
    </p>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import AuthInput from '@/components/ui/AuthInput.vue'

const router = useRouter()

const paso = ref(1)

const form = reactive({
  email:             '',
  token:             '',
  password_nuevo:    '',
  confirmar_password:'',
})

const errores       = ref({})
const errorServidor = ref(null)
const cargando      = ref(false)
const exito         = ref(false)

const verificarCodigo = () => {
  const e = {}
  if (!form.email)
    e.email = 'El correo es requerido.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = 'Ingresa un correo válido.'
  if (!form.token)
    e.token = 'El código es requerido.'
  else if (!/^\d{6}$/.test(form.token))
    e.token = 'El código debe tener 6 dígitos.'
  errores.value = e
  if (Object.keys(e).length === 0) paso.value = 2
}

const submit = async () => {
  errorServidor.value = null
  const e = {}
  if (!form.password_nuevo)
    e.password_nuevo = 'La contraseña es requerida.'
  else if (form.password_nuevo.length < 6)
    e.password_nuevo = 'Mínimo 6 caracteres.'
  if (!form.confirmar_password)
    e.confirmar_password = 'Confirma tu contraseña.'
  else if (form.password_nuevo !== form.confirmar_password)
    e.confirmar_password = 'Las contraseñas no coinciden.'
  errores.value = e
  if (Object.keys(e).length) return

  cargando.value = true
  try {
    await api.post('/api/auth/reset-password', {
      email:          form.email,
      token:          form.token,
      password_nuevo: form.password_nuevo,
    })
    exito.value = true
    setTimeout(() => router.push({ name: 'login' }), 1500)
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'Código inválido o expirado. Intenta de nuevo.'
  } finally {
    cargando.value = false
  }
}
</script>

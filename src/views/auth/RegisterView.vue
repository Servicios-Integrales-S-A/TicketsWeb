<template>
  <div>
    <h5 class="fw-semibold mb-4">Crear cuenta</h5>

    <form @submit.prevent="submit">

      <div class="row g-2">
        <div class="col-6">
          <AuthInput
            id="nombre"
            label="Nombre"
            v-model="form.nombre"
            :error="errores.nombre"
            autocomplete="given-name"
            :autofocus="true"
          />
        </div>
        <div class="col-6">
          <AuthInput
            id="apellido"
            label="Apellido"
            v-model="form.apellido"
            :error="errores.apellido"
            autocomplete="family-name"
          />
        </div>
      </div>

      <AuthInput
        id="email"
        label="Correo electrónico"
        type="email"
        v-model="form.email"
        :error="errores.email"
        autocomplete="email"
      />

      <AuthInput
        id="telefono"
        label="Teléfono (opcional)"
        type="tel"
        v-model="form.telefono"
        autocomplete="tel"
      />

      <AuthInput
        id="password"
        label="Contraseña"
        type="password"
        v-model="form.password"
        :error="errores.password"
        autocomplete="new-password"
      />

      <AuthInput
        id="confirmar_password"
        label="Confirmar contraseña"
        type="password"
        v-model="form.confirmar_password"
        :error="errores.confirmar_password"
        autocomplete="new-password"
      />

      <div v-if="errorServidor" class="alert alert-danger py-2 mb-3" style="font-size: 0.875rem;">
        <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
      </div>

      <button type="submit" class="btn btn-primary w-100 py-2" :disabled="cargando">
        <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
        {{ cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
      </button>

    </form>

    <p class="text-center mt-4 mb-0 text-muted" style="font-size: 0.875rem;">
      ¿Ya tienes cuenta?
      <router-link :to="{ name: 'login' }" class="text-decoration-none fw-medium">Inicia sesión</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import AuthInput from '@/components/ui/AuthInput.vue'

const router = useRouter()

const form = reactive({
  nombre:            '',
  apellido:          '',
  email:             '',
  telefono:          '',
  password:          '',
  confirmar_password:'',
})

const errores       = ref({})
const errorServidor = ref(null)
const cargando      = ref(false)

const validar = () => {
  const e = {}
  if (!form.nombre)    e.nombre   = 'El nombre es requerido.'
  if (!form.apellido)  e.apellido = 'El apellido es requerido.'
  if (!form.email)
    e.email = 'El correo es requerido.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = 'Ingresa un correo válido.'
  if (!form.password)
    e.password = 'La contraseña es requerida.'
  else if (form.password.length < 6)
    e.password = 'Mínimo 6 caracteres.'
  if (!form.confirmar_password)
    e.confirmar_password = 'Confirma tu contraseña.'
  else if (form.password !== form.confirmar_password)
    e.confirmar_password = 'Las contraseñas no coinciden.'
  errores.value = e
  return Object.keys(e).length === 0
}

const submit = async () => {
  errorServidor.value = null
  if (!validar()) return
  cargando.value = true
  try {
    await api.post('/api/auth/register', {
      nombre:   form.nombre,
      apellido: form.apellido,
      email:    form.email,
      telefono: form.telefono || undefined,
      password: form.password,
    })
    router.push({ name: 'login' })
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'Error al crear la cuenta.'
  } finally {
    cargando.value = false
  }
}
</script>

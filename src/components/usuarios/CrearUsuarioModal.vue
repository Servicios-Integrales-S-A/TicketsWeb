<template>
  <AppModal
    :titulo="rolFijo === 'cliente' ? 'Nuevo cliente' : 'Nuevo usuario'"
    submit-label="Crear"
    cargando-label="Creando..."
    :cargando="cargando"
    @close="$emit('close')"
    @submit="submit"
  >
    <div class="row g-3 mb-3">
      <div class="col-6">
        <label class="form-label">Nombre <span class="text-danger">*</span></label>
        <input type="text" class="form-control" :class="{ 'is-invalid': errores.nombre }"
          v-model="form.nombre" autofocus />
        <div class="invalid-feedback">{{ errores.nombre }}</div>
      </div>
      <div class="col-6">
        <label class="form-label">Apellido <span class="text-danger">*</span></label>
        <input type="text" class="form-control" :class="{ 'is-invalid': errores.apellido }"
          v-model="form.apellido" />
        <div class="invalid-feedback">{{ errores.apellido }}</div>
      </div>
    </div>

    <div class="mb-3">
      <label class="form-label">Correo electrónico <span class="text-danger">*</span></label>
      <input type="email" class="form-control" :class="{ 'is-invalid': errores.email }"
        v-model="form.email" />
      <div class="invalid-feedback">{{ errores.email }}</div>
    </div>

    <div class="mb-3">
      <label class="form-label">Contraseña <span class="text-danger">*</span></label>
      <AuthInput
        id="crear-usuario-pass"
        label="Contraseña"
        type="password"
        v-model="form.password"
        :error="errores.password"
        autocomplete="new-password"
      />
    </div>

    <div class="row g-3">
      <div :class="rolFijo ? 'col-12' : 'col-6'">
        <label class="form-label">Teléfono</label>
        <PhoneInput v-model="form.telefono" />
      </div>
      <div v-if="!rolFijo" class="col-6">
        <label class="form-label">Rol <span class="text-danger">*</span></label>
        <select class="form-select" :class="{ 'is-invalid': errores.rol }" v-model="form.rol">
          <option value="">Seleccionar...</option>
          <option value="cliente">Cliente</option>
          <option value="agente">Agente</option>
          <option value="admin">Administrador</option>
        </select>
        <div class="invalid-feedback">{{ errores.rol }}</div>
      </div>
    </div>

    <div v-if="form.rol === 'cliente'" class="form-text mt-2">
      <i class="bi bi-envelope me-1"></i>Se enviará un correo de bienvenida con las credenciales de acceso.
    </div>

    <div v-if="errorServidor" class="alert alert-danger py-2 mt-3 mb-0" style="font-size: 0.875rem;">
      <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
    </div>
  </AppModal>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '@/api/axios'
import AppModal   from '@/components/ui/AppModal.vue'
import AuthInput  from '@/components/ui/AuthInput.vue'
import PhoneInput from '@/components/ui/PhoneInput.vue'

const props = defineProps({
  rolFijo: { type: String, default: '' }, // si se pasa, el rol queda fijo e invisible
})

const emit = defineEmits(['close', 'creado'])

const cargando      = ref(false)
const errorServidor = ref(null)
const errores       = ref({})

const form = reactive({
  nombre: '', apellido: '', email: '', password: '', telefono: '',
  rol: props.rolFijo || '',
})

const validar = () => {
  const e = {}
  if (!form.nombre.trim())   e.nombre   = 'El nombre es requerido.'
  if (!form.apellido.trim()) e.apellido = 'El apellido es requerido.'
  if (!form.email.trim())    e.email    = 'El email es requerido.'
  if (!form.password)        e.password = 'La contraseña es requerida.'
  else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres.'
  if (!form.rol)             e.rol      = 'Selecciona un rol.'
  errores.value = e
  return Object.keys(e).length === 0
}

const submit = async () => {
  errorServidor.value = null
  if (!validar()) return
  cargando.value = true
  try {
    const { data } = await api.post('/api/usuarios', {
      nombre:   form.nombre.trim(),
      apellido: form.apellido.trim(),
      email:    form.email.trim(),
      password: form.password,
      telefono: form.telefono.trim() || undefined,
      rol:      form.rol,
    })
    emit('creado', {
      id:       data.id,
      nombre:   form.nombre.trim(),
      apellido: form.apellido.trim(),
      email:    form.email.trim(),
    })
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'Error al crear el usuario.'
  } finally {
    cargando.value = false
  }
}
</script>

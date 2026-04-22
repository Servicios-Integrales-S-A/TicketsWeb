<template>
  <AppModal
    :titulo="usuario ? `${usuario.nombre} ${usuario.apellido}` : '...'"
    cancel-label="Cerrar"
    size="lg"
    @close="$emit('close')"
  >
    <!-- Cargando -->
    <div v-if="cargando" class="text-center py-5 text-muted">
      <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger py-2 mb-0">
      <i class="bi bi-exclamation-circle me-1"></i>{{ error }}
    </div>

    <!-- Contenido -->
    <div v-else-if="usuario" class="row g-0">

      <!-- ── Columna principal ── -->
      <div class="col-12 col-lg-8 pe-lg-4">

        <div class="row g-3 mb-3">
          <div class="col-6">
            <label class="form-label">Nombre <span class="text-danger">*</span></label>
            <input type="text" class="form-control" :class="{ 'is-invalid': errores.nombre }"
              v-model="form.nombre" />
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
          <label class="form-label">Correo electrónico</label>
          <input type="email" class="form-control" :value="usuario.email" disabled />
          <div class="form-text">El correo no se puede modificar.</div>
        </div>

        <div class="mb-4">
          <label class="form-label">Teléfono</label>
          <PhoneInput v-model="form.telefono" />
        </div>

        <!-- Restablecer contraseña -->
        <div class="border rounded p-3" style="border-radius: 10px !important;">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="fw-medium" style="font-size: 0.9rem;">Restablecer contraseña</div>
              <div class="text-muted" style="font-size: 0.8rem;">Asigna una nueva contraseña al usuario.</div>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="mostrarResetPass = !mostrarResetPass"
            >
              {{ mostrarResetPass ? 'Cancelar' : 'Restablecer' }}
            </button>
          </div>

          <div v-if="mostrarResetPass" class="mt-3">
            <AuthInput
              id="reset-pass-nuevo"
              label="Nueva contraseña"
              type="password"
              v-model="resetPass.password_nuevo"
              :error="resetPass.error"
              autocomplete="new-password"
            />
            <div v-if="resetPass.exito" class="alert alert-success py-2 mb-2" style="font-size: 0.875rem;">
              <i class="bi bi-check-circle me-1"></i>Contraseña restablecida correctamente.
            </div>
            <button
              type="button"
              class="btn btn-sm btn-danger"
              :disabled="resetPass.cargando"
              @click="restablecerPassword"
            >
              <span v-if="resetPass.cargando" class="spinner-border spinner-border-sm me-1"></span>
              Confirmar restablecimiento
            </button>
          </div>
        </div>

      </div>

      <!-- ── Sidebar ── -->
      <div class="col-12 col-lg-4 border-start ps-lg-4 mt-4 mt-lg-0">

        <div class="mb-3">
          <div class="sidebar-label">Rol</div>
          <select class="form-select form-select-sm" v-model="form.rol">
            <option value="cliente">Cliente</option>
            <option value="agente">Agente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div class="mb-3">
          <div class="sidebar-label">Estado</div>
          <div class="d-flex align-items-center gap-2 mt-1">
            <div class="form-check form-switch mb-0">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                :id="`activo-switch-${usuario.id}`"
                :checked="activoLocal"
                :disabled="toggling"
                @change="toggleActivo"
                style="cursor: pointer;"
              />
            </div>
            <span
              :class="['badge', activoLocal ? 'bg-success' : 'bg-secondary']"
              style="font-size: 0.75rem;"
            >
              {{ activoLocal ? 'Activo' : 'Inactivo' }}
            </span>
            <span v-if="toggling" class="spinner-border spinner-border-sm text-muted"></span>
          </div>
        </div>

        <hr class="my-3">

        <div class="mb-2">
          <div class="sidebar-label">Registrado</div>
          <div style="font-size: 0.85rem;">{{ formatFecha(usuario.creado_en) }}</div>
        </div>

        <div v-if="usuario.actualizado_en">
          <div class="sidebar-label">Última actualización</div>
          <div style="font-size: 0.85rem;">{{ formatFecha(usuario.actualizado_en) }}</div>
        </div>

      </div>
    </div>

    <!-- ── Footer ── -->
    <template #footer>
      <div v-if="errorGuardar" class="text-danger me-auto" style="font-size: 0.85rem;">
        <i class="bi bi-exclamation-circle me-1"></i>{{ errorGuardar }}
      </div>
      <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">Cerrar</button>
      <button
        v-if="usuario"
        type="button"
        class="btn btn-primary"
        :disabled="!hayCambios || guardando"
        @click="guardar"
      >
        <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
        {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api/axios'
import AppModal    from '@/components/ui/AppModal.vue'
import AuthInput   from '@/components/ui/AuthInput.vue'
import PhoneInput  from '@/components/ui/PhoneInput.vue'

const props = defineProps({
  userId: { type: String, required: true },
})

const emit = defineEmits(['close', 'guardado'])

const usuario      = ref(null)
const cargando     = ref(false)
const guardando    = ref(false)
const toggling     = ref(false)
const error        = ref(null)
const errorGuardar = ref(null)
const errores      = ref({})
const activoLocal  = ref(true)

const mostrarResetPass = ref(false)
const resetPass = reactive({ password_nuevo: '', error: '', exito: false, cargando: false })

const form     = reactive({ nombre: '', apellido: '', telefono: '', rol: '' })
const original = reactive({ nombre: '', apellido: '', telefono: '', rol: '' })

const hayCambios = computed(() =>
  form.nombre   !== original.nombre   ||
  form.apellido !== original.apellido ||
  form.telefono !== original.telefono ||
  form.rol      !== original.rol
)

const sincronizar = (u) => {
  const snap = {
    nombre:   u.nombre   ?? '',
    apellido: u.apellido ?? '',
    telefono: u.telefono ?? '',
    rol:      u.rol      ?? '',
  }
  Object.assign(form,     snap)
  Object.assign(original, snap)
  activoLocal.value = u.activo
}

const cargarUsuario = async () => {
  cargando.value = true
  error.value    = null
  try {
    const { data } = await api.get(`/api/usuarios/${props.userId}`)
    usuario.value = data
    sincronizar(data)
  } catch (err) {
    error.value = err.response?.status === 404
      ? 'Usuario no encontrado.'
      : 'No se pudo cargar el usuario.'
  } finally {
    cargando.value = false
  }
}

const validar = () => {
  const e = {}
  if (!form.nombre.trim())   e.nombre   = 'El nombre es requerido.'
  if (!form.apellido.trim()) e.apellido = 'El apellido es requerido.'
  errores.value = e
  return Object.keys(e).length === 0
}

const guardar = async () => {
  errorGuardar.value = null
  if (!validar()) return

  const campos = {}
  if (form.nombre   !== original.nombre)   campos.nombre   = form.nombre.trim()
  if (form.apellido !== original.apellido) campos.apellido = form.apellido.trim()
  if (form.telefono !== original.telefono) campos.telefono = form.telefono.trim() || undefined
  if (form.rol      !== original.rol)      campos.rol      = form.rol

  if (Object.keys(campos).length === 0) return

  guardando.value = true
  try {
    await api.put(`/api/usuarios/${props.userId}`, campos)
    Object.assign(original, form)
    usuario.value = { ...usuario.value, ...campos }
    emit('guardado')
  } catch (err) {
    errorGuardar.value = err.response?.data?.mensaje || 'Error al guardar los cambios.'
  } finally {
    guardando.value = false
  }
}

const toggleActivo = async () => {
  toggling.value = true
  try {
    await api.put(`/api/usuarios/${props.userId}/toggle-activo`)
    activoLocal.value = !activoLocal.value
    usuario.value = { ...usuario.value, activo: activoLocal.value }
    emit('guardado')
  } catch {
    // revert the checkbox visually
    activoLocal.value = !activoLocal.value
  } finally {
    toggling.value = false
  }
}

const restablecerPassword = async () => {
  resetPass.error  = ''
  resetPass.exito  = false
  if (!resetPass.password_nuevo)           { resetPass.error = 'La contraseña es requerida.'; return }
  if (resetPass.password_nuevo.length < 6) { resetPass.error = 'Mínimo 6 caracteres.'; return }

  resetPass.cargando = true
  try {
    await api.put(`/api/usuarios/${props.userId}/reset-password`, {
      password_nuevo: resetPass.password_nuevo,
    })
    resetPass.password_nuevo = ''
    resetPass.exito = true
    setTimeout(() => { resetPass.exito = false; mostrarResetPass.value = false }, 2500)
  } catch (err) {
    resetPass.error = err.response?.data?.mensaje || 'Error al restablecer la contraseña.'
  } finally {
    resetPass.cargando = false
  }
}

const formatFecha = f =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

onMounted(cargarUsuario)
</script>

<style scoped>
.sidebar-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6c757d;
  margin-bottom: 0.35rem;
}
</style>

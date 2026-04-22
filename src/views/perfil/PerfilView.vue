<template>
  <div class="container-fluid px-0" style="max-width: 860px;">
    <h5 class="fw-semibold mb-4">Mi perfil</h5>

    <div class="row g-4">

      <!-- ── Card: Información personal ── -->
      <div class="col-12 col-lg-7">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <h6 class="fw-semibold mb-1">Información personal</h6>
            <p class="text-muted mb-4" style="font-size: 0.85rem;">
              Actualiza tu nombre y teléfono de contacto.
            </p>

            <!-- Cargando -->
            <div v-if="cargandoPerfil" class="text-center py-4 text-muted">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
            </div>

            <template v-else>
              <div class="row g-3 mb-3">
                <div class="col-6">
                  <label class="form-label">Nombre <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': erroresPerfil.nombre }"
                    v-model="formPerfil.nombre"
                  />
                  <div class="invalid-feedback">{{ erroresPerfil.nombre }}</div>
                </div>
                <div class="col-6">
                  <label class="form-label">Apellido <span class="text-danger">*</span></label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': erroresPerfil.apellido }"
                    v-model="formPerfil.apellido"
                  />
                  <div class="invalid-feedback">{{ erroresPerfil.apellido }}</div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Correo electrónico</label>
                <input type="email" class="form-control" :value="perfil.email" disabled />
                <div class="form-text">El correo no se puede modificar.</div>
              </div>

              <div class="mb-4">
                <label class="form-label">Teléfono</label>
                <PhoneInput v-model="formPerfil.telefono" />
              </div>

              <!-- Meta info -->
              <div class="d-flex align-items-center gap-3 mb-4" style="font-size: 0.82rem; color: #6c757d;">
                <span>
                  Rol:
                  <span :class="['badge', badgeRol(perfil.rol)]" style="font-size: 0.7rem;">
                    {{ labelRol(perfil.rol) }}
                  </span>
                </span>
                <span><i class="bi bi-calendar3 me-1"></i>Miembro desde {{ formatFecha(perfil.creado_en) }}</span>
              </div>

              <div v-if="exitoPerfil" class="alert alert-success py-2 mb-3" style="font-size: 0.875rem;">
                <i class="bi bi-check-circle me-1"></i>Perfil actualizado correctamente.
              </div>
              <div v-if="errorPerfil" class="alert alert-danger py-2 mb-3" style="font-size: 0.875rem;">
                <i class="bi bi-exclamation-circle me-1"></i>{{ errorPerfil }}
              </div>

              <button
                type="button"
                class="btn btn-primary"
                :disabled="!hayCambiosPerfil || guardandoPerfil"
                @click="guardarPerfil"
              >
                <span v-if="guardandoPerfil" class="spinner-border spinner-border-sm me-2"></span>
                {{ guardandoPerfil ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- ── Card: Cambiar contraseña ── -->
      <div class="col-12 col-lg-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body p-4">
            <h6 class="fw-semibold mb-1">Cambiar contraseña</h6>
            <p class="text-muted mb-4" style="font-size: 0.85rem;">
              Elige una contraseña segura que no uses en otros sitios.
            </p>

            <AuthInput
              id="pass-actual"
              label="Contraseña actual"
              type="password"
              v-model="formPass.password_actual"
              :error="erroresPass.password_actual"
              autocomplete="current-password"
            />

            <AuthInput
              id="pass-nuevo"
              label="Nueva contraseña"
              type="password"
              v-model="formPass.password_nuevo"
              :error="erroresPass.password_nuevo"
              autocomplete="new-password"
            />

            <AuthInput
              id="pass-confirmar"
              label="Confirmar nueva contraseña"
              type="password"
              v-model="formPass.confirmar"
              :error="erroresPass.confirmar"
              autocomplete="new-password"
            />

            <div v-if="exitoPass" class="alert alert-success py-2 mb-3" style="font-size: 0.875rem;">
              <i class="bi bi-check-circle me-1"></i>Contraseña actualizada correctamente.
            </div>
            <div v-if="errorPass" class="alert alert-danger py-2 mb-3" style="font-size: 0.875rem;">
              <i class="bi bi-exclamation-circle me-1"></i>{{ errorPass }}
            </div>

            <button
              type="button"
              class="btn btn-primary"
              :disabled="guardandoPass"
              @click="cambiarPassword"
            >
              <span v-if="guardandoPass" class="spinner-border spinner-border-sm me-2"></span>
              {{ guardandoPass ? 'Actualizando...' : 'Actualizar contraseña' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import api from '@/api/axios'
import AuthInput  from '@/components/ui/AuthInput.vue'
import PhoneInput from '@/components/ui/PhoneInput.vue'

const store = useStore()

// ── Perfil ────────────────────────────────────────────────────────────────

const perfil        = ref({})
const cargandoPerfil = ref(false)
const guardandoPerfil = ref(false)
const errorPerfil   = ref(null)
const exitoPerfil   = ref(false)
const erroresPerfil = ref({})

const formPerfil    = reactive({ nombre: '', apellido: '', telefono: '' })
const originalPerfil = reactive({ nombre: '', apellido: '', telefono: '' })

const hayCambiosPerfil = computed(() =>
  formPerfil.nombre    !== originalPerfil.nombre    ||
  formPerfil.apellido  !== originalPerfil.apellido  ||
  formPerfil.telefono  !== originalPerfil.telefono
)

const cargarPerfil = async () => {
  cargandoPerfil.value = true
  try {
    const { data } = await api.get('/api/usuarios/perfil')
    perfil.value = data
    const snap = {
      nombre:   data.nombre   ?? '',
      apellido: data.apellido ?? '',
      telefono: data.telefono ?? '',
    }
    Object.assign(formPerfil,    snap)
    Object.assign(originalPerfil, snap)
  } catch {
    errorPerfil.value = 'No se pudo cargar el perfil.'
  } finally {
    cargandoPerfil.value = false
  }
}

const guardarPerfil = async () => {
  erroresPerfil.value = {}
  errorPerfil.value   = null
  exitoPerfil.value   = false

  const e = {}
  if (!formPerfil.nombre.trim())   e.nombre   = 'El nombre es requerido.'
  if (!formPerfil.apellido.trim()) e.apellido = 'El apellido es requerido.'
  if (Object.keys(e).length) { erroresPerfil.value = e; return }

  guardandoPerfil.value = true
  try {
    await api.put('/api/usuarios/perfil', {
      nombre:   formPerfil.nombre.trim(),
      apellido: formPerfil.apellido.trim(),
      telefono: formPerfil.telefono.trim() || undefined,
    })
    Object.assign(originalPerfil, formPerfil)
    perfil.value = { ...perfil.value, ...formPerfil }
    store.commit('auth/UPDATE_USUARIO', {
      nombre:   formPerfil.nombre.trim(),
      apellido: formPerfil.apellido.trim(),
    })
    exitoPerfil.value = true
    setTimeout(() => { exitoPerfil.value = false }, 3000)
  } catch (err) {
    errorPerfil.value = err.response?.data?.mensaje || 'Error al guardar los cambios.'
  } finally {
    guardandoPerfil.value = false
  }
}

// ── Contraseña ────────────────────────────────────────────────────────────

const guardandoPass = ref(false)
const errorPass     = ref(null)
const exitoPass     = ref(false)
const erroresPass   = ref({})

const formPass = reactive({ password_actual: '', password_nuevo: '', confirmar: '' })

const cambiarPassword = async () => {
  erroresPass.value = {}
  errorPass.value   = null
  exitoPass.value   = false

  const e = {}
  if (!formPass.password_actual)         e.password_actual = 'La contraseña actual es requerida.'
  if (!formPass.password_nuevo)          e.password_nuevo  = 'La nueva contraseña es requerida.'
  if (formPass.password_nuevo && formPass.password_nuevo.length < 6)
                                         e.password_nuevo  = 'Mínimo 6 caracteres.'
  if (formPass.password_nuevo !== formPass.confirmar)
                                         e.confirmar       = 'Las contraseñas no coinciden.'
  if (Object.keys(e).length) { erroresPass.value = e; return }

  guardandoPass.value = true
  try {
    await api.put('/api/usuarios/perfil/cambiar-password', {
      password_actual: formPass.password_actual,
      password_nuevo:  formPass.password_nuevo,
    })
    formPass.password_actual = ''
    formPass.password_nuevo  = ''
    formPass.confirmar       = ''
    exitoPass.value = true
    setTimeout(() => { exitoPass.value = false }, 3000)
  } catch (err) {
    errorPass.value = err.response?.data?.mensaje || 'Error al actualizar la contraseña.'
  } finally {
    guardandoPass.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

const ROL_LABEL = { admin: 'Administrador', agente: 'Agente', cliente: 'Cliente' }
const ROL_BADGE = { admin: 'bg-danger', agente: 'bg-primary', cliente: 'bg-secondary' }

const labelRol  = r => ROL_LABEL[r] ?? r
const badgeRol  = r => ROL_BADGE[r] ?? 'bg-secondary'

const formatFecha = f =>
  f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

onMounted(cargarPerfil)
</script>

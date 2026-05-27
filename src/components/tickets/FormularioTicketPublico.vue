<template>

  <!-- Estado de éxito (modo público) -->
  <div v-if="exito" class="exito-container">
    <div class="exito-icono">
      <i class="bi bi-check-circle-fill"></i>
    </div>
    <p class="exito-titulo">¡Solicitud enviada!</p>
    <p class="exito-numero">{{ exito.numero_legible }}</p>
    <p class="exito-desc">
      Guarda este número para consultar el estado de tu solicitud en cualquier momento.
      <span v-if="exito.es_nuevo_usuario">
        Te enviamos tus credenciales de acceso a <strong>{{ emailEnviado }}</strong>.
      </span>
      <span v-else>
        Recibirás una confirmación en <strong>{{ emailEnviado }}</strong>.
      </span>
    </p>
  </div>

  <!-- Formulario -->
  <form v-else @submit.prevent novalidate>

    <div v-if="errorServidor" class="alert alert-danger py-2 mb-3" style="font-size: 0.875rem;">
      <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
    </div>

    <!-- Título -->
    <div class="mb-3">
      <label class="form-label">Título <span class="text-danger">*</span></label>
      <input
        v-model="form.titulo"
        type="text"
        class="form-control"
        :class="{ 'is-invalid': errores.titulo }"
        maxlength="200"
      />
      <div class="invalid-feedback">{{ errores.titulo }}</div>
    </div>

    <!-- Descripción -->
    <div class="mb-3">
      <label class="form-label">Descripción <span class="text-danger">*</span></label>
      <textarea
        v-model="form.descripcion"
        class="form-control"
        :class="{ 'is-invalid': errores.descripcion }"
        rows="3"
        maxlength="2000"
      ></textarea>
      <div class="invalid-feedback">{{ errores.descripcion }}</div>
    </div>

    <!-- Categoría -->
    <div class="mb-3">
      <label class="form-label">Categoría <span class="text-danger">*</span></label>
      <select
        v-model="form.id_categoria"
        class="form-select"
        :class="{ 'is-invalid': errores.id_categoria }"
        :disabled="cargandoCategorias"
      >
        <option value="" disabled>
          {{ cargandoCategorias ? 'Cargando categorías...' : 'Selecciona una categoría' }}
        </option>
        <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
          {{ cat.nombre }}
        </option>
      </select>
      <div class="invalid-feedback">{{ errores.id_categoria }}</div>
    </div>

    <!-- Campos personales: solo en modo público -->
    <template v-if="publico">

      <!-- Email -->
      <div class="mb-3">
        <label class="form-label">Correo electrónico <span class="text-danger">*</span></label>
        <input
          v-model="form.email"
          type="email"
          class="form-control"
          :class="{ 'is-invalid': errores.email }"
          maxlength="150"
          autocomplete="email"
        />
        <div class="invalid-feedback">{{ errores.email }}</div>
      </div>

      <!-- Nombre y Apellido en fila -->
      <div class="formulario-fila mb-3">
        <div>
          <label class="form-label">Nombre <span class="text-danger">*</span></label>
          <input
            v-model="form.nombre"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errores.nombre }"
            maxlength="100"
          />
          <div class="invalid-feedback">{{ errores.nombre }}</div>
        </div>
        <div>
          <label class="form-label">Apellido <span class="text-danger">*</span></label>
          <input
            v-model="form.apellido"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errores.apellido }"
            maxlength="100"
          />
          <div class="invalid-feedback">{{ errores.apellido }}</div>
        </div>
      </div>

      <!-- Teléfono -->
      <div class="mb-3">
        <label class="form-label">Teléfono</label>
        <input v-model="form.telefono" type="tel" class="form-control" maxlength="20" />
      </div>

    </template>

  </form>

</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'
import { crearTicketPublico, listarCategoriasPublicas } from '@/api/consulta'

const props = defineProps({
  publico: { type: Boolean, default: true },
})

const emit = defineEmits(['exito', 'creado', 'cargando', 'reiniciado'])

const categorias         = ref([])
const cargandoCategorias = ref(false)
const cargando           = ref(false)
const errores            = ref({})
const errorServidor      = ref(null)
const exito              = ref(null)
const emailEnviado       = ref('')

const form = reactive({
  titulo:       '',
  descripcion:  '',
  id_categoria: '',
  email:        '',
  nombre:       '',
  apellido:     '',
  telefono:     '',
})

onMounted(async () => {
  cargandoCategorias.value = true
  try {
    const { data } = await listarCategoriasPublicas()
    categorias.value = data.datos ?? data
  } catch {
    // el select quedará vacío; el backend validará al enviar
  } finally {
    cargandoCategorias.value = false
  }
})

function validar() {
  const e = {}
  if (!form.titulo.trim())       e.titulo       = 'El título es requerido.'
  if (!form.descripcion.trim())  e.descripcion  = 'La descripción es requerida.'
  if (!form.id_categoria)        e.id_categoria = 'Selecciona una categoría.'
  if (props.publico) {
    if (!form.email.trim())    e.email    = 'El correo electrónico es requerido.'
    if (!form.nombre.trim())   e.nombre   = 'El nombre es requerido.'
    if (!form.apellido.trim()) e.apellido = 'El apellido es requerido.'
  }
  errores.value = e
  return Object.keys(e).length === 0
}

async function submit() {
  // En modo público con éxito ya mostrado, reiniciar para enviar otra
  if (exito.value) {
    reiniciar()
    return
  }

  errorServidor.value = null
  if (!validar()) return

  cargando.value = true
  emit('cargando', true)
  try {
    if (props.publico) {
      const { data } = await crearTicketPublico({
        titulo:       form.titulo.trim(),
        descripcion:  form.descripcion.trim(),
        id_categoria: form.id_categoria,
        email:        form.email.trim(),
        nombre:       form.nombre.trim(),
        apellido:     form.apellido.trim(),
        telefono:     form.telefono.trim() || undefined,
      })
      emailEnviado.value = form.email.trim()
      exito.value = data
      emit('exito', data)
    } else {
      await api.post('/api/tickets', {
        titulo:       form.titulo.trim(),
        descripcion:  form.descripcion.trim(),
        id_categoria: form.id_categoria,
        canal:        'web',
      })
      emit('creado')
    }
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'No se pudo crear el ticket. Intenta de nuevo.'
  } finally {
    cargando.value = false
    emit('cargando', false)
  }
}

function reiniciar() {
  emit('reiniciado')
  exito.value        = null
  errorServidor.value = null
  errores.value      = {}
  form.titulo        = ''
  form.descripcion   = ''
  form.id_categoria  = ''
  form.email         = ''
  form.nombre        = ''
  form.apellido      = ''
  form.telefono      = ''
}

defineExpose({ submit })
</script>

<style scoped>
.formulario-fila {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

/* ── Estado de éxito ── */
.exito-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  text-align: center;
}

.exito-icono {
  font-size: 2.5rem;
  color: #198754;
}

.exito-titulo {
  font-size: 1.1rem;
  font-weight: 700;
  color: #212529;
  margin: 0;
}

.exito-numero {
  font-size: 1.6rem;
  font-weight: 800;
  color: #198754;
  letter-spacing: 0.05em;
  margin: 0;
}

.exito-desc {
  font-size: 0.83rem;
  color: #495057;
  line-height: 1.55;
  margin: 0 0 0.5rem;
}
</style>

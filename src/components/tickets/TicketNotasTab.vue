<template>
  <div class="notas-tab">

    <!-- Thread scrollable -->
    <div class="notas-thread" ref="threadRef">

      <div v-if="cargando" class="text-center py-3 text-muted" style="font-size: 0.85rem;">
        <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
      </div>

      <div v-else-if="notas.length === 0" class="text-center py-3 text-muted" style="font-size: 0.85rem;">
        Sin mensajes aún. Sé el primero en escribir.
      </div>

      <div v-else class="nota-list">
        <div
          v-for="nota in notas"
          :key="nota.id"
          class="nota-item"
          :class="{ 'nota-interna': nota.es_interna }"
        >
          <div class="nota-header">
            <span class="nota-autor">{{ nota.autor }}</span>
            <span v-if="nota.es_interna" class="badge bg-warning text-dark ms-2" style="font-size: 0.65rem;">Interna</span>
            <span class="nota-fecha ms-auto">{{ formatFechaHora(nota.creado_en) }}</span>
          </div>
          <!-- Contenido con menciones resaltadas -->
          <div class="nota-body" v-html="resaltarMenciones(nota.contenido)"></div>
        </div>
      </div>
    </div>

    <!-- Formulario fijo -->
    <div class="notas-form">

      <!-- Mention picker -->
      <div v-if="mencionando && sugerencias.length > 0" class="mention-picker border rounded bg-white shadow-sm">
        <div
          v-for="(p, i) in sugerencias"
          :key="p.id"
          class="mention-item px-3 py-2 d-flex align-items-center gap-2"
          :class="{ 'mention-activo': i === indiceSugerencia }"
          @mousedown.prevent="seleccionarMencion(p)"
        >
          <i class="bi bi-person-circle text-muted"></i>
          <div>
            <span style="font-size: 0.8rem; font-weight: 600;">@{{ p.username }}</span>
            <span class="text-muted ms-2" style="font-size: 0.75rem;">{{ p.nombre }} {{ p.apellido }}</span>
          </div>
          <span class="badge ms-auto text-capitalize" :class="badgeRol(p.rol)" style="font-size: 0.65rem;">{{ p.rol }}</span>
        </div>
      </div>

      <div class="position-relative">
        <textarea
          ref="textareaRef"
          v-model="nuevaNota"
          class="form-control"
          rows="3"
          placeholder="Escribe un mensaje... usa @ para mencionar"
          :disabled="enviando"
          @input="onInput"
          @keydown="onKeydown"
        ></textarea>
      </div>

      <div class="d-flex align-items-center justify-content-between mt-2">
        <label v-if="!esCliente" class="form-check-label d-flex align-items-center gap-2" style="font-size: 0.85rem; cursor: pointer;">
          <input type="checkbox" class="form-check-input m-0" v-model="notaInterna" :disabled="enviando">
          Nota interna (solo agentes)
        </label>
        <span v-else></span>

        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="!nuevaNota.trim() || enviando"
          @click="enviar"
        >
          <span v-if="enviando" class="spinner-border spinner-border-sm me-1"></span>
          Enviar
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useStore } from 'vuex'
import api from '@/api/axios'

const props = defineProps({
  ticketId:  { type: String, required: true },
  esCliente: { type: Boolean, default: false },
})

const store    = useStore()
const usuario  = computed(() => store.getters['auth/usuario'])

const notas          = ref([])
const cargando       = ref(false)
const nuevaNota      = ref('')
const notaInterna    = ref(false)
const enviando       = ref(false)
const threadRef      = ref(null)
const textareaRef    = ref(null)

// ── Mention picker ────────────────────────────────────────
const participantes    = ref([])
const mencionando      = ref(false)
const filtroMencion    = ref('')
const indiceSugerencia = ref(0)

const sugerencias = computed(() => {
  if (!filtroMencion.value) return participantes.value
  const f = filtroMencion.value.toLowerCase()
  return participantes.value.filter(
    p => p.username.includes(f) || p.nombre.toLowerCase().includes(f) || p.apellido.toLowerCase().includes(f)
  )
})

const cargarParticipantes = async () => {
  try {
    const { data } = await api.get(`/api/tickets/${props.ticketId}/participantes`)
    participantes.value = data
  } catch { /* silencioso */ }
}

const onInput = () => {
  const el  = textareaRef.value
  const pos = el.selectionStart
  const texto = nuevaNota.value.substring(0, pos)
  const match = texto.match(/@([\w.]*)$/)
  if (match) {
    filtroMencion.value    = match[1].toLowerCase()
    mencionando.value      = true
    indiceSugerencia.value = 0
  } else {
    mencionando.value = false
  }
}

const onKeydown = (e) => {
  if (!mencionando.value || sugerencias.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    indiceSugerencia.value = (indiceSugerencia.value + 1) % sugerencias.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    indiceSugerencia.value = (indiceSugerencia.value - 1 + sugerencias.value.length) % sugerencias.value.length
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    if (mencionando.value) {
      e.preventDefault()
      seleccionarMencion(sugerencias.value[indiceSugerencia.value])
    }
  } else if (e.key === 'Escape') {
    mencionando.value = false
  }
}

const seleccionarMencion = (participante) => {
  const el    = textareaRef.value
  const pos   = el.selectionStart
  const texto = nuevaNota.value
  const antes = texto.substring(0, pos)
  const match = antes.match(/@([\w.]*)$/)
  if (!match) return
  const inicio = pos - match[0].length
  nuevaNota.value   = texto.substring(0, inicio) + `@${participante.username} ` + texto.substring(pos)
  mencionando.value = false
  nextTick(() => {
    el.focus()
    const nueva = inicio + participante.username.length + 2
    el.setSelectionRange(nueva, nueva)
  })
}

const badgeRol = (rol) => ({
  'bg-danger bg-opacity-10 text-danger':   rol === 'admin',
  'bg-primary bg-opacity-10 text-primary': rol === 'agente',
  'bg-success bg-opacity-10 text-success': rol === 'cliente',
})

// ── Resaltar menciones en el contenido ───────────────────
const resaltarMenciones = (contenido) => {
  if (!contenido) return ''
  const seguro = contenido.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  return seguro.replace(/@([\w.]+)/g, '<span class="mention-tag">@$1</span>')
}

// ── Cargar notas ──────────────────────────────────────────
const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await api.get(`/api/tickets/${props.ticketId}/notas`)
    notas.value = data
    await nextTick()
    scrollBottom()
  } catch { /* silencioso */ } finally {
    cargando.value = false
  }
}

const scrollBottom = () => {
  if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
}

// ── Enviar nota ───────────────────────────────────────────
const enviar = async () => {
  const contenido = nuevaNota.value.trim()
  if (!contenido) return
  enviando.value = true
  try {
    const esInterna = props.esCliente ? false : notaInterna.value
    const { data }  = await api.post(`/api/tickets/${props.ticketId}/notas`, { contenido, es_interna: esInterna })
    notas.value.push({
      id:          data.id,
      contenido,
      es_interna:  data.es_interna,
      creado_en:   data.creado_en,
      autor:       `${usuario.value?.nombre ?? ''} ${usuario.value?.apellido ?? ''}`.trim(),
      autor_email: usuario.value?.email ?? '',
    })
    nuevaNota.value   = ''
    notaInterna.value = false
    await nextTick()
    scrollBottom()
  } catch { /* silencioso */ } finally {
    enviando.value = false
  }
}

defineExpose({ cargar })

onMounted(() => {
  cargar()
  cargarParticipantes()
})

const formatFechaHora = f =>
  f ? new Date(f).toLocaleString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
</script>

<style scoped>
.notas-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.notas-thread {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 2px;
}

.nota-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
}

.nota-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
}

.nota-interna {
  background: #fff8e1;
  border-left: 3px solid #ffc107;
}

.nota-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.3rem;
}

.nota-autor {
  font-weight: 600;
  font-size: 0.8rem;
}

.nota-fecha {
  font-size: 0.72rem;
  color: #6c757d;
}

.nota-body {
  white-space: pre-wrap;
  line-height: 1.5;
  color: #212529;
}

.notas-form {
  flex-shrink: 0;
  padding-top: 0.75rem;
  border-top: 1px solid #dee2e6;
}

.notas-form textarea {
  resize: none;
  font-size: 0.875rem;
}

/* Mention picker */
.mention-picker {
  margin-bottom: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.mention-item {
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.1s;
}

.mention-item:hover,
.mention-activo {
  background: #f0f7ff;
}
</style>

<!-- Estilo global para menciones resaltadas en contenido de notas -->
<style>
.mention-tag {
  color: #0d6efd;
  font-weight: 600;
  background: #e8f0fe;
  border-radius: 4px;
  padding: 0 3px;
}
</style>

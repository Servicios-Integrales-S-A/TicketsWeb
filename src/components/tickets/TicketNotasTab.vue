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
          <div class="nota-body">{{ nota.contenido }}</div>
        </div>
      </div>
    </div>

    <!-- Formulario fijo -->
    <div class="notas-form">
      <textarea
        v-model="nuevaNota"
        class="form-control"
        rows="3"
        placeholder="Escribe un mensaje..."
        :disabled="enviando"
      ></textarea>

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
import { ref, nextTick, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import api from '@/api/axios'

const props = defineProps({
  ticketId:  { type: String, required: true },
  esCliente: { type: Boolean, default: false },
})

const store    = useStore()
const usuario  = computed(() => store.getters['auth/usuario'])

const notas       = ref([])
const cargando    = ref(false)
const nuevaNota   = ref('')
const notaInterna = ref(false)
const enviando    = ref(false)
const threadRef   = ref(null)

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

onMounted(cargar)

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
</style>

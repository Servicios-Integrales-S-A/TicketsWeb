<template>
  <div class="historial-tab">

    <div v-if="cargando" class="text-center py-3 text-muted" style="font-size: 0.85rem;">
      <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
    </div>

    <div v-else-if="historial.length === 0" class="text-center py-3 text-muted" style="font-size: 0.85rem;">
      Sin actividad registrada.
    </div>

    <div v-else class="historial-list">
      <div v-for="evento in historial" :key="evento.id" class="historial-item">
        <div class="historial-dot"></div>
        <div class="historial-content">
          <div style="font-size: 0.85rem;">
            <span class="fw-medium">{{ evento.realizado_por }}</span>
            <span class="text-muted"> — {{ evento.detalle }}</span>
          </div>
          <div class="text-muted" style="font-size: 0.75rem;">{{ formatFechaHora(evento.creado_en) }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const props = defineProps({
  ticketId: { type: String, required: true },
})

const historial = ref([])
const cargando  = ref(false)

const cargar = async () => {
  cargando.value = true
  try {
    const { data } = await api.get(`/api/tickets/${props.ticketId}/historial`)
    historial.value = data
  } catch { /* silencioso */ } finally {
    cargando.value = false
  }
}

defineExpose({ cargar })

onMounted(cargar)

const formatFechaHora = f =>
  f ? new Date(f).toLocaleString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
</script>

<style scoped>
.historial-tab {
  height: 100%;
  overflow-y: auto;
}

.historial-list {
  display: flex;
  flex-direction: column;
  padding-left: 1rem;
  border-left: 2px solid #dee2e6;
}

.historial-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
  position: relative;
}

.historial-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6c757d;
  flex-shrink: 0;
  margin-top: 0.3rem;
  margin-left: -1.35rem;
}

.historial-content {
  flex: 1;
}
</style>

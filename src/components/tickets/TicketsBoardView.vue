<template>
  <div class="board" @dragend="onDragEnd">

    <!-- ── Headers (fila 0 del grid) ───────────────────────────────────── -->
    <div class="board-row-num board-col-header" style="border-top-color: transparent;"></div>
    <div
      v-for="col in COLUMNAS"
      :key="`h-${col.estado}`"
      class="board-col-header"
      :class="{ 'board-col-header--active': columnaActiva === col.estado }"
      :style="{ '--col-color': col.color }"
    >
      <span class="fw-semibold" :style="{ color: col.color }">{{ col.label }}</span>
      <span class="badge bg-light text-muted ms-2" style="font-size: 0.72rem;">
        {{ rows.filter(r => r.currentEstado === col.estado).length }}
      </span>
    </div>

    <!-- ── Filas de tickets (5 celdas por fila: # + 4 columnas) ────────── -->
    <template v-for="(row, rowIndex) in rows" :key="row.id">
      <div class="board-row-num board-cell d-flex align-items-center justify-content-center">
        <small class="text-muted">{{ rowIndex + 1 }}</small>
      </div>
      <div
        v-for="col in COLUMNAS"
        :key="col.estado"
        class="board-cell"
        :class="{ 'board-cell--target': arrastrandoId && columnaActiva === col.estado }"
        @dragover.prevent="columnaActiva = col.estado"
        @drop.prevent="onDrop(col.estado)"
      >
        <!-- Ticket real -->
        <TicketCard
          v-if="row.currentEstado === col.estado"
          :ticket="{ ...row, isGhost: false }"
          :dragging="arrastrandoId === row.id"
          :can-drag="puedeArrastrar"
          :es-cliente="esCliente"
          :agentes="agentes"
          :mostrar-ocultar="row.currentEstado === 'cerrado'"
          @click="irDetalle(row.id)"
          @dragstart="onDragStart(row.id)"
          @dragend="onDragEnd"
          @ocultar="emit('ocultar', row.id)"
          @change-prioridad="(val) => onCampo(row.id, { prioridad: val })"
          @change-agente="(val) => onCampo(row.id, { id_agente: val })"
        />
        <!-- Ghost (misma fila, columna original) -->
        <TicketCard
          v-else-if="row.ghostEstado === col.estado"
          :ticket="{ ...row, isGhost: true }"
          :es-cliente="esCliente"
          @click="irDetalle(row.id)"
        />
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import api from '@/api/axios'
import TicketCard from '@/components/tickets/TicketCard.vue'

const props = defineProps({
  tickets:  { type: Array,   default: () => [] },
  agentes:  { type: Array,   default: () => [] },
  cargando: { type: Boolean, default: false },
})

const emit = defineEmits(['ocultar'])

const router = useRouter()
const store  = useStore()

const rol            = computed(() => store.getters['auth/rol'])
const esCliente      = computed(() => rol.value === 'cliente')
const puedeArrastrar = computed(() => !esCliente.value)

// ── Filas ─────────────────────────────────────────────────────────────────
// Cada fila = un ticket con currentEstado (columna donde está) y
// ghostEstado (columna donde se muestra el ghost, null si no se ha movido)

const rows = ref([])

watch(() => props.tickets, val => {
  rows.value = val.map(t => ({
    id:             t.id,
    titulo:         t.titulo,
    agente:         t.agente,
    id_agente:      t.id_agente,
    prioridad:      t.prioridad,
    numero_legible: t.numero_legible,
    currentEstado:  t.estado,
    ghostEstado:    t.estado !== 'abierto' ? 'abierto' : null,
  }))
}, { immediate: true })

// ── Drag & drop ───────────────────────────────────────────────────────────

const arrastrandoId = ref(null)
const columnaActiva = ref(null)

const onDragStart = (id) => { arrastrandoId.value = id }

const onDragEnd = () => {
  arrastrandoId.value = null
  columnaActiva.value = null
}

const onDrop = async (nuevoEstado) => {
  const id = arrastrandoId.value
  columnaActiva.value = null
  arrastrandoId.value = null

  if (!id) return

  const row = rows.value.find(r => r.id === id)
  if (!row || row.currentEstado === nuevoEstado) return

  const estadoAnterior = row.currentEstado
  const hadGhost       = !!row.ghostEstado

  if (nuevoEstado === 'abierto') {
    row.ghostEstado = null
  } else if (!hadGhost) {
    row.ghostEstado = 'abierto'
  }

  row.currentEstado = nuevoEstado

  try {
    await api.patch(`/api/tickets/${id}`, { estado: nuevoEstado })
  } catch {
    row.currentEstado = estadoAnterior
    if (nuevoEstado === 'abierto' && hadGhost) row.ghostEstado = 'abierto'
    else if (!hadGhost)                         row.ghostEstado = null
  }
}

const onCampo = async (id, campos) => {
  const row = rows.value.find(r => r.id === id)
  if (!row) return

  const anterior = { prioridad: row.prioridad, id_agente: row.id_agente, agente: row.agente }

  if (campos.prioridad) row.prioridad = campos.prioridad
  if (campos.id_agente) {
    row.id_agente = campos.id_agente
    const ag = props.agentes.find(a => a.id === campos.id_agente)
    row.agente = ag ? `${ag.nombre} ${ag.apellido}` : row.agente
  }

  try {
    await api.patch(`/api/tickets/${id}`, campos)
  } catch {
    row.prioridad = anterior.prioridad
    row.id_agente = anterior.id_agente
    row.agente    = anterior.agente
  }
}

const irDetalle = (id) => router.push({ name: 'tickets-detalle', params: { id } })

// ── Columnas ──────────────────────────────────────────────────────────────

const COLUMNAS = [
  { estado: 'abierto',     label: 'Abierto',    color: '#0d6efd' },
  { estado: 'en_progreso', label: 'En progreso', color: '#ffc107' },
  { estado: 'resuelto',    label: 'Resuelto',   color: '#198754' },
  { estado: 'cerrado',     label: 'Cerrado',    color: '#6c757d' },
]
</script>

<style scoped>
.board {
  display: grid;
  grid-template-columns: 40px repeat(4, 1fr);
  column-gap: 0.5rem;
  row-gap: 0.35rem;
  align-items: stretch;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Headers ── */
.board-col-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 0.65rem 0.85rem;
  background: #fff;
  border-top: 3px solid var(--col-color);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}

.board-col-header--active {
  background: #f0f5ff;
}

.board-row-num {
  background: transparent !important;
  border: none !important;
  outline: none !important;
}

/* ── Celdas ── */
.board-cell {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 0.4rem;
  min-height: 76px;
  transition: background 0.15s;
}

.board-cell--target {
  background: #e4ecfb;
  outline: 2px dashed rgba(13, 110, 253, 0.35);
  outline-offset: -2px;
}
</style>

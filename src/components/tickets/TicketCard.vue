<template>
  <div
    class="ticket-card"
    :class="{
      'ticket-card--ghost':    ticket.isGhost,
      'ticket-card--dragging': dragging,
    }"
    :draggable="!ticket.isGhost && canDrag"
    @click="$emit('click')"
    @dragstart.stop="$emit('dragstart')"
    @dragend.stop="$emit('dragend')"
  >
    <!-- Encabezado: número + badge de prioridad (o flecha en ghost) -->
    <div class="d-flex justify-content-between align-items-start mb-1">
      <small class="text-muted">{{ ticket.numero_legible }}</small>

      <i v-if="ticket.isGhost" class="bi bi-arrow-right text-muted" style="font-size: 0.75rem;"></i>

      <!-- Badge-select de prioridad para agente/admin -->
      <ColorBadgeSelect
        v-else-if="!esCliente"
        :model-value="ticket.prioridad"
        :options="PRIOR_OPTIONS"
        @update:model-value="val => $emit('change-prioridad', val)"
      />

      <!-- Badge estático para clientes -->
      <span
        v-else
        :class="['badge', badgePrioridad(ticket.prioridad)]"
        style="font-size: 0.7rem;"
      >{{ labelPrioridad(ticket.prioridad) }}</span>
    </div>

    <!-- Título -->
    <div class="ticket-card__titulo" :class="{ 'text-muted': ticket.isGhost }">
      {{ ticket.titulo }}
    </div>

    <!-- Pie: agente + botón ocultar -->
    <div class="d-flex align-items-center justify-content-between mt-2" @click.stop @dragstart.stop>

      <!-- Agente con ícono + select compacto (o texto para ghost/cliente) -->
      <div class="ticket-card__agente d-flex align-items-center gap-1">
        <i class="bi bi-person text-muted" style="font-size: 0.85rem;"></i>
        <select
          v-if="!ticket.isGhost && !esCliente"
          class="agent-select"
          :value="ticket.id_agente ?? ''"
          @change="$emit('change-agente', $event.target.value)"
        >
          <option value="" disabled>Sin asignar</option>
          <option v-for="ag in agentes" :key="ag.id" :value="ag.id">
            {{ ag.nombre }} {{ ag.apellido }}
          </option>
        </select>
        <small v-else class="text-muted">{{ ticket.agente || 'Sin agente' }}</small>
      </div>

      <button
        v-if="mostrarOcultar && !ticket.isGhost"
        type="button"
        class="btn btn-sm btn-link p-0 text-muted"
        title="Ocultar — visible al filtrar por estado cerrado"
        @click.stop="$emit('ocultar')"
      >
        <i class="bi bi-eye-slash" style="font-size: 0.85rem;"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import ColorBadgeSelect from '@/components/ui/ColorBadgeSelect.vue'

defineProps({
  ticket:        { type: Object,  required: true },
  dragging:      { type: Boolean, default: false },
  canDrag:       { type: Boolean, default: false },
  esCliente:     { type: Boolean, default: false },
  agentes:       { type: Array,   default: () => [] },
  mostrarOcultar:{ type: Boolean, default: false },
})

defineEmits(['click', 'dragstart', 'dragend', 'ocultar', 'change-prioridad', 'change-agente'])

const PRIOR_BADGE   = { bajo: 'bg-secondary', medio: 'bg-info text-dark', alto: 'bg-warning text-dark', critico: 'bg-danger' }
const PRIOR_OPTIONS = [
  { value: 'bajo',    label: 'Bajo',    color: { bg: '#6c757d', text: '#fff' } },
  { value: 'medio',   label: 'Medio',   color: { bg: '#0dcaf0', text: '#212529' } },
  { value: 'alto',    label: 'Alto',    color: { bg: '#ffc107', text: '#212529' } },
  { value: 'critico', label: 'Crítico', color: { bg: '#dc3545', text: '#fff' } },
]

const badgePrioridad = p => PRIOR_BADGE[p] ?? 'bg-secondary'
const labelPrioridad = p => PRIOR_OPTIONS.find(o => o.value === p)?.label ?? p
</script>

<style scoped>
.ticket-card {
  background: white;
  border: 1px solid #e2e6ea;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  cursor: grab;
  transition: box-shadow 0.15s, opacity 0.15s;
}
.ticket-card:active { cursor: grabbing; }
.ticket-card:hover  { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }

.ticket-card--dragging { opacity: 0.35; }

.ticket-card--ghost {
  opacity: 0.35;
  border-style: dashed;
  cursor: pointer;
}
.ticket-card--ghost:hover { box-shadow: none; }

.ticket-card__titulo {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.3;
  color: #212529;
}
.ticket-card__titulo:hover       { color: #0d6efd; text-decoration: underline; }
.ticket-card--ghost .ticket-card__titulo:hover { color: #6c757d; text-decoration: none; }

.ticket-card__agente { font-size: 0.8rem; }

/* Select del agente — parece texto pero es un dropdown */
.agent-select {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  max-width: 110px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agent-select:focus { outline: none; }
</style>

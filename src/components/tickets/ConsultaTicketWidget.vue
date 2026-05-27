<template>
  <div class="consulta-widget">
    <form @submit.prevent="consultar" class="consulta-form">
      <label class="consulta-label">Consultar estado de ticket</label>
      <div class="consulta-campo">
        <span class="consulta-label-campo">No. Ticket</span>
        <div class="input-group">
          <span class="input-group-text consulta-prefix">TKT-</span>
          <input
            :value="numero"
            type="text"
            inputmode="numeric"
            class="form-control consulta-input"
            placeholder="00000"
            autocomplete="off"
            @input="soloDigitos"
          />
        </div>
      </div>
      <div v-if="error" class="consulta-error">
        <i class="bi bi-exclamation-circle me-1"></i>{{ error }}
      </div>
      <button type="submit" class="btn btn-primary px-4" :disabled="cargando">
        <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
        {{ cargando ? 'Consultando...' : 'Consultar' }}
      </button>
    </form>
  </div>

  <!-- Modal de resultados -->
  <AppModal
    v-if="resultado"
    :titulo="`${resultado.ticket.numero_legible} — ${resultado.ticket.titulo}`"
    cancel-label="Cerrar"
    size="lg"
    scrollable
    @close="resultado = null"
  >
    <template #footer>
      <button class="btn btn-outline-secondary" @click="resultado = null">Cerrar</button>
    </template>

    <AppTable
      :columns="COLS"
      :rows="filas"
      empty-text="Sin actividad registrada."
      :counter="false"
      striped
    >
      <!-- Número -->
      <template #col-numero="{ value }">
        <span class="fw-semibold text-primary">{{ value }}</span>
      </template>

      <!-- Título truncado con tooltip nativo -->
      <template #col-titulo="{ value }">
        <div class="celda-truncada" :title="value">{{ value }}</div>
      </template>

      <!-- Estado como badge -->
      <template #col-estado="{ value }">
        <span :class="`badge bg-${coloreEstado(value)}`">{{ etiquetaEstado(value) }}</span>
      </template>

      <!-- Comentario truncado con tooltip nativo -->
      <template #col-comentario="{ value }">
        <div v-if="value" class="celda-truncada" :title="value">{{ value }}</div>
        <span v-else class="text-muted">—</span>
      </template>

      <!-- Fechas formateadas -->
      <template #col-fecha="{ value }">
        <span class="text-muted">{{ formatFecha(value) }}</span>
      </template>
      <template #col-fecha_cierre="{ value }">
        <span class="text-muted">{{ value ? formatFecha(value) : '—' }}</span>
      </template>
    </AppTable>
  </AppModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppTable from '@/components/ui/AppTable.vue'
import { consultarTicketPublico } from '@/api/consulta'

const numero    = ref('')
const cargando  = ref(false)
const error     = ref(null)
const resultado = ref(null)

function limpiarError() { error.value = null }

function soloDigitos(e) {
  const limpio = e.target.value.replace(/\D/g, '').slice(0, 5)
  numero.value = limpio
  e.target.value = limpio
  limpiarError()
}

async function consultar() {
  const digits = numero.value.trim()
  if (!digits) {
    error.value = 'Ingresa el número de ticket.'
    return
  }
  if (!/^\d{1,5}$/.test(digits)) {
    error.value = 'Solo ingresa los dígitos. Ejemplo: 00008'
    return
  }
  const val = `TKT-${digits.padStart(5, '0')}`
  error.value = null
  cargando.value = true
  try {
    const { data } = await consultarTicketPublico(val)
    resultado.value = data
  } catch (err) {
    error.value = err.response?.data?.mensaje || 'No se encontró el ticket.'
  } finally {
    cargando.value = false
  }
}

const COLS = [
  { key: 'numero',       label: 'No.',      width: '110px'                          },
  { key: 'titulo',       label: 'Título'                                            },
  { key: 'estado',       label: 'Estado',   width: '115px'                          },
  { key: 'comentario',   label: 'Comentario'                                        },
  { key: 'fecha',        label: 'Fecha',    width: '100px', cellClass: 'text-nowrap' },
  { key: 'fecha_cierre', label: 'Cerrado',  width: '100px', cellClass: 'text-nowrap' },
]

// Solo estos eventos producen un cambio visible en la tabla.
// Cualquier otro (prioridad, categoría, etc.) se ignora para evitar
// filas que parecen duplicadas porque ninguna columna cambia.
const PATRON_ESTADO = /Estado cambiado de "[^"]+" a "([^"]+)"/

function extraerNuevoEstado(contenido) {
  const match = contenido?.match(PATRON_ESTADO)
  return match ? match[1] : null
}

// Procesa el historial de más antiguo a más reciente acumulando el estado
// vigente en cada evento, luego invierte para mostrar más reciente primero.
const filas = computed(() => {
  if (!resultado.value) return []
  const { ticket, historial } = resultado.value

  const eventos = [...historial].reverse()
  let estadoActual = 'abierto'
  const rows = []

  for (const evento of eventos) {
    if (evento.accion === 'creacion') {
      // nada que actualizar, estadoActual ya es 'abierto'
    } else if (evento.accion === 'cambio_estado') {
      const nuevoEstado = extraerNuevoEstado(evento.contenido)
      if (!nuevoEstado) continue  // no es cambio de estado (prioridad, categoría…)
      estadoActual = nuevoEstado
    } else if (evento.accion === 'comentario') {
      // no modifica estadoActual, solo agrega la columna comentario
    } else {
      continue  // cualquier otro evento no visible en la tabla
    }

    rows.push({
      numero:       ticket.numero_legible,
      titulo:       ticket.titulo,
      estado:       estadoActual,
      comentario:   evento.accion === 'comentario' ? evento.contenido : null,
      fecha:        evento.fecha,
      fecha_cierre: estadoActual === 'cerrado' ? ticket.fecha_cierre : null,
    })
  }

  return rows.reverse()
})

const ESTADOS = {
  abierto:     { label: 'Abierto',     color: 'primary'   },
  en_progreso: { label: 'En progreso', color: 'warning'   },
  resuelto:    { label: 'Resuelto',    color: 'info'      },
  cerrado:     { label: 'Cerrado',     color: 'secondary' },
}

const etiquetaEstado = (e) => ESTADOS[e]?.label || e
const coloreEstado   = (e) => ESTADOS[e]?.color || 'secondary'

function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-GT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
</script>

<style scoped>
.consulta-widget {
  background: #f8f9fa;
  border: 1px dashed #ced4da;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-top: 0.75rem;
}

.consulta-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.consulta-label {
  font-size: 1rem;
  font-weight: 700;
  color: #212529;
}

.consulta-campo {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  max-width: 360px;
}

.consulta-label-campo {
  font-size: 0.88rem;
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
  flex-shrink: 0;
}

.consulta-prefix {
  background: #fff;
  color: #6c757d;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.consulta-input {
  height: 48px;
  font-size: 1rem;
  text-align: center;
  letter-spacing: 0.1em;
}

.consulta-error {
  font-size: 0.78rem;
  color: #dc3545;
  text-align: center;
}

.celda-truncada {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}
</style>

<template>
  <div class="position-relative" ref="containerRef">

    <!-- Botón campana -->
    <button
      class="btn btn-light btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center position-relative"
      style="width: 36px; height: 36px;"
      @click="toggleDropdown"
      :aria-label="`Notificaciones${noLeidas > 0 ? `, ${noLeidas} no leídas` : ''}`"
    >
      <i :class="noLeidas > 0 ? 'bi bi-bell-fill text-primary' : 'bi bi-bell'"></i>
      <span
        v-if="noLeidas > 0"
        class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
        style="font-size: 0.6rem; min-width: 16px; padding: 2px 4px; line-height: 1.2;"
      >
        {{ noLeidas > 99 ? '99+' : noLeidas }}
      </span>
    </button>

    <!-- Dropdown -->
    <div v-if="abierto" class="notif-dropdown bg-white border rounded shadow-sm">

      <!-- Cabecera -->
      <div class="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
        <span class="fw-semibold" style="font-size: 0.875rem;">Notificaciones</span>
        <button
          v-if="noLeidas > 0"
          class="btn btn-link btn-sm p-0 text-decoration-none"
          style="font-size: 0.75rem;"
          @click.stop="marcarTodas"
          :disabled="marcandoTodas"
        >
          Marcar todas como leídas
        </button>
      </div>

      <!-- Lista -->
      <div class="notif-lista">

        <div v-if="cargando" class="text-center py-4 text-muted" style="font-size: 0.85rem;">
          <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
        </div>

        <div v-else-if="lista.length === 0" class="text-center py-4 text-muted" style="font-size: 0.85rem;">
          <i class="bi bi-bell-slash d-block mb-1" style="font-size: 1.4rem;"></i>
          Sin notificaciones
        </div>

        <div
          v-else
          v-for="n in lista"
          :key="n.id"
          class="notif-item d-flex align-items-start gap-2 px-3 py-2"
          :class="{ 'notif-no-leida': !n.leida }"
          @click="abrirTicket(n)"
          role="button"
        >
          <i :class="[iconoTipo(n.tipo), 'notif-icono flex-shrink-0 mt-1']"></i>
          <div class="flex-grow-1 overflow-hidden">
            <div class="notif-titulo text-truncate">{{ n.titulo }}</div>
            <div class="notif-mensaje text-truncate">{{ n.mensaje }}</div>
            <div class="notif-tiempo">{{ tiempoRelativo(n.creado_en) }}</div>
          </div>
          <div v-if="!n.leida" class="notif-punto flex-shrink-0"></div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as notifApi from '@/api/notificaciones'

const router = useRouter()

const abierto      = ref(false)
const noLeidas     = ref(0)
const lista        = ref([])
const cargando     = ref(false)
const marcandoTodas = ref(false)
const containerRef = ref(null)

let pollingId = null

// ── Polling conteo no leídas ──────────────────────────────
const fetchConteo = async () => {
  try {
    const { data } = await notifApi.getNoLeidas()
    noLeidas.value = data.total
  } catch { /* silencioso */ }
}

// ── Cargar lista completa al abrir ────────────────────────
const fetchLista = async () => {
  cargando.value = true
  try {
    const { data } = await notifApi.getNotificaciones({ limit: 20 })
    lista.value = data.datos
  } catch { /* silencioso */ } finally {
    cargando.value = false
  }
}

// ── Toggle dropdown ───────────────────────────────────────
const toggleDropdown = () => {
  abierto.value = !abierto.value
  if (abierto.value) fetchLista()
}

// ── Cerrar al hacer click fuera ───────────────────────────
const clickFuera = (e) => {
  if (abierto.value && containerRef.value && !containerRef.value.contains(e.target)) {
    abierto.value = false
  }
}

// ── Navegar al ticket ─────────────────────────────────────
const abrirTicket = async (notif) => {
  abierto.value = false
  if (!notif.leida) {
    notif.leida = true
    noLeidas.value = Math.max(0, noLeidas.value - 1)
    notifApi.leerUna(notif.id).catch(() => {})
  }
  if (notif.id_ticket) {
    router.push({ name: 'tickets-detalle', params: { id: notif.id_ticket } })
  }
}

// ── Marcar todas como leídas ──────────────────────────────
const marcarTodas = async () => {
  marcandoTodas.value = true
  try {
    await notifApi.leerTodas()
    lista.value.forEach(n => { n.leida = true })
    noLeidas.value = 0
  } catch { /* silencioso */ } finally {
    marcandoTodas.value = false
  }
}

// ── Ícono según tipo ──────────────────────────────────────
const iconoTipo = (tipo) => {
  const mapa = {
    ticket_creado:     'bi bi-ticket-fill text-success',
    ticket_asignado:   'bi bi-person-check-fill text-primary',
    cambio_estado:     'bi bi-arrow-repeat text-info',
    nueva_nota:        'bi bi-chat-fill text-secondary',
    mencion:           'bi bi-at text-warning',
    ticket_completado: 'bi bi-check-circle-fill text-success',
    sin_asignar:       'bi bi-exclamation-circle-fill text-danger',
  }
  return mapa[tipo] ?? 'bi bi-bell-fill text-muted'
}

// ── Tiempo relativo ───────────────────────────────────────
const tiempoRelativo = (fecha) => {
  if (!fecha) return ''
  const diff = Date.now() - new Date(fecha).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h} h`
  return `Hace ${Math.floor(h / 24)} d`
}

// ── Ciclo de vida ─────────────────────────────────────────
onMounted(() => {
  fetchConteo()
  pollingId = setInterval(fetchConteo, 20000)
  document.addEventListener('click', clickFuera)
})

onUnmounted(() => {
  clearInterval(pollingId)
  document.removeEventListener('click', clickFuera)
})
</script>

<style scoped>
.notif-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  z-index: 1050;
  max-height: 480px;
  display: flex;
  flex-direction: column;
}

.notif-lista {
  overflow-y: auto;
  flex: 1;
}

.notif-item {
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f0f0f0;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background: #f8f9fa;
}

.notif-no-leida {
  background: #f0f7ff;
}

.notif-no-leida:hover {
  background: #e3f0fd;
}

.notif-titulo {
  font-size: 0.8rem;
  font-weight: 600;
  color: #212529;
}

.notif-mensaje {
  font-size: 0.775rem;
  color: #6c757d;
  margin-top: 1px;
}

.notif-tiempo {
  font-size: 0.7rem;
  color: #adb5bd;
  margin-top: 2px;
}

.notif-icono {
  font-size: 0.9rem;
}

.notif-punto {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0d6efd;
  margin-top: 5px;
  flex-shrink: 0;
}
</style>

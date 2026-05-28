<template>
  <div class="chatbot-container" ref="containerRef">

    <!-- Panel de chat -->
    <Transition name="chatbot-panel">
      <div v-if="abierto" class="chatbot-panel">

        <!-- Header -->
        <div class="chatbot-header">
          <div class="d-flex align-items-center gap-2">
            <div class="chatbot-avatar">
              <i class="bi bi-robot fs-5"></i>
            </div>
            <div>
              <div class="chatbot-title">Asistente de Soporte</div>
              <div class="chatbot-status">
                <span class="chatbot-dot"></span> En línea
              </div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button @click="reiniciarChat" class="chatbot-header-btn" aria-label="Nueva conversación" title="Nueva conversación">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
            <button @click="cerrarChat" class="btn-close btn-close-white" aria-label="Cerrar"></button>
          </div>
        </div>

        <!-- Mensajes -->
        <div class="chatbot-messages" ref="mensajesRef">
          <TransitionGroup name="chatbot-msg" tag="div" class="chatbot-msgs-inner">
            <div
              v-for="(msg, i) in mensajes"
              :key="i"
              :class="['chatbot-msg', `chatbot-msg--${msg.tipo}`]"
            >
              <div v-if="msg.tipo === 'bot'" class="chatbot-msg-avatar">
                <i class="bi bi-robot"></i>
              </div>
              <div class="chatbot-msg-bubble">{{ msg.texto }}</div>
            </div>
          </TransitionGroup>

          <!-- Indicador de escritura -->
          <div v-if="escribiendo" class="chatbot-msg chatbot-msg--bot">
            <div class="chatbot-msg-avatar"><i class="bi bi-robot"></i></div>
            <div class="chatbot-msg-bubble chatbot-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Opciones predefinidas -->
        <div v-if="opciones.length && !escribiendo && !esperandoTexto" class="chatbot-options">
          <button
            v-for="op in opciones"
            :key="op.id"
            class="chatbot-option-btn"
            @click="seleccionarOpcion(op)"
          >
            {{ op.label }}
          </button>
        </div>

        <!-- Input de texto libre (título, descripción, datos personales) -->
        <div v-if="esperandoTexto && !escribiendo" class="chatbot-input-area">
          <input
            ref="inputRef"
            v-model="textoInput"
            class="chatbot-text-input"
            :placeholder="placeholderInput"
            :inputmode="pasoActual === 'email' ? 'email' : 'text'"
            :maxlength="pasoActual === 'descripcion' ? 1000 : 150"
            autocomplete="off"
            @keydown.enter.prevent="enviarTexto"
          />
          <button
            class="chatbot-send-btn"
            :disabled="!textoInput.trim()"
            @click="enviarTexto"
          >
            <i class="bi bi-send-fill"></i>
          </button>
        </div>

      </div>
    </Transition>

    <!-- Burbuja flotante -->
    <button
      class="chatbot-bubble"
      :class="{ 'chatbot-bubble--active': abierto }"
      :aria-label="abierto ? 'Cerrar chat' : 'Abrir asistente de soporte'"
      @click="toggleChat"
    >
      <i :class="['bi', abierto ? 'bi-x-lg' : 'bi-chat-dots-fill']"></i>
      <span v-if="!abierto && notificacion" class="chatbot-badge"></span>
    </button>

  </div>

  <!-- Modal historial de ticket -->
  <AppModal
    v-if="mostrarModalConsulta && resultadoConsulta"
    :titulo="`${resultadoConsulta.ticket.numero_legible} — ${resultadoConsulta.ticket.titulo}`"
    cancel-label="Cerrar"
    size="lg"
    scrollable
    @close="mostrarModalConsulta = false"
  >
    <template #footer>
      <button class="btn btn-outline-secondary" @click="mostrarModalConsulta = false">Cerrar</button>
    </template>
    <AppTable
      :columns="COLS_CONSULTA"
      :rows="filasConsulta"
      empty-text="Sin actividad registrada."
      :counter="false"
      striped
    >
      <template #col-estado="{ value }">
        <span :class="`badge bg-${colorEstado(value)}`">{{ etiquetaEstado(value) }}</span>
      </template>
      <template #col-fecha="{ value }">
        {{ formatFechaCon(value) }}
      </template>
      <template #col-fecha_cierre="{ value }">
        {{ formatFechaCon(value) }}
      </template>
    </AppTable>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { crearTicketPublico, consultarTicketPublico } from '@/api/consulta'
import AppModal from '@/components/ui/AppModal.vue'
import AppTable from '@/components/ui/AppTable.vue'

const store = useStore()

const esCliente       = computed(() => store.getters['auth/rol'] === 'cliente')
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated'])
const router          = useRouter()

const abierto      = ref(false)
const notificacion = ref(true)
const escribiendo  = ref(false)
const mensajesRef  = ref(null)
const containerRef = ref(null)
const inputRef     = ref(null)
const mensajes     = ref([])
const opciones     = ref([])
const categorias   = ref([])
const selecciones  = ref({})
const pasoActual   = ref(null)
const textoInput   = ref('')

const esperandoTexto       = computed(() => pasoActual.value !== null)
const resultadoConsulta    = ref(null)
const mostrarModalConsulta = ref(false)

const COLS_CONSULTA = [
  { key: 'numero',       label: 'No.',        width: '110px' },
  { key: 'titulo',       label: 'Título'                     },
  { key: 'estado',       label: 'Estado',     width: '115px' },
  { key: 'comentario',   label: 'Comentario'                 },
  { key: 'fecha',        label: 'Fecha',      width: '100px', cellClass: 'text-nowrap' },
  { key: 'fecha_cierre', label: 'Cerrado',    width: '100px', cellClass: 'text-nowrap' },
]

const ESTADOS_CONSULTA = {
  abierto:     { label: 'Abierto',     color: 'primary'   },
  en_progreso: { label: 'En progreso', color: 'warning'   },
  resuelto:    { label: 'Resuelto',    color: 'info'      },
  cerrado:     { label: 'Cerrado',     color: 'secondary' },
}

const PATRON_ESTADO = /Estado cambiado de "[^"]+" a "([^"]+)"/

function extraerNuevoEstado(contenido) {
  const match = contenido?.match(PATRON_ESTADO)
  return match ? match[1] : null
}

const filasConsulta = computed(() => {
  if (!resultadoConsulta.value) return []
  const { ticket, historial } = resultadoConsulta.value
  const eventos = [...historial].reverse()
  let estadoActual = 'abierto'
  const rows = []
  for (const evento of eventos) {
    if (evento.accion === 'creacion') {
      // estado ya es 'abierto'
    } else if (evento.accion === 'cambio_estado') {
      const nuevo = extraerNuevoEstado(evento.contenido)
      if (!nuevo) continue
      estadoActual = nuevo
    } else if (evento.accion === 'comentario') {
      // no modifica estado
    } else {
      continue
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

const etiquetaEstado = e => ESTADOS_CONSULTA[e]?.label ?? e
const colorEstado    = e => ESTADOS_CONSULTA[e]?.color ?? 'secondary'
const formatFechaCon = f => f ? new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

const placeholderInput = computed(() => ({
  titulo:      'Escribe el título de tu ticket...',
  descripcion: 'Describe tu solicitud con detalle...',
  email:       'ejemplo@correo.com',
  nombre:      'Tu nombre',
  apellido:    'Tus apellidos',
}[pasoActual.value] ?? 'Escribe tu respuesta...'))

function onClickOutside(e) {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    cerrarChat()
  }
}

watch(abierto, (val) => {
  if (val) {
    document.addEventListener('mousedown', onClickOutside)
  } else {
    document.removeEventListener('mousedown', onClickOutside)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
})

watch(pasoActual, async (val) => {
  if (val) {
    await nextTick()
    inputRef.value?.focus()
  }
})

onMounted(async () => {
  try {
    const { data } = await api.get('/api/categorias', { params: { limit: 100, activo: true } })
    categorias.value = data.datos ?? []
  } catch {}
})

/* ── Emoji por categoría ── */
const EMOJI_CAT_MAP = {
  'soporte técnico': '🛠️',
  'facturacion':     '💰',
  'ventas':         '📈',
  'general':        '❓',
}

const emojiCategoria = (nombre) => {
  for (const key in EMOJI_CAT_MAP) {
    if (nombre.toLowerCase().includes(key.toLowerCase())) {
      return EMOJI_CAT_MAP[key]
    }
  }
  return '📂'
}

/* ── Flujo de conversación ── */
const FLUJO = {
  inicio: {
    mensaje: '¡Hola! 👋 Soy el asistente de soporte. ¿En qué puedo ayudarte hoy?',
    opciones: [
      { id: 'crear_ticket', label: '🎫 Crear un ticket'    },
      { id: 'ver_tickets',  label: '📋 Ver mis tickets'    },
      { id: 'consulta',     label: '💬 Tengo una consulta' },
    ],
  },
  ver_tickets: {
    mensaje: 'Te llevaré a la lista de tus tickets ahora mismo.',
    opciones: [
      { id: 'ir_tickets', label: '📋 Ir a mis tickets'  },
      { id: 'reiniciar',  label: '↩️ Volver al inicio' },
    ],
  },
  consulta: {
    mensaje: '¿Sobre qué tema es tu consulta?',
    opciones: [
      { id: 'consulta_cuenta',  label: '👤 Mi cuenta'     },
      { id: 'consulta_tickets', label: '🎫 Sobre tickets' },
      { id: 'consulta_otro',    label: '❓ Otro tema'    },
    ],
  },
  consulta_cuenta: {
    mensaje: 'Para dudas sobre tu cuenta visita tu perfil o contacta al administrador. ¿Necesitas algo más?',
    opciones: [{ id: 'reiniciar', label: '↩️ Volver al inicio' }],
  },
  consulta_tickets: {
    mensaje: '¿Qué deseas hacer con tus tickets?',
    opciones: [
      { id: 'crear_ticket', label: '🎫 Crear un ticket'  },
      { id: 'ver_tickets',  label: '📋 Ver mis tickets'  },
      { id: 'reiniciar',    label: '↩️ Volver al inicio' },
    ],
  },
  consulta_otro: {
    mensaje: 'Te recomiendo crear un ticket con tu consulta y el equipo de soporte te responderá a la brevedad.',
    opciones: [
      { id: 'crear_ticket', label: '🎫 Crear un ticket'  },
      { id: 'reiniciar',    label: '↩️ Volver al inicio' },
    ],
  },
}

/* ── Lógica de chat ── */
async function mostrarMensajeBot(texto) {
  escribiendo.value = true
  await delay(650)
  escribiendo.value = false
  mensajes.value.push({ tipo: 'bot', texto })
  await nextTick()
  scrollDown()
}

async function irAEtapa(etapaId) {
  if (etapaId === 'crear_ticket') {
    await mostrarMensajeBot('¡Claro! ¿A qué categoría pertenece tu solicitud?')
    if (categorias.value.length) {
      opciones.value = categorias.value.map(cat => ({
        id:      `cat_${cat.id}`,
        label:   `${emojiCategoria(cat.nombre)} ${cat.nombre}`,
        _cat_id: cat.id,
      }))
    } else {
      pasoActual.value = 'titulo'
      await mostrarMensajeBot('Escribe el título de tu ticket.')
    }
    return
  }

  if (etapaId === 'ver_tickets' && !isAuthenticated.value) {
    pasoActual.value = 'numero_ticket'
    await mostrarMensajeBot('Ingresa el número de tu ticket (solo los dígitos). Ejemplo: 00066')
    return
  }

  const etapa = FLUJO[etapaId]
  if (!etapa) return
  await mostrarMensajeBot(etapa.mensaje)
  opciones.value = etapa.opciones
}

async function seleccionarOpcion(op) {
  mensajes.value.push({ tipo: 'usuario', texto: op.label })
  opciones.value = []
  await nextTick()
  scrollDown()

  // Selección de categoría → pedir título directamente
  if (op.id.startsWith('cat_')) {
    selecciones.value.id_categoria = op._cat_id
    pasoActual.value = 'titulo'
    await mostrarMensajeBot('¡Perfecto! Ahora escribe el título de tu ticket.')
    return
  }

  if (op.id === 'reiniciar') {
    selecciones.value = {}
    pasoActual.value  = null
    textoInput.value  = ''
    await irAEtapa('inicio')
    return
  }

  if (op.id === 'ver_historial') {
    mostrarModalConsulta.value = true
    return
  }

  if (op.id === 'otra_consulta') {
    resultadoConsulta.value = null
    pasoActual.value = 'numero_ticket'
    await mostrarMensajeBot('Ingresa el número del ticket a consultar.')
    return
  }

  if (op.id === 'ir_tickets') {
    await mostrarMensajeBot('¡Vamos allá! 🚀')
    cerrarChat()
    resetChat()
    router.push('/tickets')
    return
  }

  await irAEtapa(op.id)
}

const VALIDACIONES = {
  titulo:         v => v.length >= 3  || 'El título debe tener al menos 3 caracteres.',
  descripcion:    v => v.length >= 10 || 'La descripción debe tener al menos 10 caracteres.',
  email:          v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Ingresa un correo electrónico válido.',
  nombre:         v => v.length >= 2  || 'Ingresa tu nombre.',
  apellido:       v => v.length >= 2  || 'Ingresa tus apellidos.',
  numero_ticket:  v => /^\d{1,5}$/.test(v.trim()) || 'Solo ingresa los dígitos del ticket. Ejemplo: 00066',
}

async function enviarTexto() {
  const texto = textoInput.value.trim()
  if (!texto) return

  const validacion = VALIDACIONES[pasoActual.value]?.(texto)
  if (validacion !== true) {
    await mostrarMensajeBot(validacion)
    return
  }

  mensajes.value.push({ tipo: 'usuario', texto })
  const paso = pasoActual.value
  pasoActual.value = null
  textoInput.value = ''
  selecciones.value[paso] = texto
  await nextTick()
  scrollDown()

  if (paso === 'titulo') {
    pasoActual.value = 'descripcion'
    await mostrarMensajeBot('Describe tu solicitud con el mayor detalle posible.')
  } else if (paso === 'descripcion') {
    if (isAuthenticated.value) {
      await crearTicketChat()
    } else {
      pasoActual.value = 'email'
      await mostrarMensajeBot('¿Cuál es tu correo electrónico? Recibirás actualizaciones ahí.')
    }
  } else if (paso === 'email') {
    pasoActual.value = 'nombre'
    await mostrarMensajeBot('¿Cuál es tu nombre?')
  } else if (paso === 'nombre') {
    pasoActual.value = 'apellido'
    await mostrarMensajeBot('¿Y tus apellidos?')
  } else if (paso === 'apellido') {
    await crearTicketChat()
  } else if (paso === 'numero_ticket') {
    const formatted = `TKT-${texto.trim().padStart(5, '0')}`
    await mostrarMensajeBot('Consultando... 🔍')
    try {
      const { data } = await consultarTicketPublico(formatted)
      resultadoConsulta.value = data
      const estadoLabel = etiquetaEstado(data.ticket.estado)
      await mostrarMensajeBot(`Ticket encontrado: "${data.ticket.titulo}" — Estado: ${estadoLabel}.`)
      opciones.value = [
        { id: 'ver_historial',  label: '📋 Ver historial completo' },
        { id: 'otra_consulta',  label: '🔍 Consultar otro ticket'  },
        { id: 'reiniciar',      label: '↩️ Volver al inicio'       },
      ]
    } catch (err) {
      const msg = err.response?.status === 404
        ? `No encontré ningún ticket con el número ${formatted}. Verifica e intenta de nuevo.`
        : 'Hubo un problema al consultar. Por favor intenta de nuevo.'
      await mostrarMensajeBot(msg)
      opciones.value = [
        { id: 'otra_consulta', label: '🔍 Intentar con otro número' },
        { id: 'reiniciar',     label: '↩️ Volver al inicio'         },
      ]
    }
  }
}

async function crearTicketChat() {
  await mostrarMensajeBot('Registrando tu ticket... ⏳')
  try {
    let numero_legible
    if (isAuthenticated.value) {
      const { data } = await api.post('/api/tickets', {
        titulo:       selecciones.value.titulo,
        descripcion:  selecciones.value.descripcion,
        id_categoria: selecciones.value.id_categoria,
        canal:        'chat',
      })
      numero_legible = data.numero_legible
    } else {
      const { data } = await crearTicketPublico({
        titulo:       selecciones.value.titulo,
        descripcion:  selecciones.value.descripcion,
        id_categoria: selecciones.value.id_categoria,
        email:        selecciones.value.email,
        nombre:       selecciones.value.nombre,
        apellido:     selecciones.value.apellido,
      })
      numero_legible = data.numero_legible
    }
    await mostrarMensajeBot(`¡Solicitud enviada! 🎉 Tu número de ticket es ${numero_legible}. Guárdalo para consultar el estado de tu solicitud en cualquier momento.`)
  } catch {
    await mostrarMensajeBot('No se pudo crear el ticket. Por favor intenta de nuevo.')
  }
  opciones.value = [{ id: 'reiniciar', label: '↩️ Nueva consulta' }]
}

async function toggleChat() {
  if (abierto.value) {
    cerrarChat()
  } else {
    abierto.value      = true
    notificacion.value = false
    if (mensajes.value.length === 0) {
      await irAEtapa('inicio')
    }
  }
}

function cerrarChat() {
  abierto.value = false
}

function resetChat() {
  mensajes.value    = []
  opciones.value    = []
  selecciones.value = {}
  pasoActual.value  = null
  textoInput.value  = ''
}

async function reiniciarChat() {
  resetChat()
  await irAEtapa('inicio')
}

function scrollDown() {
  if (mensajesRef.value) {
    mensajesRef.value.scrollTop = mensajesRef.value.scrollHeight
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}
</script>

<style scoped>
/* ── Contenedor fijo ── */
.chatbot-container {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1060;
}

/* ── Panel ── */
.chatbot-panel {
  position: absolute;
  bottom: calc(100% + 12px);
  right: 0;
  width: 320px;
  max-height: 460px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.chatbot-header {
  background: linear-gradient(135deg, #0d6efd 0%, #0856d6 100%);
  color: #fff;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.chatbot-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chatbot-title {
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.2;
}

.chatbot-status {
  font-size: 0.72rem;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
}

.chatbot-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  display: inline-block;
  flex-shrink: 0;
}

/* Botones del header */
.chatbot-header-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  cursor: pointer;
  transition: color 0.15s;
}

.chatbot-header-btn:hover {
  color: #fff;
}

/* Área de mensajes */
.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  background: #f4f6fb;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.chatbot-msgs-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chatbot-msg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.chatbot-msg--bot {
  align-self: flex-start;
}

.chatbot-msg--usuario {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chatbot-msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dbeafe;
  color: #0d6efd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.chatbot-msg-bubble {
  max-width: 222px;
  padding: 9px 12px;
  border-radius: 14px;
  font-size: 0.82rem;
  line-height: 1.5;
}

.chatbot-msg--bot .chatbot-msg-bubble {
  background: #fff;
  color: #212529;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.09);
}

.chatbot-msg--usuario .chatbot-msg-bubble {
  background: #0d6efd;
  color: #fff;
  border-bottom-right-radius: 4px;
}

/* Indicador de escritura */
.chatbot-typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 11px 14px;
}

.chatbot-typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #adb5bd;
  animation: chatbot-bounce 1.3s infinite ease-in-out;
}

.chatbot-typing span:nth-child(2) { animation-delay: 0.18s; }
.chatbot-typing span:nth-child(3) { animation-delay: 0.36s; }

@keyframes chatbot-bounce {
  0%, 80%, 100% { transform: translateY(0);   background: #adb5bd; }
  40%           { transform: translateY(-6px); background: #6c757d; }
}

/* Opciones */
.chatbot-options {
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #e9ecef;
}

.chatbot-option-btn {
  width: 100%;
  padding: 8px 14px;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 50rem;
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s, transform 0.12s;
  outline: none;
}

.chatbot-option-btn:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  transform: translateX(3px);
}

/* ── Burbuja flotante ── */
.chatbot-bubble {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #0d6efd;
  border: none;
  color: #fff;
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 18px rgba(13, 110, 253, 0.45);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s;
  outline: none;
}

.chatbot-bubble:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 26px rgba(13, 110, 253, 0.55);
}

.chatbot-bubble--active {
  background: #0a58ca;
  box-shadow: 0 4px 18px rgba(13, 110, 253, 0.35);
}

/* Puntito de notificación */
.chatbot-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dc3545;
  border: 2px solid #fff;
  animation: chatbot-pulse 2s infinite ease-in-out;
}

@keyframes chatbot-pulse {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%       { transform: scale(1.25); opacity: 0.8; }
}

/* ── Transiciones ── */
.chatbot-panel-enter-active,
.chatbot-panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.chatbot-panel-enter-from,
.chatbot-panel-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
  transform-origin: bottom right;
}

.chatbot-msg-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.chatbot-msg-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

/* ── Input de texto libre ── */
.chatbot-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

.chatbot-text-input {
  flex: 1;
  border: 1.5px solid #dee2e6;
  border-radius: 50rem;
  padding: 7px 14px;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.chatbot-text-input:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
}

.chatbot-send-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #0d6efd;
  border: none;
  color: #fff;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.12s;
}

.chatbot-send-btn:hover:not(:disabled) {
  background: #0a58ca;
  transform: scale(1.08);
}

.chatbot-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

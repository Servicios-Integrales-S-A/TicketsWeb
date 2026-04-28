<template>
  <AppModal
    titulo="Nueva regla de asignación"
    cancel-label="Cerrar"
    size="xl"
    @close="$emit('close')"
  >

    <!-- Diagrama de flujo: 3 pasos conectados -->
    <div class="regla-flow">

      <!-- Paso 1: Categoría -->
      <div
        class="flow-step"
        :class="{ 'flow-step--done': form.id_categoria, 'flow-step--error': errores.id_categoria }"
      >
        <div class="flow-step__header">
          <div class="flow-step__num">1</div>
          <span class="flow-step__title">Categoría</span>
        </div>
        <p class="flow-step__hint">¿De qué categoría es el ticket?</p>
        <SearchableSelect
          v-model="form.id_categoria"
          :options="opcionesCategoria"
          placeholder="Seleccionar categoría..."
          :invalid="!!errores.id_categoria"
        />
        <div v-if="errores.id_categoria" class="field-error">{{ errores.id_categoria }}</div>
      </div>

      <div class="flow-arrow"><i class="bi bi-arrow-right"></i></div>

      <!-- Paso 2: Prioridad -->
      <div
        class="flow-step"
        :class="{ 'flow-step--done': form.prioridad, 'flow-step--error': errores.prioridad }"
      >
        <div class="flow-step__header">
          <div class="flow-step__num">2</div>
          <span class="flow-step__title">Prioridad</span>
        </div>
        <p class="flow-step__hint">¿Con qué prioridad llega?</p>
        <div class="d-flex flex-column gap-2">
          <label
            v-for="opt in PRIOR_OPTIONS"
            :key="opt.value"
            class="prio-option"
            :class="{ 'prio-option--selected': form.prioridad === opt.value }"
            :style="form.prioridad === opt.value
              ? { borderColor: opt.color.bg, background: opt.color.bg + '22' }
              : {}"
          >
            <input type="radio" :value="opt.value" v-model="form.prioridad" class="d-none" />
            <span
              class="badge"
              :style="{ background: opt.color.bg, color: opt.color.text }"
            >{{ opt.label }}</span>
          </label>
        </div>
        <div v-if="errores.prioridad" class="field-error">{{ errores.prioridad }}</div>
      </div>

      <div class="flow-arrow"><i class="bi bi-arrow-right"></i></div>

      <!-- Paso 3: Agente -->
      <div
        class="flow-step"
        :class="{ 'flow-step--done': form.id_agente, 'flow-step--error': errores.id_agente }"
      >
        <div class="flow-step__header">
          <div class="flow-step__num">3</div>
          <span class="flow-step__title">Agente</span>
        </div>
        <p class="flow-step__hint">¿Quién atiende estos tickets?</p>
        <SearchableSelect
          v-model="form.id_agente"
          :options="opcionesAgente"
          placeholder="Buscar agente..."
          :invalid="!!errores.id_agente"
        />
        <div v-if="errores.id_agente" class="field-error">{{ errores.id_agente }}</div>
      </div>

    </div>

    <!-- Vista previa — aparece cuando los 3 campos están completos -->
    <Transition name="preview">
      <div v-if="previewCompleto" class="preview-card mt-4">
        <div class="preview-card__label">
          <i class="bi bi-check2-circle me-1"></i> Vista previa de la regla
        </div>
        <div class="preview-card__flow">
          <div class="preview-tag preview-tag--cat">
            <i class="bi bi-tag me-1"></i>{{ categoriaSeleccionada?.label }}
          </div>
          <i class="bi bi-arrow-right preview-arrow"></i>
          <div
            class="preview-tag"
            :style="{ background: prioridadSeleccionada?.color.bg, color: prioridadSeleccionada?.color.text }"
          >{{ prioridadSeleccionada?.label }}</div>
          <i class="bi bi-arrow-right preview-arrow"></i>
          <div class="preview-tag preview-tag--agent">
            <i class="bi bi-person me-1"></i>{{ agenteSeleccionado?.label }}
          </div>
        </div>
        <p class="preview-card__desc">
          Los tickets de <strong>{{ categoriaSeleccionada?.label }}</strong> con prioridad
          <strong>{{ prioridadSeleccionada?.label?.toLowerCase() }}</strong> serán asignados
          automáticamente a <strong>{{ agenteSeleccionado?.label }}</strong>.
        </p>
      </div>
    </Transition>

    <template #footer>
      <div v-if="errorServidor" class="text-danger me-auto" style="font-size: 0.85rem;">
        <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
      </div>
      <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">Cerrar</button>
      <button type="button" class="btn btn-primary" :disabled="guardando" @click="guardar">
        <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
        {{ guardando ? 'Creando...' : 'Crear regla' }}
      </button>
    </template>

  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api/axios'
import AppModal         from '@/components/ui/AppModal.vue'
import SearchableSelect from '@/components/ui/SearchableSelect.vue'

const emit = defineEmits(['close', 'guardado'])

const form         = reactive({ id_categoria: '', prioridad: '', id_agente: '' })
const errores      = ref({})
const errorServidor = ref(null)
const guardando    = ref(false)

const categorias = ref([])
const agentes    = ref([])

const opcionesCategoria = computed(() =>
  categorias.value.map(c => ({ value: c.id, label: c.nombre }))
)
const opcionesAgente = computed(() =>
  agentes.value.map(a => ({
    value:    a.id,
    label:    `${a.nombre} ${a.apellido}`,
    sublabel: a.email,
  }))
)

const categoriaSeleccionada = computed(() =>
  opcionesCategoria.value.find(c => c.value === form.id_categoria) ?? null
)
const prioridadSeleccionada = computed(() =>
  PRIOR_OPTIONS.find(p => p.value === form.prioridad) ?? null
)
const agenteSeleccionado = computed(() =>
  opcionesAgente.value.find(a => a.value === form.id_agente) ?? null
)
const previewCompleto = computed(() =>
  !!form.id_categoria && !!form.prioridad && !!form.id_agente
)

const validar = () => {
  const e = {}
  if (!form.id_categoria) e.id_categoria = 'Selecciona una categoría.'
  if (!form.prioridad)    e.prioridad    = 'Selecciona una prioridad.'
  if (!form.id_agente)    e.id_agente    = 'Selecciona un agente.'
  errores.value = e
  return Object.keys(e).length === 0
}

const guardar = async () => {
  errorServidor.value = null
  if (!validar()) return
  guardando.value = true
  try {
    await api.post('/api/reglas', {
      id_categoria: form.id_categoria,
      prioridad:    form.prioridad,
      id_agente:    form.id_agente,
    })
    emit('guardado')
    emit('close')
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'Error al crear la regla.'
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  const [resCat, resAg] = await Promise.all([
    api.get('/api/categorias', { params: { activo: true, limit: 100 } }),
    api.get('/api/usuarios',   { params: { rol: 'agente', activo: true, limit: 100 } }),
  ])
  categorias.value = resCat.data.datos
  agentes.value    = resAg.data.datos
})

const PRIOR_OPTIONS = [
  { value: 'bajo',    label: 'Bajo',    color: { bg: '#6c757d', text: '#fff' } },
  { value: 'medio',   label: 'Medio',   color: { bg: '#0dcaf0', text: '#212529' } },
  { value: 'alto',    label: 'Alto',    color: { bg: '#ffc107', text: '#212529' } },
  { value: 'critico', label: 'Crítico', color: { bg: '#dc3545', text: '#fff' } },
]
</script>

<style scoped>
/* ─── Contenedor del diagrama ─── */
.regla-flow {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

/* ─── Tarjeta de paso ─── */
.flow-step {
  flex: 1;
  min-width: 0;
  background: #f8f9fa;
  border: 2px solid #dee2e6;
  border-radius: 14px;
  padding: 1.1rem 1rem;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.flow-step--done  { border-color: #0d6efd; background: #f0f5ff; }
.flow-step--error { border-color: #dc3545; }

.flow-step__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.5rem;
}
.flow-step__num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #dee2e6;
  color: #6c757d;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.flow-step--done .flow-step__num {
  background: #0d6efd;
  color: #fff;
}
.flow-step__title {
  font-weight: 600;
  font-size: 0.88rem;
}
.flow-step__hint {
  font-size: 0.78rem;
  color: #6c757d;
  margin-bottom: 0.65rem;
}

/* ─── Flecha entre pasos ─── */
.flow-arrow {
  display: flex;
  align-items: center;
  padding: 0 0.45rem;
  margin-top: 3rem;
  color: #adb5bd;
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* ─── Opciones de prioridad (radio) ─── */
.prio-option {
  display: flex;
  align-items: center;
  padding: 0.35rem 0.6rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.prio-option:hover { border-color: #adb5bd; }
.prio-option--selected { font-weight: 600; }

/* ─── Error de campo ─── */
.field-error {
  color: #dc3545;
  font-size: 0.78rem;
  margin-top: 0.3rem;
}

/* ─── Tarjeta de vista previa ─── */
.preview-card {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}
.preview-card__label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #16a34a;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.preview-card__flow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.65rem;
}
.preview-arrow { color: #9ca3af; }

.preview-tag {
  padding: 0.3em 0.75em;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
}
.preview-tag--cat   { background: #e0e7ff; color: #3730a3; }
.preview-tag--agent { background: #dcfce7; color: #166534; }

.preview-card__desc {
  font-size: 0.85rem;
  color: #374151;
  margin: 0;
}

/* ─── Animación de entrada de la vista previa ─── */
.preview-enter-active,
.preview-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.preview-enter-from,
.preview-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

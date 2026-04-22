<template>
  <AppModal
    titulo="Nuevo ticket"
    submit-label="Crear ticket"
    cargando-label="Creando..."
    :cargando="cargando"
    @close="$emit('close')"
    @submit="submit"
  >
    <div class="mb-3">
      <label class="form-label">Título <span class="text-danger">*</span></label>
      <input
        type="text"
        class="form-control"
        :class="{ 'is-invalid': errores.titulo }"
        v-model="form.titulo"
        autofocus
      />
      <div class="invalid-feedback">{{ errores.titulo }}</div>
    </div>

    <div class="mb-3">
      <label class="form-label">Descripción <span class="text-danger">*</span></label>
      <textarea
        class="form-control"
        :class="{ 'is-invalid': errores.descripcion }"
        v-model="form.descripcion"
        rows="3"
      ></textarea>
      <div class="invalid-feedback">{{ errores.descripcion }}</div>
    </div>

    <div v-if="!esCliente" class="mb-3">
      <label class="form-label">Cliente</label>
      <select class="form-select" disabled>
        <option>Próximamente — búsqueda de clientes</option>
      </select>
    </div>

    <div class="row g-2">
      <div v-if="!esCliente" class="col-6">
        <label class="form-label d-block">Prioridad</label>
        <ColorBadgeSelect
          v-model="form.prioridad"
          :options="PRIOR_OPTIONS"
          block
        />
      </div>
      <div :class="esCliente ? 'col-12' : 'col-6'">
        <label class="form-label">Categoría <span class="text-danger">*</span></label>
        <select class="form-select" :class="{ 'is-invalid': errores.id_categoria }" v-model="form.id_categoria">
          <option value="">Seleccionar...</option>
          <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
            {{ cat.nombre }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errores.id_categoria }}</div>
      </div>
    </div>

    <div v-if="errorServidor" class="alert alert-danger py-2 mt-3 mb-0" style="font-size: 0.875rem;">
      <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
    </div>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import api from '@/api/axios'
import AppModal         from '@/components/ui/AppModal.vue'
import ColorBadgeSelect from '@/components/ui/ColorBadgeSelect.vue'

const PRIOR_OPTIONS = [
  { value: 'bajo',    label: 'Bajo',    color: { bg: '#6c757d', text: '#fff' } },
  { value: 'medio',   label: 'Medio',   color: { bg: '#0dcaf0', text: '#212529' } },
  { value: 'alto',    label: 'Alto',    color: { bg: '#ffc107', text: '#212529' } },
  { value: 'critico', label: 'Crítico', color: { bg: '#dc3545', text: '#fff' } },
]

const emit = defineEmits(['close', 'creado'])

const store     = useStore()
const esCliente = computed(() => store.getters['auth/rol'] === 'cliente')
const usuario   = computed(() => store.getters['auth/usuario'])

const categorias    = ref([])
const errores       = ref({})
const errorServidor = ref(null)
const cargando      = ref(false)

const form = reactive({
  titulo:       '',
  descripcion:  '',
  prioridad:    'medio',
  id_categoria: '',
})

onMounted(async () => {
  try {
    const { data } = await api.get('/api/categorias', { params: { limit: 100, activo: true } })
    categorias.value = data.datos ?? []
  } catch {
    categorias.value = []
  }
})

const validar = () => {
  const e = {}
  if (!form.titulo.trim())      e.titulo       = 'El título es requerido.'
  if (!form.descripcion.trim()) e.descripcion  = 'La descripción es requerida.'
  if (!form.id_categoria)       e.id_categoria = 'Selecciona una categoría.'
  errores.value = e
  return Object.keys(e).length === 0
}

const submit = async () => {
  errorServidor.value = null
  if (!validar()) return
  cargando.value = true
  try {
    await api.post('/api/tickets', {
      titulo:       form.titulo.trim(),
      descripcion:  form.descripcion.trim(),
      prioridad:    form.prioridad,
      canal:        'web',
      id_categoria: form.id_categoria,
      ...(!esCliente.value && { id_cliente: usuario.value?.id }),
    })
    emit('creado')
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'Error al crear el ticket.'
  } finally {
    cargando.value = false
  }
}
</script>

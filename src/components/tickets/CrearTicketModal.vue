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

    <!-- Cliente (solo agente/admin) -->
    <div v-if="!esCliente" class="mb-3">
      <label class="form-label">Cliente <span class="text-danger">*</span></label>
      <SearchableSelect
        v-model="form.id_cliente"
        :options="clienteOptions"
        placeholder="Seleccione o busque un cliente..."
        add-label="Agregar nuevo cliente"
        :invalid="!!errores.id_cliente"
        @agregar="mostrarCrearCliente = true"
      />
      <div v-if="errores.id_cliente" class="text-danger mt-1" style="font-size: 0.875em;">
        {{ errores.id_cliente }}
      </div>
    </div>

    <!-- Modal: crear cliente rápido -->
    <CrearUsuarioModal
      v-if="mostrarCrearCliente"
      rol-fijo="cliente"
      @close="mostrarCrearCliente = false"
      @creado="onClienteCreado"
    />

    <div class="row g-2 mb-3">
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

    <!-- Agente (solo agente/admin) -->
    <div v-if="!esCliente" class="mb-3">
      <label class="form-label">Agente asignado</label>
      <SearchableSelect
        v-model="form.id_agente"
        :options="agenteOptions"
        placeholder="Auto-asignar por menor carga"
        add-label="Auto-asignar por menor carga"
        add-action="reset"
      />
    </div>

    <div v-if="errorServidor" class="alert alert-danger py-2 mb-0" style="font-size: 0.875rem;">
      <i class="bi bi-exclamation-circle me-1"></i>{{ errorServidor }}
    </div>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import api from '@/api/axios'
import AppModal          from '@/components/ui/AppModal.vue'
import ColorBadgeSelect  from '@/components/ui/ColorBadgeSelect.vue'
import SearchableSelect  from '@/components/ui/SearchableSelect.vue'
import CrearUsuarioModal from '@/components/usuarios/CrearUsuarioModal.vue'

const PRIOR_OPTIONS = [
  { value: 'bajo',    label: 'Bajo',    color: { bg: '#6c757d', text: '#fff' } },
  { value: 'medio',   label: 'Medio',   color: { bg: '#0dcaf0', text: '#212529' } },
  { value: 'alto',    label: 'Alto',    color: { bg: '#ffc107', text: '#212529' } },
  { value: 'critico', label: 'Crítico', color: { bg: '#dc3545', text: '#fff' } },
]

const emit = defineEmits(['close', 'creado'])

const store     = useStore()
const esCliente = computed(() => store.getters['auth/rol'] === 'cliente')

const categorias         = ref([])
const agentes            = ref([])
const clientes           = ref([])
const mostrarCrearCliente = ref(false)

const clienteOptions = computed(() =>
  clientes.value.map(c => ({
    value:    c.id,
    label:    `${c.nombre} ${c.apellido}`,
    sublabel: c.email,
  }))
)

const agenteOptions = computed(() =>
  agentes.value.map(a => ({
    value:    a.id,
    label:    `${a.nombre} ${a.apellido}`,
    sublabel: a.email,
  }))
)
const onClienteCreado = (usuario) => {
  clientes.value.push(usuario)
  form.id_cliente       = usuario.id
  mostrarCrearCliente.value = false
}

const errores       = ref({})
const errorServidor = ref(null)
const cargando      = ref(false)

const form = reactive({
  titulo:       '',
  descripcion:  '',
  prioridad:    'medio',
  id_categoria: '',
  id_cliente:   '',
  id_agente:    '',
})

onMounted(async () => {
  const requests = [
    api.get('/api/categorias', { params: { limit: 100, activo: true } }),
  ]
  if (!esCliente.value) {
    requests.push(api.get('/api/usuarios/agentes'))
    requests.push(api.get('/api/usuarios/clientes'))
  }

  const [resCat, resAg, resCli] = await Promise.allSettled(requests)
  if (resCat.status === 'fulfilled') categorias.value = resCat.value.data.datos ?? []
  if (resAg?.status  === 'fulfilled') agentes.value   = resAg.value.data  ?? []
  if (resCli?.status === 'fulfilled') clientes.value  = resCli.value.data ?? []
})

const validar = () => {
  const e = {}
  if (!form.titulo.trim())                e.titulo       = 'El título es requerido.'
  if (!form.descripcion.trim())           e.descripcion  = 'La descripción es requerida.'
  if (!form.id_categoria)                 e.id_categoria = 'Selecciona una categoría.'
  if (!esCliente.value && !form.id_cliente) e.id_cliente = 'Selecciona un cliente.'
  errores.value = e
  return Object.keys(e).length === 0
}

const submit = async () => {
  errorServidor.value = null
  if (!validar()) return
  cargando.value = true
  try {
    const payload = {
      titulo:       form.titulo.trim(),
      descripcion:  form.descripcion.trim(),
      prioridad:    form.prioridad,
      canal:        'web',
      id_categoria: form.id_categoria,
    }
    if (!esCliente.value) {
      payload.id_cliente = form.id_cliente
      if (form.id_agente) payload.id_agente = form.id_agente
    }
    await api.post('/api/tickets', payload)
    emit('creado')
  } catch (err) {
    errorServidor.value = err.response?.data?.mensaje || 'Error al crear el ticket.'
  } finally {
    cargando.value = false
  }
}
</script>

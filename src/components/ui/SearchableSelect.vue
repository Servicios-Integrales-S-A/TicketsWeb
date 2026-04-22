<template>
  <div class="ss-wrapper" ref="wrapperRef" :class="{ 'ss-invalid': invalid }">

    <!-- Input trigger -->
    <div class="ss-input-box" @click="abrir">
      <i class="bi bi-search ss-icon"></i>
      <input
        ref="inputRef"
        type="text"
        class="ss-input"
        :placeholder="placeholder"
        v-model="query"
        @focus="isOpen = true"
        @input="isOpen = true"
        autocomplete="off"
      />
      <i
        v-if="modelValue"
        class="bi bi-x ss-clear"
        @click.stop="limpiar"
        title="Limpiar"
      ></i>
      <i class="bi bi-chevron-down ss-chevron" :class="{ 'ss-chevron--open': isOpen }"></i>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen" class="ss-dropdown">

      <!-- Botón superior configurable -->
      <button
        v-if="addLabel"
        type="button"
        class="ss-add-btn"
        @click="onAddClick"
      >
        <i :class="['bi', addAction === 'reset' ? 'bi-arrow-counterclockwise' : 'bi-plus-lg', 'me-1']"></i>{{ addLabel }}
      </button>
      <div v-if="addLabel" class="ss-divider"></div>

      <!-- Lista scrollable -->
      <div class="ss-list">
        <div v-if="filtradas.length === 0" class="ss-empty">
          Sin resultados para "{{ query }}"
        </div>
        <button
          v-for="opt in filtradas"
          :key="opt.value"
          type="button"
          class="ss-option"
          :class="{ 'ss-option--active': opt.value === modelValue }"
          @click="seleccionar(opt)"
        >
          <div class="ss-option-label">{{ opt.label }}</div>
          <div v-if="opt.sublabel" class="ss-option-sublabel">{{ opt.sublabel }}</div>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue:  { type: String,  default: '' },
  options:     { type: Array,   default: () => [] }, // [{ value, label, sublabel? }]
  placeholder: { type: String,  default: 'Seleccionar o buscar...' },
  addLabel:    { type: String,  default: '' },
  addAction:   { type: String,  default: 'emit' }, // 'emit' | 'reset'
  invalid:     { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'agregar'])

const isOpen     = ref(false)
const query      = ref('')
const wrapperRef = ref(null)
const inputRef   = ref(null)

// Sync display text when modelValue changes from outside
watch(() => props.modelValue, (val) => {
  if (!isOpen.value) {
    const opt = props.options.find(o => o.value === val)
    query.value = opt?.label ?? ''
  }
}, { immediate: true })

// Also sync when options load after modelValue is already set
watch(() => props.options, () => {
  if (props.modelValue) {
    const opt = props.options.find(o => o.value === props.modelValue)
    if (opt) query.value = opt.label
  }
})

const filtradas = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o =>
    o.label.toLowerCase().includes(q) ||
    (o.sublabel ?? '').toLowerCase().includes(q)
  )
})

const onAddClick = () => {
  if (props.addAction === 'reset') {
    limpiar()
  } else {
    emit('agregar')
    isOpen.value = false
  }
}

const abrir = () => {
  isOpen.value = true
  nextTick(() => {
    inputRef.value?.select()
  })
}

const seleccionar = (opt) => {
  emit('update:modelValue', opt.value)
  query.value  = opt.label
  isOpen.value = false
}

const limpiar = () => {
  emit('update:modelValue', '')
  query.value  = ''
  isOpen.value = false
}

const cerrarDropdown = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isOpen.value = false
    // Restore selected label if user typed but didn't pick
    const opt = props.options.find(o => o.value === props.modelValue)
    query.value = opt?.label ?? ''
  }
}

onMounted(()   => document.addEventListener('mousedown', cerrarDropdown))
onUnmounted(() => document.removeEventListener('mousedown', cerrarDropdown))
</script>

<style scoped>
.ss-wrapper {
  position: relative;
}

/* ── Input box ── */
.ss-input-box {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  background: #fff;
  padding: 0.375rem 0.55rem;
  cursor: text;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ss-wrapper.ss-invalid .ss-input-box {
  border-color: #dc3545;
}
.ss-input-box:focus-within {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.ss-icon {
  color: #6c757d;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.ss-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  color: #212529;
  min-width: 0;
}
.ss-input::placeholder { color: #adb5bd; }

.ss-clear {
  color: #adb5bd;
  font-size: 1rem;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
}
.ss-clear:hover { color: #6c757d; }

.ss-chevron {
  font-size: 0.65rem;
  color: #6c757d;
  flex-shrink: 0;
  transition: transform 0.15s;
}
.ss-chevron--open { transform: rotate(180deg); }

/* ── Dropdown ── */
.ss-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1050;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* ── Add button ── */
.ss-add-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  color: #0d6efd;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.ss-add-btn:hover { background: #f0f5ff; }

.ss-divider {
  height: 1px;
  background: #dee2e6;
  margin: 0;
}

/* ── Scrollable list ── */
.ss-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 4px;
}

.ss-empty {
  padding: 0.6rem 0.75rem;
  font-size: 0.82rem;
  color: #6c757d;
  text-align: center;
}

/* ── Options ── */
.ss-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 0.45rem 0.65rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.ss-option:hover       { background: #f8f9fa; }
.ss-option--active     { background: #e8f0fe; }
.ss-option--active:hover { background: #dce7fd; }

.ss-option-label {
  font-size: 0.875rem;
  color: #212529;
  line-height: 1.3;
}
.ss-option-sublabel {
  font-size: 0.75rem;
  color: #6c757d;
  line-height: 1.2;
  margin-top: 1px;
}
</style>

<template>
  <div class="cbs-wrapper" :class="{ 'cbs-wrapper--block': block }" ref="wrapperRef" @click.stop>
    <button
      type="button"
      class="cbs-badge"
      :class="{ 'cbs-badge--block': block }"
      :style="{ background: current.color.bg, color: current.color.text }"
      @click="toggleOpen"
    >
      {{ current.label }}
      <i class="bi bi-chevron-down cbs-chevron" :class="{ 'cbs-chevron--open': isOpen }"></i>
    </button>

    <teleport to="body">
      <div
          v-if="isOpen"
          class="cbs-dropdown"
          :class="{ 'cbs-dropdown--up': openUpwards, 'cbs-dropdown--block': block }"
          :style="dropdownStyle"
          @click.stop
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="cbs-option"
          :style="{ background: opt.color.bg, color: opt.color.text }"
          @click="onSelect(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String,  required: true },
  options:    { type: Array,   required: true }, // [{ value, label, color: { bg, text } }]
  block:      { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const uid        = Math.random().toString(36).slice(2)
const isOpen     = ref(false)
const wrapperRef = ref(null)
const openUpwards = ref(false)
const dropdownStyle = ref({})

const current = computed(() =>
  props.options.find(o => o.value === props.modelValue) ?? props.options[0]
)

const toggleOpen = () => {
  if (isOpen.value) {
    isOpen.value = false
  } else {
    isOpen.value = true
    window.dispatchEvent(new CustomEvent('cbs:open', { detail: uid }))
  }
}

const onOtherOpen = (e) => {
  if (isOpen.value && e.detail !== uid) isOpen.value = false
}

const onSelect = (value) => {
  emit('update:modelValue', value)
  isOpen.value = false
}

const onClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

const positionDropdown = () => {
  const wrapper = wrapperRef.value
  if (!wrapper) return

  const rect = wrapper.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const estimatedHeight = 264 // max: add-btn + divider + 220px list

  openUpwards.value = spaceBelow < estimatedHeight

  dropdownStyle.value = {
    position: 'fixed',
    left: rect.left + 'px',
    width: rect.width + 'px',
    zIndex: 9999,
    ...(openUpwards.value
      ? { bottom: (window.innerHeight - rect.top + 4) + 'px', top: 'auto' }
      : { top: (rect.bottom + 4) + 'px', bottom: 'auto' })
  }
}

watch(isOpen, (val) => {
  if (val) nextTick(positionDropdown)
})

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('cbs:open', onOtherOpen)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('cbs:open', onOtherOpen)
})
</script>

<style scoped>
.cbs-wrapper {
  position: relative;
  display: inline-block;
}
.cbs-wrapper--block {
  display: block;
}

.cbs-badge {
  border: none;
  border-radius: 0.375rem;
  padding: 0.3em 0.55em;
  font-size: 0.75em;
  font-weight: 600;
  cursor: pointer;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.15s;
}
.cbs-badge--block {
  width: 100%;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  line-height: 1.5;
  border-radius: 10px;
  justify-content: space-between;
}
.cbs-dropdown--block .cbs-option {
  font-size: 0.9rem;
  padding: 0.4em 0.75em;
}
.cbs-badge:hover  { opacity: 0.88; }
.cbs-badge:focus  { outline: none; }

.cbs-chevron {
  font-size: 0.65em;
  transition: transform 0.15s;
}
.cbs-chevron--open { transform: rotate(180deg); }

.cbs-dropdown {
  min-width: 110px;
  padding: 4px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.13);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cbs-option {
  border: none;
  border-radius: 6px;
  padding: 0.32em 0.6em;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: opacity 0.1s;
}
.cbs-option:hover  { opacity: 0.82; }
.cbs-option:focus  { outline: none; }
</style>

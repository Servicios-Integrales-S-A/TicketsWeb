<template>
  <div class="cbs-wrapper" :class="{ 'cbs-wrapper--block': block }" ref="wrapperRef" @click.stop>
    <button
      type="button"
      class="cbs-badge"
      :class="{ 'cbs-badge--block': block }"
      :style="{ background: current.color.bg, color: current.color.text }"
      @click="isOpen = !isOpen"
    >
      {{ current.label }}
      <i class="bi bi-chevron-down cbs-chevron" :class="{ 'cbs-chevron--open': isOpen }"></i>
    </button>

    <div v-if="isOpen" class="cbs-dropdown">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: String,  required: true },
  options:    { type: Array,   required: true }, // [{ value, label, color: { bg, text } }]
  block:      { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const isOpen     = ref(false)
const wrapperRef = ref(null)

const current = computed(() =>
  props.options.find(o => o.value === props.modelValue) ?? props.options[0]
)

const onSelect = (value) => {
  emit('update:modelValue', value)
  isOpen.value = false
}

const onClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(()   => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
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
.cbs-wrapper--block .cbs-dropdown {
  width: 100%;
}
.cbs-wrapper--block .cbs-option {
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
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 1050;
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

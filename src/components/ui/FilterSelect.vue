<template>
  <div class="fs-root" :style="{ width }">
    <!-- Native select invisible overlay — preserves all browser behavior -->
    <select
      class="fs-hidden"
      v-model="val"
      @change="onChange"
      @focus="focused = true"
      @blur="focused = false"
    >
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>

    <!-- Visual display with marquee -->
    <div class="fs-display" :class="{ 'fs-display--focused': focused }" aria-hidden="true">
      <div class="fs-track" ref="trackRef">
        <span class="fs-label" ref="labelRef">{{ currentLabel }}</span>
      </div>
      <i class="bi bi-chevron-down fs-arrow"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options:    { type: Array,  default: () => [] }, // [{ value, label }]
  width:      { type: String, default: '160px' },
})
const emit = defineEmits(['update:modelValue', 'change'])

const val     = ref(props.modelValue)
const focused = ref(false)

watch(() => props.modelValue, v => { val.value = v })

const currentLabel = computed(() =>
  props.options.find(o => o.value === val.value)?.label ?? ''
)

const onChange = () => {
  emit('update:modelValue', val.value)
  emit('change', val.value)
}

// ── Marquee ───────────────────────────────────────────────────────────────────
const labelRef = ref(null)
const trackRef = ref(null)

const actualizarMarquee = () => {
  const label = labelRef.value
  const track = trackRef.value
  if (!label || !track) return
  const overflow = label.scrollWidth - track.clientWidth
  if (overflow > 0) {
    label.classList.add('fs-label--scroll')
    label.style.setProperty('--fs-offset', `-${overflow}px`)
  } else {
    label.classList.remove('fs-label--scroll')
  }
}

watch(currentLabel, () => nextTick(actualizarMarquee))
onMounted(() => nextTick(actualizarMarquee))
</script>

<style scoped>
.fs-root {
  position: relative;
  display: inline-block;
}

.fs-hidden {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.fs-display {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  background: #fff;
  padding: 0.375rem 0.75rem;
  min-height: 38px;
  font-size: 0.875rem;
  color: #212529;
  pointer-events: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.fs-display--focused {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.fs-track {
  flex: 1;
  overflow: hidden;
}

.fs-label {
  display: inline-block;
  white-space: nowrap;
}

@keyframes fs-marquee {
  0%,  20% { transform: translateX(0); }
  80%, 100% { transform: translateX(var(--fs-offset, 0px)); }
}

.fs-label--scroll {
  animation: fs-marquee 3s ease-in-out infinite alternate;
}

.fs-arrow {
  font-size: 0.65rem;
  color: #6c757d;
  flex-shrink: 0;
}
</style>

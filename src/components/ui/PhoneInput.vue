<template>
  <input
    ref="inputRef"
    type="tel"
    class="form-control"
    :class="{ 'is-invalid': invalid }"
    placeholder="+502 0000 0000"
    maxlength="15"
    autocomplete="tel"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  invalid:    { type: Boolean, default: false },
})

const emit    = defineEmits(['update:modelValue'])
const inputRef = ref(null)

// ── Formateo ──────────────────────────────────────────────────────────────

const extractDigits = (raw) => {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('502')) d = d.slice(3)
  return d.slice(0, 8)
}

const formatPhone = (digits) => {
  if (!digits) return ''
  let result = '+502'
  if (digits.length > 0) result += ' ' + digits.slice(0, 4)
  if (digits.length > 4) result += ' ' + digits.slice(4)
  return result
}

const formatFromRaw = (raw) => (raw ? formatPhone(extractDigits(raw)) : '')

// ── Sincronización con modelValue ─────────────────────────────────────────

const setInputValue = (val) => {
  if (inputRef.value) inputRef.value.value = val
}

onMounted(() => setInputValue(formatFromRaw(props.modelValue)))

watch(() => props.modelValue, (val) => {
  // Only update DOM if this field is not focused (user is not typing)
  if (document.activeElement !== inputRef.value) {
    setInputValue(formatFromRaw(val))
  }
})

// ── Eventos ───────────────────────────────────────────────────────────────

const onInput = (e) => {
  const digits    = extractDigits(e.target.value)
  const formatted = formatPhone(digits)
  e.target.value  = formatted
  e.target.setSelectionRange(formatted.length, formatted.length)
  emit('update:modelValue', formatted)
}

const onFocus = (e) => {
  // Pre-fill prefix so user sees where to start typing
  if (!e.target.value) {
    e.target.value = '+502 '
    e.target.setSelectionRange(6, 6)
  }
}

const onBlur = (e) => {
  // Clear the prefix if the user focused but typed nothing
  if (e.target.value === '+502 ' || e.target.value === '+502') {
    e.target.value = ''
    emit('update:modelValue', '')
  }
}
</script>

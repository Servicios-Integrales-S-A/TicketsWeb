<template>
  <div class="form-floating mb-3">
    <input
      :id="id"
      :type="inputType"
      class="form-control auth-input"
      :class="{ 'is-invalid': error }"
      placeholder=" "
      :value="modelValue"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <label :for="id">{{ label }}</label>

    <button
      v-if="type === 'password'"
      type="button"
      class="btn btn-link password-toggle text-muted"
      tabindex="-1"
      @click="mostrar = !mostrar"
    >
      <i :class="mostrar ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
    </button>

    <div class="invalid-feedback">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  id:           { type: String,  required: true },
  label:        { type: String,  required: true },
  type:         { type: String,  default: 'text' },
  modelValue:   { type: String,  default: '' },
  error:        { type: String,  default: '' },
  autocomplete: { type: String,  default: 'off' },
  autofocus:    { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const mostrar   = ref(false)
const inputType = computed(() =>
  props.type === 'password' ? (mostrar.value ? 'text' : 'password') : props.type
)
</script>

<style scoped>
.auth-input {
  padding-right: 2.8rem;
}
.auth-input.is-invalid {
  background-image: none;
}
.password-toggle {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  padding: 0.25rem 0.4rem;
  text-decoration: none;
}
</style>

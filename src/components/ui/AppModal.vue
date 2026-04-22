<template>
  <div class="modal d-block modal-backdrop-custom" @click.self="$emit('close')">
    <div class="modal-dialog modal-dialog-centered" :class="[sizeClass, { 'modal-dialog-scrollable': scrollable }]">
      <div class="modal-content border-0 shadow">

        <div class="modal-header border-0 pb-0">
          <h6 class="modal-title fw-semibold">{{ titulo }}</h6>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>

        <div class="modal-body pt-3" :class="bodyClass">
          <slot />
        </div>

        <div class="modal-footer border-0 pt-0">
          <slot name="footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="cargando"
              @click="$emit('close')"
            >
              {{ cancelLabel }}
            </button>
            <button
              v-if="submitLabel"
              type="button"
              :class="['btn', submitVariant]"
              :disabled="cargando"
              @click="$emit('submit')"
            >
              <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
              {{ cargando ? cargandoLabel : submitLabel }}
            </button>
          </slot>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  titulo:        { type: String,  required: true },
  submitLabel:   { type: String,  default: '' },
  cancelLabel:   { type: String,  default: 'Cancelar' },
  cargandoLabel: { type: String,  default: 'Guardando...' },
  submitVariant: { type: String,  default: 'btn-primary' },
  cargando:      { type: Boolean, default: false },
  size:          { type: String,  default: '' },
  scrollable:    { type: Boolean, default: false },
  bodyClass:     { type: String,  default: '' },
})

defineEmits(['close', 'submit'])

const sizeClass = computed(() => props.size ? `modal-${props.size}` : '')
</script>

<style scoped>
.modal-backdrop-custom {
  background: rgba(0, 0, 0, 0.5);
}
</style>

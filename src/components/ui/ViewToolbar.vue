<template>
  <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap flex-shrink-0">

    <div class="d-flex gap-2 flex-wrap align-items-center">
      <div class="input-group" :style="{ width: searchWidth }">
        <span class="input-group-text bg-white border-end-0">
          <i class="bi bi-search text-muted" style="font-size: 0.85rem;"></i>
        </span>
        <input
          type="text"
          class="form-control border-start-0 ps-0"
          :placeholder="searchPlaceholder"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      </div>
      <slot name="filters" />
    </div>

    <div class="d-flex align-items-center gap-2">
      <slot name="actions" />
    </div>

  </div>
</template>

<script setup>
defineProps({
  modelValue:        { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Buscar...' },
  searchWidth:       { type: String, default: '220px' },
})

defineEmits(['update:modelValue'])
</script>

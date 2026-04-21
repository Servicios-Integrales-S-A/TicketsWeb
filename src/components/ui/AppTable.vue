<template>
  <div class="card border-0 shadow-sm">
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">

        <thead class="table-light">
          <tr>
            <th class="text-muted" style="width: 42px;">#</th>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="col.width ? { width: col.width } : {}"
              :class="col.headerClass"
            >{{ col.label }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length + 1" class="text-center py-5 text-muted">
              <span class="spinner-border spinner-border-sm me-2"></span>Cargando...
            </td>
          </tr>

          <tr v-else-if="!rows.length">
            <td :colspan="columns.length + 1" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-2 d-block mb-2"></i>
              {{ emptyText }}
            </td>
          </tr>

          <tr
            v-else
            v-for="(row, index) in rows"
            :key="row[rowKey] ?? index"
            :class="{ 'app-table-row--clickable': clickable }"
            @click="clickable ? $emit('row-click', row) : null"
          >
            <td class="text-muted" style="font-size: 0.85rem;">{{ index + 1 }}</td>
            <td
              v-for="col in columns"
              :key="col.key"
              :class="col.cellClass"
            >
              <slot :name="`col-${col.key}`" :value="row[col.key]" :row="row" :index="index">
                {{ row[col.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </tbody>

      </table>
    </div>

    <slot name="footer" />
  </div>
</template>

<script setup>
defineProps({
  columns:   { type: Array,   required: true },
  rows:      { type: Array,   default: () => [] },
  loading:   { type: Boolean, default: false },
  emptyText: { type: String,  default: 'No hay registros para mostrar.' },
  rowKey:    { type: String,  default: 'id' },
  clickable: { type: Boolean, default: false },
})

defineEmits(['row-click'])
</script>

<style scoped>
.app-table-row--clickable {
  cursor: pointer;
}
</style>

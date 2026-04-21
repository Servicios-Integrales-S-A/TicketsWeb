<template>
  <div class="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center">
    <i class="bi bi-exclamation-circle text-muted" style="font-size: 3rem;"></i>
    <h4 class="mt-3 fw-semibold">Página no encontrada</h4>
    <p class="text-muted">La ruta que buscas no existe.</p>
    <router-link :to="{ name: 'tickets' }" class="btn btn-primary btn-sm">Volver al inicio</router-link>
  </div>
</template>

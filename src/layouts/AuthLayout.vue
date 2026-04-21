<template>
  <div class="auth-wrapper d-flex align-items-center justify-content-center min-vh-100 bg-light">
    <div class="auth-card card w-100 rounded-4" style="max-width: 440px; box-shadow: 0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08);">
      <div class="card-body p-4 p-md-5">

        <div class="text-center mb-4">
          <i class="bi bi-ticket-perforated-fill text-primary fs-1"></i>
          <h5 class="mt-2 mb-0 fw-semibold">Servicios Integrales S.A.</h5>
          <small class="text-muted">Sistema de Tickets</small>
        </div>

        <router-view />

      </div>
    </div>
  </div>
</template>

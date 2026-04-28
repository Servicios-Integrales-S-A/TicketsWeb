<template>

  <!-- ── Vista cliente ── -->
  <div v-if="esCliente" class="cliente-home">

    <!-- Hero -->
    <header class="cliente-hero">
      <div class="cliente-hero-logo">
        <i class="bi bi-headset"></i>
      </div>
      <div>
        <h1 class="cliente-hero-nombre">Servicios Integrales</h1>
        <p class="cliente-hero-tagline">
          Tu plataforma de soporte técnico y gestión de solicitudes
        </p>
      </div>
    </header>

    <!-- Acceso rápido -->
    <section class="cliente-acceso">
      <p class="cliente-section-titulo">¿Qué deseas hacer?</p>
      <div class="cliente-actions">
        <router-link
          v-for="card in CARDS_CLIENTE"
          :key="card.id"
          :to="card.to"
          class="cliente-card"
          :style="{ '--bg': card.color, '--border': card.colorDark, '--hover': card.colorBright }"
        >
          <i :class="`bi ${card.icono} cliente-card-icon`"></i>
          <span class="cliente-card-titulo">{{ card.titulo }}</span>
          <small class="cliente-card-desc">{{ card.descripcion }}</small>
        </router-link>
      </div>
    </section>

    <!-- About Us -->
    <section class="cliente-about">
      <p class="cliente-section-titulo">Acerca de Nosotros</p>
      <p class="cliente-about-desc">
        <strong>Servicios Integrales, S.A.</strong> es una empresa líder en prestación de servicio
        al cliente. Contamos con un sistema moderno para gestionar incidencias con el objetivo de
        mejorar la eficiencia y calidad del servicio que brindamos.
      </p>
      <div class="cliente-features-grid">
        <div v-for="feat in FEATURES" :key="feat.titulo" class="cliente-feature-item">
          <div class="cliente-feature-icon">
            <i :class="`bi ${feat.icono}`"></i>
          </div>
          <div class="cliente-feature-body">
            <strong>{{ feat.titulo }}</strong>
            <small>{{ feat.desc }}</small>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="cliente-footer">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-telephone-fill"></i>
        <span>+502 2345-6789</span>
      </div>
      <span class="cliente-footer-sep">·</span>
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-envelope-fill"></i>
        <a href="mailto:serviciosintegrales.no.reply@gmail.com">
          serviciosintegrales.no.reply@gmail.com
        </a>
      </div>
      <span class="cliente-footer-sep">·</span>
      <small>© 2025 Servicios Integrales · Todos los derechos reservados</small>
    </footer>

  </div>

  <!-- ── Vista admin / agente (sin cambios) ── -->
  <div v-else class="dashboard" :class="esAdmin ? 'dashboard--admin' : 'dashboard--usuario'">
    <router-link
      v-for="card in tarjetas"
      :key="card.id"
      :to="card.to"
      class="dashboard-card"
      :style="{ '--bg': card.color, '--border': card.colorDark, '--hover': card.colorBright }"
    >
      <i :class="`bi ${card.icono}`" style="font-size: 3rem;"></i>
      <span class="fs-4 fw-semibold mt-3">{{ card.titulo }}</span>
      <small class="mt-1 opacity-75 text-center px-3">{{ card.descripcion }}</small>
    </router-link>
  </div>

</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store     = useStore()
const esAdmin   = computed(() => store.getters['auth/rol'] === 'admin')
const esCliente = computed(() => store.getters['auth/rol'] === 'cliente')

/* ── Cards cliente (acciones rápidas) ── */
const CARDS_CLIENTE = [
  {
    id:          'ver-tickets',
    titulo:      'Mis Tickets',
    descripcion: 'Consulta el estado de tus solicitudes',
    icono:       'bi-ticket-perforated',
    color:       '#0d6efd',
    colorDark:   '#0a58ca',
    colorBright: '#3d8bfd',
    to:          { name: 'tickets' },
  },
  {
    id:          'crear-ticket',
    titulo:      'Nueva Solicitud',
    descripcion: 'Abre un nuevo ticket de soporte',
    icono:       'bi-plus-circle',
    color:       '#198754',
    colorDark:   '#146c43',
    colorBright: '#28a745',
    to:          { name: 'tickets', query: { nuevo: '1' } },
  },
]

/* ── Pilares del servicio (About Us) ── */
const FEATURES = [
  {
    icono:  'bi-ticket-perforated',
    titulo: 'Creación de Tickets',
    desc:   'Abre solicitudes por correo electrónico, chat, formulario web o llamada telefónica.',
  },
  {
    icono:  'bi-person-check',
    titulo: 'Asignación Inteligente',
    desc:   'Los tickets se asignan automáticamente según reglas predefinidas por tipo o prioridad.',
  },
  {
    icono:  'bi-tags',
    titulo: 'Clasificación y Prioridad',
    desc:   'Categorizamos cada caso en soporte técnico, ventas, facturación y más, con niveles Crítico, Alto, Medio y Bajo.',
  },
  {
    icono:  'bi-check2-circle',
    titulo: 'Resolución y Seguimiento',
    desc:   'Nuestros agentes documentan cada avance con notas internas hasta dar cierre satisfactorio al cliente.',
  },
]

/* ── Cards admin / agente ── */
const CARDS_BASE = [
  {
    id:          'ver-tickets',
    titulo:      'Ver Tickets',
    descripcion: 'Consulta y gestiona tus tickets',
    icono:       'bi-ticket-perforated',
    color:       '#0d6efd',
    colorDark:   '#0a58ca',
    colorBright: '#3d8bfd',
    to:          { name: 'tickets' },
  },
  {
    id:          'crear-ticket',
    titulo:      'Crear Ticket',
    descripcion: 'Abre una nueva solicitud de soporte',
    icono:       'bi-plus-circle',
    color:       '#198754',
    colorDark:   '#146c43',
    colorBright: '#28a745',
    to:          { name: 'tickets', query: { nuevo: '1' } },
  },
]

const CARDS_ADMIN = [
  ...CARDS_BASE,
  {
    id:          'usuarios',
    titulo:      'Usuarios',
    descripcion: 'Gestiona los usuarios del sistema',
    icono:       'bi-people',
    color:       '#fd7e14',
    colorDark:   '#ca6510',
    colorBright: '#ff9a3c',
    to:          { name: 'admin-usuarios' },
  },
  {
    id:          'categorias',
    titulo:      'Categorías',
    descripcion: 'Organiza los tipos de solicitud',
    icono:       'bi-tags',
    color:       '#6f42c1',
    colorDark:   '#59359a',
    colorBright: '#8c68cd',
    to:          { name: 'admin-categorias' },
  },
  {
    id:          'reglas',
    titulo:      'Reglas',
    descripcion: 'Configura la asignación automática',
    icono:       'bi-diagram-3',
    color:       '#dc3545',
    colorDark:   '#b02a37',
    colorBright: '#e04b5a',
    to:          { name: 'admin-reglas' },
  },
]

const tarjetas = computed(() => esAdmin.value ? CARDS_ADMIN : CARDS_BASE)
</script>

<style scoped>
/* ════════════════════════════════════════
   Vista cliente
════════════════════════════════════════ */
.cliente-home {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ── Hero ── */
.cliente-hero {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: linear-gradient(135deg, #0d6efd 0%, #0856d6 100%);
  color: #fff;
  border-radius: 16px;
  padding: 1.25rem 1.75rem;
  flex-shrink: 0;
}

.cliente-hero-logo {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
}

.cliente-hero-nombre {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.cliente-hero-tagline {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  opacity: 0.88;
}

/* ── Acceso rápido ── */
.cliente-acceso {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.cliente-section-titulo {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6c757d;
  margin: 0 0 0.75rem;
}

.cliente-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.cliente-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 1.1rem;
  text-decoration: none;
  color: #fff;
  background-color: var(--bg);
  border: 2px solid var(--border);
  border-radius: 14px;
  transition: background-color 0.18s, box-shadow 0.18s, transform 0.15s;
}

.cliente-card:hover {
  background-color: var(--hover);
  color: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px);
}

.cliente-card-icon {
  font-size: 1.75rem;
}

.cliente-card-titulo {
  font-size: 1rem;
  font-weight: 600;
}

.cliente-card-desc {
  font-size: 0.78rem;
  opacity: 0.85;
  text-align: center;
}

/* ── About Us ── */
.cliente-about {
  flex: 1;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cliente-about-desc {
  font-size: 0.83rem;
  color: #495057;
  line-height: 1.55;
  margin: 0 0 0.9rem;
}

.cliente-features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  flex: 1;
  align-content: start;
}

.cliente-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.cliente-feature-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #e7f1ff;
  color: #0d6efd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.cliente-feature-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.cliente-feature-body strong {
  font-size: 0.82rem;
  color: #212529;
}

.cliente-feature-body small {
  font-size: 0.75rem;
  color: #6c757d;
  line-height: 1.4;
}

/* ── Footer ── */
.cliente-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  font-size: 0.8rem;
  color: #6c757d;
  flex-shrink: 0;
}

.cliente-footer a {
  color: #0d6efd;
  text-decoration: none;
}

.cliente-footer a:hover {
  text-decoration: underline;
}

.cliente-footer-sep {
  color: #dee2e6;
  font-weight: 300;
  font-size: 1rem;
}

/* ════════════════════════════════════════
   Vista admin / agente (sin cambios)
════════════════════════════════════════ */
.dashboard {
  display: grid;
  gap: 1rem;
  height: 100%;
  min-height: calc(100vh - 56px - 3rem);
}

.dashboard--usuario {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}

.dashboard--admin {
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: 1fr 1fr;
}
.dashboard--admin .dashboard-card:nth-child(1),
.dashboard--admin .dashboard-card:nth-child(2) { grid-column: span 3; }
.dashboard--admin .dashboard-card:nth-child(3),
.dashboard--admin .dashboard-card:nth-child(4),
.dashboard--admin .dashboard-card:nth-child(5) { grid-column: span 2; }

.dashboard-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: white;
  background-color: var(--bg);
  border: 2px solid var(--border);
  border-radius: 16px;
  transition: background-color 0.18s, box-shadow 0.18s;
  cursor: pointer;
}

.dashboard-card:hover {
  background-color: var(--hover);
  color: white;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.dashboard-card:focus-visible {
  background-color: var(--hover);
  color: white;
  outline: 3px solid white;
  outline-offset: -8px;
}
</style>

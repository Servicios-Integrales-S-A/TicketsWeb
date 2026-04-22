import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const routes = [
  // ─── Rutas públicas ───────────────────────────────────────────────────────
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: '',                redirect: '/login' },
      { path: 'login',           name: 'login',           component: () => import('@/views/auth/LoginView.vue') },
      { path: 'register',        name: 'register',        component: () => import('@/views/auth/RegisterView.vue') },
      { path: 'forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue') },
      { path: 'reset-password',  name: 'reset-password',  component: () => import('@/views/auth/ResetPasswordView.vue') },
    ],
  },

  // ─── Rutas protegidas ─────────────────────────────────────────────────────
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [

      // Tickets — lista con modal de detalle anidado
      {
        path: 'tickets',
        name: 'tickets',
        component: () => import('@/views/tickets/TicketsListView.vue'),
        children: [
          {
            path: ':id',
            name: 'tickets-detalle',
            component: () => import('@/views/tickets/TicketDetailModal.vue'),
          },
        ],
      },

      // Perfil
      { path: 'perfil', name: 'perfil', component: () => import('@/views/perfil/PerfilView.vue') },

      // Admin — solo rol admin
      { path: 'admin/usuarios',   name: 'admin-usuarios',   meta: { roles: ['admin'] }, component: () => import('@/views/admin/UsuariosView.vue') },
      { path: 'admin/categorias', name: 'admin-categorias', meta: { roles: ['admin'] }, component: () => import('@/views/admin/CategoriasView.vue') },
      { path: 'admin/reglas',     name: 'admin-reglas',     meta: { roles: ['admin'] }, component: () => import('@/views/admin/ReglasView.vue') },

      { path: 'home', name: 'home', component: () => import('@/views/HomeView.vue') },

      // Redirigir / a home
      { path: '', redirect: '/home' },
    ],
  },

  // ─── Not found ────────────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ─── Guard global ─────────────────────────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['auth/isAuthenticated']
  const rolUsuario      = store.getters['auth/rol']
  const requiresAuth    = to.matched.some(r => r.meta.requiresAuth)
  const rolesPermitidos = to.meta.roles

  // Sin sesión intentando acceder a ruta protegida → login
  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'login' })
  }

  // Con sesión intentando acceder a rutas públicas → home
  if (!requiresAuth && isAuthenticated && to.name !== 'not-found') {
    return next({ name: 'home' })
  }

  // Rol no permitido → home
  if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario)) {
    return next({ name: 'home' })
  }

  next()
})

export default router

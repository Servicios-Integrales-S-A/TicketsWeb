# TicketsWeb — Guía de desarrollo

## Stack
- Vue 3 + Vite 5
- Vue Router 4
- Vuex 4
- Bootstrap 5 + Bootstrap Icons
- Axios

## Reglas generales

- Usar siempre `<script setup>` (Composition API moderna)
- Un componente o vista por archivo
- Nombres de archivos en PascalCase para componentes, camelCase para archivos de lógica (`auth.js`, `axios.js`)

---

## Diseño de interfaz — estándares

### Inputs — módulo auth
- Usar siempre el componente `@/components/ui/AuthInput.vue`
- Estilo: **label flotante** (`form-floating` de Bootstrap)
  - El label actúa como placeholder cuando el campo está vacío
  - Sube y se reduce al hacer foco o cuando hay valor
- Sin texto placeholder visible — el label cumple esa función
- El campo de contraseña incluye toggle show/hide integrado en el componente

### Inputs — resto del proyecto
- Label estándar encima del input (no flotante)
- `border-radius: 10px` aplicado globalmente en `src/assets/main.css` — no agregar manualmente
- Aplica automáticamente a `.form-control`, `.form-select`

### Botones — todo el proyecto
- `rounded-pill` aplicado globalmente en `src/assets/main.css` — no agregar `rounded-pill` manualmente
- Usar solo las clases de variante y tamaño: `btn btn-primary`, `btn btn-outline-secondary`, `btn btn-sm btn-danger`, etc.
- Estado de carga: spinner + texto descriptivo, botón deshabilitado con `:disabled="cargando"`
- Excepción: dentro de `.input-group` los bordes se ajustan automáticamente en el CSS global

### Tarjeta de auth (AuthLayout)
- `border-radius` con clase `rounded-4`
- Sombra: `box-shadow: 0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.08)`
- Sin clase `shadow` de Bootstrap — usar el estilo inline definido arriba

### Mensajes de error
- Error de validación de campo: prop `error` del componente `AuthInput` → muestra `invalid-feedback`
- Error del servidor: `<div class="alert alert-danger py-2">` con ícono `bi-exclamation-circle`

---

## Estructura de carpetas

```
src/
├── api/              # Una función por módulo del backend
├── store/
│   └── modules/      # Módulos de Vuex (auth, ...)
├── router/           # index.js con rutas y guards
├── layouts/          # AuthLayout, AppLayout
├── views/
│   ├── auth/         # Login, Register, ForgotPassword, ResetPassword
│   ├── tickets/      # TicketsListView, TicketDetailModal
│   ├── perfil/       # PerfilView
│   └── admin/        # Usuarios, Categorias, Reglas
└── components/
    ├── ui/           # Componentes reutilizables (AuthInput, ...)
    ├── tickets/      # Componentes específicos de tickets
    └── layout/       # AppSidebar, AppNavbar
```

## Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `/login` | LoginView | Público |
| `/register` | RegisterView | Público |
| `/forgot-password` | ForgotPasswordView | Público |
| `/reset-password` | ResetPasswordView | Público |
| `/tickets` | TicketsListView | Todos |
| `/tickets/:id` | TicketDetailModal (sobre lista) | Todos |
| `/perfil` | PerfilView | Todos |
| `/admin/usuarios` | UsuariosView | Admin |
| `/admin/categorias` | CategoriasView | Admin |
| `/admin/reglas` | ReglasView | Admin |

- `/tickets/:id` es una ruta hija de `/tickets` — la lista permanece montada y el modal se renderiza encima
- Modales sin ruta: crear ticket, crear/editar usuario, categoría, regla, agregar nota

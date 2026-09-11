# Menu-Pago

**🔗 Demo en vivo:** https://ramiroz93.github.io/menu-pago/ — 100% funcional, sin necesidad de crear cuenta: elige con qué rol entrar (Cliente / Restaurante / Admin) y prueba el flujo completo con datos ficticios.

PWA de pedidos con saldo prepagado: los usuarios cargan saldo, descubren restaurantes cercanos, piden desde el menú y pagan al instante con descuento — sin manejar efectivo ni esperar validación de pago en el momento del pedido.

Tres roles con su propia interfaz: **usuario**, **restaurante** y **administrador**, todos sobre la misma base de código.

## Sobre la demo en vivo

La demo publicada corre 100% en el navegador, sin backend real: `src/config/supabase.js` reemplaza al cliente real de Supabase por una versión en memoria con la misma interfaz (`.from()`, `.rpc()`, `.auth`, `.storage`) pero datos ficticios — así se puede navegar, pedir, aprobar recargas y gestionar restaurantes sin exponer ninguna base de datos real. Los cambios que hagas viven solo en tu pestaña y se pierden al recargar.

Este repo (la versión de portfolio) queda configurado para esta demo en memoria. El sistema original —conectado a un Supabase real con `supabase-js`, autenticación por email y Edge Functions— sigue el mismo esquema de tablas documentado en [`SUPABASE_SETUP.sql`](SUPABASE_SETUP.sql) por si quieres ver cómo se integra con un backend real.

## Qué resuelve

- **Usuario**: descubre restaurantes cercanos (con mapa), busca platos con sinónimos ("hamburguesa" encuentra "burger"), carga saldo con distintos niveles de recarga, paga con descuento automático usando su saldo, sigue el estado de sus pedidos y su historial
- **Restaurante**: gestiona su menú, recibe y administra pedidos en tiempo real, consulta sus ventas por período
- **Administrador**: dashboard general, gestión de restaurantes y usuarios, aprobación de recargas de saldo, reportes de ventas globales y por restaurante, edición de menús

## Features técnicas destacadas

- **PWA instalable** con service worker (Workbox) y notificaciones push nativas para pedidos y recordatorios (`supabase/functions/notify-*`, `remind-*`)
- **Saldo prepagado con descuento**: sistema de niveles de recarga y descuento configurable (`src/config/app.config.js`)
- **Búsqueda con sinónimos**: expansión de términos de búsqueda (ej. hamburguesa ↔ burger) para que el buscador de platos sea más flexible
- **Mapa interactivo** (Leaflet) para ubicar restaurantes y elegir dirección de entrega
- **Estado global** con Zustand, rutas con lazy loading en React Router

## Stack técnico

- **Frontend:** React 18, Vite, Tailwind CSS, Zustand, React Router
- **Backend:** [Supabase](https://supabase.com) — Postgres, Auth, Edge Functions (Deno), notificaciones push
- **PWA:** `vite-plugin-pwa` + Workbox (precaching, service worker)
- **Mapas:** Leaflet
- **Deploy:** Vercel

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Y ya — corre igual que la demo en vivo, con datos ficticios y sin necesidad de configurar nada. `.env.example` y [`SETUP.md`](SETUP.md) documentan cómo sería conectarlo a un Supabase real (crear el proyecto, correr `SUPABASE_SETUP.sql`, activar Auth por email, desplegar las Edge Functions) para quien quiera adaptar el código a un backend propio.

> Este repo es una pieza de portfolio: las credenciales originales fueron removidas. El build de producción (`dist/`) no se incluye en el repo — se genera con `npm run build`.

## Estructura

```
src/
├── pages/user/         ← Discover, RestaurantDetail, Wallet, TopUp, Profile, MyOrders
├── pages/restaurant/    ← Orders, Menu, Sales
├── pages/admin/         ← Dashboard, Restaurants, Users, TopUps, Sales, MenuEditor
├── layouts/              ← UserLayout, RestaurantLayout, AdminLayout
├── components/           ← BottomNav, RestaurantCard, Modal, etc.
├── store/useStore.js     ← estado global (Zustand)
└── config/               ← app.config.js (constantes), supabase.js (cliente)
supabase/functions/       ← Edge Functions: notificaciones push y recordatorios
```

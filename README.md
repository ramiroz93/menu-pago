# Menu-Pago

**🔗 Demo en vivo:** https://ramiroz93.github.io/menu-pago/ (interfaz visible, sin conexión a una base de datos real — ver nota abajo)

PWA de pedidos con saldo prepagado: los usuarios cargan saldo, descubren restaurantes cercanos, piden desde el menú y pagan al instante con descuento — sin manejar efectivo ni esperar validación de pago en el momento del pedido.

Tres roles con su propia interfaz: **usuario**, **restaurante** y **administrador**, todos sobre la misma base de código.

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
```

1. Crea un proyecto en [Supabase](https://supabase.com) y corre `SUPABASE_SETUP.sql` en el SQL Editor para crear las tablas
2. Copia `.env.example` a `.env` y completa con las credenciales de tu proyecto (Settings → API) y una clave pública VAPID para las notificaciones push
3. En Supabase, activa **Authentication → Email** (y desactiva "Confirm email" para desarrollo)
4. Despliega las Edge Functions de `supabase/functions/` con el [CLI de Supabase](https://supabase.com/docs/guides/cli)

```bash
npm run dev
```

Guía completa paso a paso en [`SETUP.md`](SETUP.md).

> Este repo es una pieza de portfolio: las credenciales originales fueron removidas y reemplazadas por placeholders. El build de producción (`dist/`) no se incluye porque Vite incrusta las variables de entorno en el bundle compilado — se genera con `npm run build` una vez configurado tu propio `.env`.

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

# Menu-Pago — Guía de instalación y puesta en marcha

## Requisitos previos

- Node.js 18+ instalado (nodejs.org)
- Cuenta gratuita en Supabase (supabase.com)

---

## Paso 1 — Instalar dependencias

Abre una terminal en la carpeta `menu-pago/` y ejecuta:

```bash
npm install
```

---

## Paso 2 — Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Click en **"New Project"**
3. Elige un nombre (ej: `menu-pago`) y una contraseña para la base de datos
4. Selecciona la región más cercana → **Create Project**
5. Espera ~2 minutos que se inicialice

---

## Paso 3 — Crear la base de datos

1. En tu proyecto Supabase, ve a **SQL Editor** (ícono de base de datos en el menú lateral)
2. Click en **"New Query"**
3. Copia y pega todo el contenido de `SUPABASE_SETUP.sql`
4. Click en **"Run"** (o Ctrl+Enter)
5. Verifica que no hay errores en el resultado

---

## Paso 4 — Obtener las credenciales

1. En Supabase ve a **Settings → API** (ícono de engranaje)
2. Copia:
   - **Project URL** → empieza con `https://xxxxx.supabase.co`
   - **anon public** key → string largo que empieza con `eyJ...`

3. Crea un archivo `.env` en la raíz de `menu-pago/`:

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_AQUI
```

---

## Paso 5 — Activar autenticación por email

1. En Supabase ve a **Authentication → Providers**
2. Asegúrate que **Email** está habilitado
3. En **Authentication → Settings** desactiva **"Confirm email"** para desarrollo (para no necesitar confirmar el email)

---

## Paso 6 — Configurar tu QR de pago

1. Abre [src/config/app.config.js](src/config/app.config.js)
2. En `paymentQR.imageUrl` pon la URL de la imagen de tu QR real
   - Si tienes la imagen localmente, ponla en `public/` y usa `/tu-qr.png`
   - Si está en algún servicio en la nube, pega la URL directamente

---

## Paso 7 — Arrancar la app en local

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

---

## Paso 8 — Crear tu cuenta de administrador

1. Ve a la app → **Registrarse** → crea tu cuenta con tu email
2. Ve a Supabase → **Table Editor → profiles**
3. Encuentra tu fila → edita el campo `role` y cámbialo de `user` a `admin`
4. Cierra sesión y vuelve a entrar → ahora tendrás acceso al panel de admin

---

## Paso 9 — Publicar en internet (gratis)

### Opción A — Vercel (recomendada, 2 minutos)

```bash
npm install -g vercel
npm run build
vercel --prod
```

Cuando te pida las variables de entorno, agrega las mismas del `.env`.

### Opción B — Netlify

```bash
npm run build
```
Arrastra la carpeta `dist/` a [app.netlify.com/drop](https://app.netlify.com/drop)

**Importante:** en Netlify agrega las variables de entorno en:
Site Settings → Environment Variables → Add variable

---

## Estructura de roles

| Registro normal | → role: `user` | Accede a `/app` |
|----------------|----------------|-----------------|
| Cambia manualmente en Supabase | → role: `admin` | Accede a `/admin` |
| Cambia manualmente en Supabase + asigna `restaurant_id` | → role: `restaurant` | Accede a `/restaurante` |

Para el rol `restaurant`:
1. Primero crea el restaurante desde el panel admin
2. Copia el `id` del restaurante (en Supabase → Table Editor → restaurants)
3. En la fila del perfil del dueño: cambia `role` a `restaurant` y pega el `id` en `restaurant_id`

---

## Flujo de recarga de saldo

```
Usuario solicita recarga
        ↓
La app guarda la solicitud en top_up_requests (status: pending)
        ↓
Se abre WhatsApp con mensaje prellenado al número 77876454
        ↓
Tú verificas el pago manualmente
        ↓
Entras al panel admin → Recargas → Aprobar
        ↓
El saldo se acredita automáticamente con +10% bonus
```

---

## Configuraciones que puedes cambiar en app.config.js

- `topUpBonus`: porcentaje de bonus (0.10 = 10%)
- `whatsappNumber`: tu número de WhatsApp con código de país
- `paymentQR.imageUrl`: URL de tu imagen QR
- `topUpTiers`: montos rápidos de recarga y sus bonus
- `adminEmails`: emails que tienen acceso de admin (opcional, el rol se gestiona en Supabase)

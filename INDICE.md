# INDICE.md — Menu-Pago (mapa de líneas)

Actualizar este archivo cada vez que se modifique estructura de un componente.

---

## CONFIGURACIÓN

| Archivo | Qué contiene | Líneas clave |
|---|---|---|
| `src/config/app.config.js` | APP_CONFIG: currency, discount (0.15), minConsumptionBalance (50), minTopUpAmount (100), topUpTiers, name | todo el archivo (27 líneas) |
| `src/config/supabase.js` | cliente supabase | todo el archivo (14 líneas) |
| `src/sw.js` | service worker push: isAdmin flag, vibración, requireInteraction, tag | L1-61 |
| `src/App.jsx` | rutas React Router, lazy imports | L1-147 |
| `src/main.jsx` | entry point | L1-9 |

---

## LAYOUTS

| Archivo | Qué contiene | Líneas clave |
|---|---|---|
| `src/layouts/UserLayout.jsx` | layout usuario, botón WhatsApp flotante "Contáctanos", ocultar en /restaurante/ | L1-55 |
| `src/layouts/AdminLayout.jsx` | layout admin | L1-12 |
| `src/layouts/RestaurantLayout.jsx` | layout restaurante | L1-12 |

---

## COMPONENTES

| Archivo | Qué contiene | Líneas clave |
|---|---|---|
| `src/components/BottomNav.jsx` | menú inferior tabs | L1-56 |
| `src/components/RestaurantCard.jsx` | tarjeta restaurante en Discover | L1-72 |
| `src/components/OrderStatusBadge.jsx` | badge colores estado pedido | L1-17 |
| `src/components/Spinner.jsx` | spinner carga | L1-6 |
| `src/components/Modal.jsx` | modal genérico | L1-20 |
| `src/components/LoadingScreen.jsx` | pantalla de carga inicial | L1-10 |

---

## PÁGINAS PÚBLICAS

| Archivo | Qué contiene | Líneas clave |
|---|---|---|
| `src/pages/Login.jsx` | formulario login | L1-90 |
| `src/pages/Register.jsx` | formulario registro | L1-131 |
| `src/pages/Privacidad.jsx` | política de privacidad (URL: /privacidad) | L1-157 |

---

## USUARIO (`src/pages/user/`)

### Discover.jsx (377 líneas)
| Sección | Líneas |
|---|---|
| Constante DISC (descuento) | L11 |
| SYNONYMS (23 grupos: hamburguesa↔burger, etc.) | L13-38 |
| `getSearchTerms()` — expande sinónimos | L39-49 |
| `DishCard` — componente tarjeta plato | L50-91 |
| Estado principal (restaurants, categories, search, favoriteIds) | L92-104 |
| useEffect principal: fetch + intervalo 60s + Realtime restaurants | L106-117 |
| useEffect favoritos | L119-128 |
| `fetchRestaurants()` — ordenamiento: openTop→openRest→closedTop→closedRest | L130-165 |
| `fetchCategories()` | L167-170 |
| useEffect buscador con debounce (búsqueda 5 niveles) | L172-256 |
| `toggleFavorite()` | L257-273 |
| Renderizado JSX (header ciudad, barra búsqueda, categorías, lista) | L286-377 |

### RestaurantDetail.jsx (328 líneas)
| Sección | Líneas |
|---|---|
| Estados (restaurant, menuItems, cart, notes, locations, rating) | L14-27 |
| useEffect carga restaurante (con cache 5min) | L28-60 |
| useEffect rating | L61-82 |
| useEffect carrito (limpia si restaurante cierra) | L83-101 |
| `handleOrder()` — crea pedido, descuenta saldo | L103-145 |
| `handleRate()` — califica restaurante | L146-157 |
| Pantalla "restaurante cerrado" | L163-190 |
| JSX principal (menú, carrito, botón pedir) | L191-328 |

### Wallet.jsx (83 líneas)
| Sección | Líneas |
|---|---|
| Historial recargas: fecha+hora en todas, motivo rechazo en rechazadas | L1-83 |

### TopUp.jsx (133 líneas)
| Sección | Líneas |
|---|---|
| Tiers 100/200/300/400/500/600 con 5% bonus | ~L20-40 |
| Validación mínimo 100 Bs | ~L50-60 |
| Botón descargar QR | ~L90-100 |
| Texto "notificar a MenuPago" | ~L110 |

### Profile.jsx (214 líneas)
| Sección | Líneas |
|---|---|
| Estados (name, phone, city, locations, locName, locUrl) | L10-22 |
| `loadLocations()` | L29-35 |
| `addLocation()` — Maps URL obligatorio | L40-50 |
| `deleteLocation()` | L51-57 |
| `handleSave()` — guarda perfil | L61-91 |
| JSX (perfil, ubicaciones) | L92-214 |

### MyOrders.jsx (145 líneas) — historial pedidos usuario

---

## ADMIN (`src/pages/admin/`)

### Dashboard.jsx (204 líneas)
| Sección | Líneas |
|---|---|
| Opciones de período (Total/7d/30d/90d/Rango) | L8-15 |
| Helpers de fecha (daysAgo, toISO, endOfDay, todayStr, daysAgoStr) | L16-40 |
| Estados (stats, loading, recentOrders, period, dateFrom, dateTo) | L43-49 |
| `fetchData()` — consultas filtradas por período, ventas completadas, ahorro | L50-114 |
| JSX (cards: ventas, ahorro, pedidos, restaurantes, usuarios totales, usuarios nuevos, actividad reciente) | L117-204 |

### AllOrders.jsx (127 líneas)
| Sección | Líneas |
|---|---|
| Fetch pedidos + restaurantes (con campo whatsapp) | L15-35 |
| `reNotify()` — llama Edge Function notify-restaurant | L37-43 |
| `getWhatsAppLink()` — mensaje pre-armado con items y total | L45-51 |
| JSX (filtros, lista pedidos, botones Re-notificar + WhatsApp en pending) | L61-136 |

### TopUps.jsx (251 líneas)
| Sección | Líneas |
|---|---|
| `userWhatsApp()` — genera link wa.me | L7-11 |
| `playAdminAlert()` — onda cuadrada, 8 beeps, 1400/1000/1600Hz | L20-42 |
| REJECTION_REASONS — motivos predefinidos de rechazo | L44-51 |
| Estados (requests, tab, processing, rejectModal, selectedReason, customReason) | L52-60 |
| Fetch solicitudes + Realtime INSERT (toca alerta) | L61-88 |
| useEffect alerta persistente cada 30s si hay pendientes | L90-96 |
| `approve()` — llama RPC credit_top_up | L98-104 |
| `openRejectModal()` / `confirmReject()` | L106-121 |
| JSX tarjetas (reload_number, botón WA usuario, aprobar, rechazar) | L125-237 |
| Modal rechazo (razones + "Otro motivo" + textarea) | L238-274 |

### Restaurants.jsx (560 líneas)
| Sección | Líneas |
|---|---|
| DIAS, POSITIONS | L11-21 |
| `ImageUploader` componente | L23-52 |
| `RestaurantModal` — form completo (nombre, whatsapp, dirección, ciudad, categorías, horario, saldo) | L53-453 |
| `handleAddBalance()` — agrega saldo de consumo | L81-96 |
| `handleUpload()` / `handleRemove()` — imágenes | L116-133 |
| `handleSave()` — guarda/crea restaurante + genera credenciales | L140-181 |
| JSX del modal (campos de formulario) | L182-453 |
| `AdminRestaurants` — página principal | L454-560 |
| `fetchRestaurants()` + `fetchCategories()` | L462-478 |
| `toggle()` — abre/cierra restaurante | L480-484 |
| JSX lista restaurantes (badge abierto/cerrado, saldo bajo) | L493-560 |

### Users.jsx (236 líneas)
| Sección | Líneas |
|---|---|
| `AdjustModal` — ajusta saldo wallet | L8-66 |
| `AccessModal` — cambia rol y restaurante asignado | L67-133 |
| Tabs "Usuarios" / "Restaurantes" con conteo | L165-167 |
| Filtro búsqueda | L169-173 |
| JSX (tabs, búsqueda, lista usuarios/restaurantes) | L187-236 |

### Sales.jsx (179 líneas) — ventas admin con períodos, por restaurante, top items

### MenuEditor.jsx (176 líneas) — editor de menú desde vista admin

---

## RESTAURANTE (`src/pages/restaurant/`)

### Orders.jsx (459 líneas)
| Sección | Líneas |
|---|---|
| `playOrderAlert()` — sine 960/720Hz, 8 beeps | L19-43 |
| `AcceptModal` — selección tiempo entrega (10-60 min) | L45-96 |
| `RejectModal` — motivos de rechazo + "Otros" | L97-171 |
| `LowBalanceModal` — mensaje WA para recargar saldo consumo | L172-210 |
| Estados principales (orders, isOpen, restaurantSchedule, consumptionBalance) | L211-224 |
| useEffect desbloqueo audio | L228-236 |
| useEffect alerta persistente cada 30s si hay pedidos pending | L238-245 |
| `toggleOpen()` — abre/cierra manualmente | L247-257 |
| useEffect fetch + Realtime pedidos | L258-295 |
| `copyOrderData()` — copia datos pedido al portapapeles | L299-313 |
| `updateStatus()` / `handleAccept()` / `handleReject()` | L314-334 |
| JSX (switch abierto/cerrado, tabs, lista pedidos) | L341-459 |

### Menu.jsx (377 líneas)
| Sección | Líneas |
|---|---|
| `ItemModal` — crear/editar plato (nombre, precio, categoría, imagen) | L11-97 |
| `ScheduleEditor` — editor horarios multi-turno por día | L124-231 |
| `RestaurantProfile` — subir logo y portada | L232-319 |
| `RestaurantMenu` — página principal menú restaurante | L320-377 |

### Sales.jsx (303 líneas)
| Sección | Líneas |
|---|---|
| KPIs (ventas totales, pedidos, ticket promedio, rating) | L126-140 |
| Top platos más pedidos | L130-139 |
| Timeline actividad (pedidos + recargas) | L242-303 |

---

## SUPABASE EDGE FUNCTIONS (`supabase/functions/`)

| Función | Qué hace |
|---|---|
| `notify-restaurant/index.ts` | push al restaurante cuando llega pedido nuevo |
| `notify-user/index.ts` | push al usuario: pedido confirmado/rechazado/completado, recarga aprobada/rechazada |
| `notify-admin/index.ts` | push a todos los admins cuando llega recarga nueva (`admin_urgent: true`) |
| `remind-restaurant/index.ts` | espera 20s → re-notifica restaurante; espera 40s más → notifica admins si sigue pending |
| `remind-admin/index.ts` | espera 20s → re-notifica admins si recarga sigue pending (`admin_urgent: true`) |

---

## BASE DE DATOS (tablas principales)

| Tabla | Campo destacado |
|---|---|
| `profiles` | role (user/restaurant/admin), wallet_balance, phone, city, restaurant_id |
| `restaurants` | is_open, is_active, consumption_balance, sort_order (1-5), whatsapp, schedule (JSONB) |
| `orders` | status (pending/confirmed/completed/rejected), total (con descuento), subtotal (sin descuento), order_number |
| `top_up_requests` | status (pending/approved/rejected), reload_number, amount, total_credited, bonus_amount, rejection_reason |
| `menu_items` | is_available, restaurant_id |
| `push_subscriptions` | user_id, subscription (JSONB) |
| `favorites` | user_id, restaurant_id |
| `ratings` | user_id, restaurant_id, stars |
| `delivery_locations` | user_id, name, maps_url |

---

## CONSTANTES GLOBALES (app.config.js)

```
discount: 0.15               → 15% descuento en pedidos
minConsumptionBalance: 50    → mínimo saldo para que restaurante aparezca abierto
minTopUpAmount: 100          → mínimo recarga usuario
topUpTiers: [100,200,300,400,500,600] → con 5% bonus cada uno
currency: 'Bs'
name: 'Menu-Pago'
```

# ByUrSide App - Comprehensive Architecture Guide

**Project Type:** Progressive Web App (PWA) | AI-Powered Senior Care Assistant  
**Version:** 0.0.0 | **Status:** Active Development  
**Deploy Target:** Vercel (producción) + Firebase Hosting (alternativo)  
**Repositorio:** https://github.com/NelSystems77/byurside.git  
**URL Producción:** https://byurside.vercel.app/  
**Last Updated:** May 11, 2026 (v2.6)

---

## 0. REGLA OBLIGATORIA — MANTENIMIENTO DE ESTE ARCHIVO

> **IMPORTANTE:** Después de CUALQUIER cambio, fix, nueva feature o solicitud completada en este proyecto, Claude DEBE actualizar este archivo `CLAUDE.md` antes de terminar la sesión. Esto incluye:
>
> - Nuevos archivos o componentes creados → agregarlos a §3 (estructura)
> - Nuevos hooks → agregarlos a §6 (custom hooks)
> - Bugs corregidos → agregarlos a §9 (bugs conocidos y soluciones)
> - Nuevas dependencias instaladas → agregarlos a §2 (stack)
> - Nuevos patrones de arquitectura → agregarlos a §10
> - Features completadas → moverlas de §15 roadmap a §14 completadas
> - Cambios en variables de entorno, rutas, colecciones Firestore → secciones correspondientes
> - Actualizar el número de versión y la línea de cambios al final del documento
>
> **El objetivo es que cualquier sesión futura comience con contexto completo y preciso del estado actual del proyecto, sin necesidad de redescubrir lo que ya se hizo.**

---

## 1. PROJECT OVERVIEW & PURPOSE

### Vision
ByUrSide is an intelligent companion system designed specifically for elderly care (adults 65+). It provides:
- **AI-Powered Voice Assistant** (Danay) - bilingual Spanish support with Costa Rican dialect
- **Proactive Health Monitoring** - medication reminders, vital tracking, emergency detection
- **Caregiver Dashboard** - family member control panel for Ana (primary caregiver)
- **Offline Functionality** - PWA + Firebase offline-first architecture
- **Accessibility Focus** - large text, voice I/O, simplified interfaces

### Core Users
- **Paciente (Patient)**: Elderly person receiving care (e.g., Don Carlos)
- **Familiar (Caregiver)**: Family member managing care (e.g., Ana)
- **Sistema (System)**: Danay AI assistant providing 24/7 support

---

## 2. TECHNOLOGY STACK & DEPENDENCIES

### Frontend Framework
- **React 19.2.0** - UI component library with hooks
- **TypeScript ~5.9.3** - Type safety & developer experience (`strict: false` for mobile compatibility)
- **Vite 7.2.4** - Lightning-fast build tool & dev server
- **React Router DOM 7.12.0** - Client-side routing (Role selector → Patient / Caregiver views)

### UI & Animation
- **Tailwind CSS 4.1.18** - Utility-first styling with PostCSS pipeline
- **Framer Motion 12.26.2** - Smooth animations & transitions
- **Lucide React 0.562.0** - Icon library (192+ medical/utility icons)

### State Management
- **Firebase Firestore** - Real-time document database (primary state)
- **Context API** - Local state (`AuthContext` for user identity)
- **Zustand 5.0.10** - Available but not actively used yet

### AI & NLP
- **Google Generative AI 0.24.1** - Core LLM engine (primary)
  - Modelos verificados disponibles: `gemini-2.5-flash` ✅ | `gemini-2.0-flash` ✅ | `gemini-2.0-flash-lite` ✅
  - Modelos deprecados/no disponibles: gemini-1.5-flash-* (retornan 404)
- **Groq** - Secondary fallback — cuota gratuita generosa (14,400 RPD)
  - Modelos verificados disponibles: `llama-3.3-70b-versatile` ✅ | `llama-3.1-8b-instant` ✅ | `llama-4-scout-17b` ✅
  - Se usa 70b como primario (mejor calidad), 8b instant como fallback
- **OpenAI 6.37.0** - Tertiary fallback (gpt-3.5-turbo) — ⚠️ sin créditos (free tier venció abril 2023, requiere billing)
- Layered fallback: Gemini → Groq → OpenAI → Dev mode rules (siempre activo)

### Backend Services
- **Firebase Suite 12.8.0**
  - **Firestore** - Document database with offline persistence
  - **Auth** - Firebase Authentication (email/phone login, dev mode fallback)
  - **Messaging** - Cloud messaging for push notifications
  - **Persistent Local Cache** - Enables offline-first operation
- **Firebase Admin 13.6.0** - Server-side operations
- **Firebase Functions 7.0.3** - Cloud functions for backend tasks

### Maps & Location
- **Leaflet 1.9.4** + **React Leaflet 5.0.0** - GPS map rendering

### Utilities
- **jsPDF 4.0.0** + **jsPDF AutoTable 5.0.7** - PDF report generation
- **date-fns 4.1.0** - Date manipulation & formatting

### Web APIs (Browser)
- **Web Speech API** - Speech Recognition (es-CR dialect) & Synthesis (voice output)
- **Geolocation API** - GPS tracking for family safety monitoring
- **Service Worker** - PWA offline capabilities
- **Local Storage** - Object location memory (useMemoria hook)
- **Notification API** - Browser push notifications

---

## 3. FILE STRUCTURE BREAKDOWN

```
byurside-app/
├── CLAUDE.md                        # ← ESTE ARCHIVO (arquitectura del proyecto)
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── tailwind.config.js / postcss.config.js / eslint.config.js
├── firebase.json                    # Hosting + rewrite rules (SPA)
├── vercel.json                      # Vercel deploy config (build, outputDir, rewrites SPA)
├── index.html
│
├── functions/
│   └── index.ts                     # Cloud Functions (backend tasks)
│
├── public/
│   ├── firebase-messaging-sw.js     # Service worker (push notifications)
│   ├── manifest.json                # PWA manifest
│   └── [icons]                      # 192x192, 512x512 app icons
│
└── src/
    ├── main.tsx                     # Entry point, PWA registration, React root
    ├── App.tsx                      # Router + AuthProvider + shared state
    │
    ├── context/
    │   └── AuthContext.tsx          # UserProfile global state (rol, uid, nombres)
    │
    ├── firebase/
    │   ├── config.ts                # Firebase init + offline persistence
    │   ├── seed.ts                  # DB population (medicamentos maestros)
    │   ├── seedBible.ts             # Siembra de versículos bíblicos
    │   └── seedDev.ts               # Datos de prueba para modo desarrollo
    │
    ├── hooks/ (13 Custom Hooks)
    │   ├── useIA.ts                 # Motor IA: local rules → Gemini → OpenAI → Groq
    │   ├── useSalud.ts              # Gestión de medicamentos (buscar, guardar, alertas)
    │   ├── useVoz.ts                # Text-to-Speech (voz Dalia/Sabina, es-MX)
    │   ├── useEscuchar.ts           # Speech Recognition (es-CR, online/offline)
    │   ├── useAgua.ts               # ← NUEVO: Registro de tomas de agua (Firestore)
    │   ├── useMemoria.ts            # Memoria de objetos (localStorage)
    │   ├── useBiblia.ts             # Lectura bíblica diaria (mockBible.ts)
    │   ├── useGPS.ts                # Geolocalización (watchPosition → Firestore)
    │   ├── useCompras.ts            # Lista de compras (voz + manual)
    │   ├── usePushNotifications.ts  # FCM token handling
    │   ├── usePerfil.ts             # Carga de perfil de usuario
    │   ├── useInventario.ts         # Inventario de medicamentos/suministros
    │   └── useDanayBrain.ts         # Procesador IA alternativo (simplificado)
    │
    ├── components/ (15 Components)
    │   ├── RoleSelector.tsx         # Pantalla de selección paciente/cuidador
    │   ├── Dashboard.tsx            # VISTA PACIENTE: voz, texto, agua, SOS
    │   ├── ProactiveHeart.tsx       # AGENTE: scheduler de recordatorios
    │   ├── CaregiverDashboard.tsx   # VISTA CUIDADOR: panel con tabs
    │   ├── CaregiverMeds.tsx        # Gestión de medicamentos (Ana)
    │   ├── CaregiverShopping.tsx    # Lista de compras (Ana)
    │   ├── CaregiverBible.tsx       # Lectura bíblica (Ana)
    │   ├── CaregiverMap.tsx         # Mapa GPS en tiempo real
    │   ├── CaregiverWellness.tsx    # Historial emocional + bienestar
    │   ├── CaregiverStats.tsx       # Estadísticas y reportes
    │   ├── CaregiverFamily.tsx      # Gestión de familiares
    │   ├── CaregiverSettings.tsx    # Configuración del sistema
    │   ├── MedicationForm.tsx       # Formulario para agregar recetas
    │   ├── ProductSelectorModal.tsx # Modal de selección de productos
    │   └── VisualBridge.tsx         # Mensajes en texto grande (accesibilidad)
    │
    └── test/ (Suite QA — Vitest + React Testing Library)
        ├── setup.ts                 # Mocks globales: Firebase, Gemini, OpenAI, Web Speech API
        ├── useMemoria.test.ts       # 4 tests: guardar/buscar objetos en localStorage
        ├── useVoz.test.ts           # 6 tests: TTS, cancel, lang, pitch/rate, voz Dalia
        ├── useEscuchar.test.ts      # 6 tests: STT, estado inicial, modoOffline
        ├── useAgua.test.ts          # 7 tests: registrar agua, META, porcentaje, suma diaria
        ├── useSalud.test.ts         # 11 tests: buscar, prescribir, descontar, alertas stock
        ├── useIA.test.ts            # 13 tests: emergencias, agua voz, memoria, fallback, sentiment
        ├── RoleSelector.test.tsx    # 9 tests: render, navegación, aria-labels
        ├── VisualBridge.test.tsx    # 6 tests: render, vacío→null, tipos, fontSize
        └── Dashboard.test.tsx       # 21 tests: header, agua panel, SOS modal, input, confirmación
```

---

## 4. ROUTING (App.tsx)

```
App Router (BrowserRouter)
  ├─ "/"          → RoleSelector      (pantalla de bienvenida con selección de rol)
  ├─ "/paciente"  → Dashboard + ProactiveHeart  (vista del paciente)
  ├─ "/familiar"  → CaregiverDashboard          (vista del cuidador)
  └─ "*"          → Navigate to "/"   (fallback)
```

**Estado compartido en App.tsx:**
```typescript
const [esperandoConfirmacion, setEsperandoConfirmacion] = useState<{
  tipo: string; id: string; nombre: string
} | null>(null);
```
Este estado lo LEE el `Dashboard` y lo ESCRIBE el `ProactiveHeart` — ambos lo reciben como prop desde App.tsx. Nunca duplicar este estado localmente en los hijos.

---

## 5. KEY COMPONENTS & THEIR LOGIC

### RoleSelector.tsx (NUEVO — Pantalla de Bienvenida)
**Ruta:** `/`  
**Propósito:** Primera pantalla que ve el usuario. Dos botones grandes:
- "Soy el Paciente" → navega a `/paciente`
- "Soy Cuidador" → navega a `/familiar`

**Diseño:** Dark theme (slate-900), Framer Motion, animaciones escalonadas.

---

### Dashboard.tsx (Vista del Paciente)
**Ruta:** `/paciente`  
**Props requeridos:**
```typescript
interface DashboardProps {
  esperandoConfirmacion: { tipo: string; id: string; nombre: string } | null;
  setEsperandoConfirmacion: (val: ...) => void;
}
```
**Features:**
- Botón de micrófono (hold-to-talk)
- Input de texto fallback
- Botón de agua 💧 (abre panel de hidratación)
- Panel de agua: barra de progreso + 3 botones (250ml, 500ml, 1000ml)
- Botón SOS → modal con datos de emergencia
- Indicador online/offline
- VisualBridge para mostrar respuestas de Danay

**Data Flow:**
1. Usuario habla → `useEscuchar` captura transcripción
2. Si `esperandoConfirmacion.tipo === 'pastilla'` → confirmar toma → `descontarDosis()`
3. Sino → `useIA.procesarComando()` → respuesta Danay
4. Respuesta hablada vía `useVoz.hablar()` + mostrada en `VisualBridge`

---

### ProactiveHeart.tsx (Agente Scheduler)
**Ruta:** Renderizado junto al Dashboard en `/paciente`  
**pacienteId:** Dinámico desde `useAuth()`:
```typescript
const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;
```
**Acciones programadas:**
- `08:00` — Saludo espiritual con oferta de lectura bíblica
- `09:00, 15:00, 20:00` — Chequeo emocional
- A la hora de cada medicamento — Recordatorio + protocolo emergencia (5 min timeout)

**IMPORTANTE:** El `setEsperandoConfirmacion` que recibe es el de App.tsx, NO crear uno local.

---

### CaregiverDashboard.tsx (Vista del Cuidador)
**Ruta:** `/familiar`  
**pacienteId:** Dinámico desde `useAuth()`:
```typescript
const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;
```
**Tabs:** meds | compras | bienestar | biblia | gps | stats | familia | config  
**Monitoreo de alertas:** onSnapshot donde `resuelta == false`, orderBy `createdAt`

---

## 6. CUSTOM HOOKS

### useIA.ts (Motor de IA)
**Categorías de detección local:**
```typescript
CATEGORIAS = {
  SALUD: [...],
  BIBLIA: [...],
  COMPRAS: [...],
  EMERGENCIA: [...],
  AGUA: ['agua', 'vaso', 'hidraté', 'tomé agua', 'bebí', ...]  // ← NUEVO
}
```

**Flujo `procesarComando()`:**
```
Input
  ↓ procesarLocalmente()
  ├─ EMERGENCIA → addDoc(alerts) → respuesta inmediata
  ├─ Offline → respuesta cacheada
  ├─ Guardar/buscar objeto → useMemoria
  ├─ AGUA (verbos: tomé/bebí/...) → addDoc(water_intake, {ml:250})
  └─ null → continuar a IA
  ↓ llamarIA() — 3 niveles de fallback
  ├─ Gemini 2.0 Flash (primario) — modelos: gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-flash-latest, gemini-1.5-flash-001
  ├─ OpenAI gpt-3.5-turbo (secundario, con retry exponencial)
  └─ Groq llama-3.1-8b-instant (terciario)
  ↓ Guardar en chat_history + retornar texto
```

**IMPORTANTE — Bug corregido:** La función `llamarIA()` tenía una llave `}` extra (línea 181 original) que rompía el build. Verificar que siempre cierre con exactamente un `};` a 2-space indent.

---

### useAgua.ts (NUEVO — Tomas de Agua)
**Propósito:** Registrar hidratación diaria en Firestore  
**Colección:** `usuarios/{pacienteId}/water_intake`

**Retorna:**
```typescript
{
  registrarAgua: (ml: number, registradoPor?: string) => Promise<boolean>
  consumoHoy: number        // ml consumidos hoy (0 a ~3000)
  porcentajeMeta: number    // 0-100 (meta: 2000ml/día)
  META_DIARIA_ML: 2000
  calcularConsumoHoy: () => Promise<number>
}
```

**Estructura Firestore:**
```
usuarios/{pacienteId}/water_intake/{logId}
  - ml: number              (250 | 500 | 1000)
  - registradoPor: string   ('Paciente' | 'Danay (Voz)')
  - createdAt: serverTimestamp
```

**Integración voz (useIA):** Frases como "tomé agua", "bebí un vaso" → registra 250ml automáticamente.

---

### useSalud.ts (Medicamentos)
**IMPORTANTE — Inconsistencia de colecciones:**  
`registrarSentimiento()` escribe en `bienestar` (subcol), pero `CaregiverWellness` lee de `wellbeing`. La ruta principal de registro de bienestar es via `useIA.procesarComando()` que escribe en `wellbeing` con campos `registrarSentimiento`, `nota`, `createdAt`.

**Campos esperados por CaregiverWellness:**
```
wellbeing/{docId}
  - registrarSentimiento: string  (ej: "contento", "triste", "neutral")
  - nota: string                  (texto del usuario)
  - createdAt: serverTimestamp    (campo para ordenar, NO "fecha")
```

---

### useVoz.ts (Text-to-Speech)
**Selección de voz:** Dalia (Windows/Azure) → Sabina (iOS) → Español femenino → Default  
**Config:** `es-MX`, pitch 1.1, rate 0.85  
**`vocesListas`:** true cuando las voces del OS están cargadas (asincrónico en Chrome)

---

### useEscuchar.ts (Speech Recognition)
**Config:** `continuous: false`, `interimResults: true` (para texto en vivo durante escucha)  
**Idioma adaptativo (`getSpeechLang()`):** `es-CR` solo en Chrome desktop. iOS, Android, Edge y Safari desktop → `es-ES` (los otros ASR engines rechazan es-CR con error `network`).  
**`iniciarEscucha`:** Función SÍNCRONA (no async). iOS Safari requiere que `.start()` se llame dentro del mismo call stack del user-gesture handler — cualquier `await` antes de `.start()` rompe el contexto de permiso y el micrófono falla silenciosamente.  
**`detenerEscucha`:** Sin dependencia en `escuchando` state (usa solo refs). Evita el race condition donde el usuario suelta el botón antes de que `onstart` dispare (escuchando aún es `false`).  
**`transcripcionInterim`:** Texto en vivo que llega mientras el usuario habla (vacía cuando llega el resultado final).  
**`modoOffline`:** true cuando `!navigator.onLine`. Se sincroniza via event listeners online/offline.  
**`simularVoz(texto)`:** Solo funciona en DEV con `modoOffline: true`

---

## 7. FIREBASE — ESTRUCTURA DE COLECCIONES

```
/master_medications/{medId}
  - nombre, tipo, dosaje, etc.

/usuarios/{pacienteId}/
  ├─ medications/{medId}
  │    nombre, horaToma, stockActual, cantidadPorToma,
  │    dosisDiaria, estado, alertaEnviada, creadoEn
  │
  ├─ alerts/{alertId}
  │    tipo ('emergencia'|'inventario'|'bienestar'),
  │    mensaje, nivel ('critico'|'informativo'),
  │    resuelta (bool), createdAt, atendidaEn, atendidaPor
  │
  ├─ shopping_lists/{itemId}
  │    name, qty, unit, bought, price, createdAt, addedBy
  │
  ├─ wellbeing/{docId}
  │    registrarSentimiento, nota, createdAt  ← escrito por useIA
  │
  ├─ water_intake/{logId}                      ← NUEVO (useAgua)
  │    ml, registradoPor, createdAt
  │
  ├─ chat_history/{docId}
  │    role ('user'|'model'), text, timestamp
  │
  ├─ semantic_memory/{docId}
  │    resumen, fecha
  │
  └─ lastLocation
       lat, lng, accuracy, timestamp
```

---

## 8. AUTHCONTEXT — PERFIL DE USUARIO

```typescript
interface UserProfile {
  uid: string;
  rol: 'paciente' | 'caregiver';
  usuarioNombre?: string;
  pacienteNombre?: string;
  pacienteId?: string;       // ID del paciente (lo usa el cuidador)
  familiarNombre?: string;
  familiarId?: string;
  honorifico?: string;       // "Don", "Doña", etc.
  asistenteNombre?: string;  // "Danay"
}
```

**Derivar pacienteId (patrón estándar):**
```typescript
const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;
```
Usar este patrón en TODOS los hooks y componentes. Nunca hardcodear `"paciente_principal"`.

**Dev Mode (sin Firebase Auth):**
```typescript
// AuthContext.tsx — perfil hardcodeado para pruebas
{
  uid: "dev_paciente_principal",
  rol: 'paciente',
  pacienteNombre: "Carlos",   // ⚠️ SIN el honorífico — honorifico: "Don" ya lo agrega
  pacienteId: "dev_paciente_principal",
  familiarNombre: "Ana",
  asistenteNombre: "Danay",
  honorifico: "Don"
}
```
**REGLA:** `pacienteNombre` debe contener solo el nombre propio. El honorífico va siempre en `honorifico`. Los templates usan `${honorifico} ${pacienteNombre}` → "Don Carlos". Si `pacienteNombre` fuera "Don Carlos", resultaría "Don Don Carlos".

---

## 9. BUGS CONOCIDOS Y SOLUCIONES APLICADAS

| Bug | Archivo | Solución |
|-----|---------|----------|
| Build roto — `}` extra en `llamarIA()` | `useIA.ts` | Eliminada llave duplicada (línea 181 original) |
| `esperandoConfirmacion` duplicado | `Dashboard.tsx` / `App.tsx` | Dashboard ahora recibe props desde App.tsx; no duplicar estado local |
| `alPresionarMicro` indentación rota | `Dashboard.tsx` | Reescrita con lógica limpia |
| `pacienteId` hardcodeado | `ProactiveHeart.tsx`, `CaregiverDashboard.tsx` | Ahora dinámico desde `useAuth()` |
| Fecha incorrecta en wellness | `CaregiverWellness.tsx` | Usa `reporte.createdAt \|\| reporte.fecha` |
| Props ignorados en Dashboard | `Dashboard.tsx` | Ahora acepta `DashboardProps` tipados |
| Gemini 404 — modelos 1.5 deprecados | `useIA.ts` | `GEMINI_MODELS` reducido a solo `gemini-2.0-flash` y `gemini-2.0-flash-lite` |
| Groq 400 — `llama3-8b-8192` decomisionado | `useIA.ts` | Cambiado a `llama-3.1-8b-instant` |
| Cuota Gemini quemada rápido — 4 llamadas por consulta | `useIA.ts` | Los modelos 1.5 retornaban 404 → loop continuaba → 4 llamadas/consulta. Fix: solo 2 modelos 2.0 |
| OpenAI retries inútiles en cuota agotada | `useIA.ts` | Eliminados los 3 retries con backoff exponencial — un 429 de billing no mejora esperando 2-4s |
| Fallback dev-mode solo en DEV | `useIA.ts` | `generarRespuestaDeDesarrollo` ahora se llama siempre (dev y prod) cuando todos los proveedores fallan |
| Seeding doble por React StrictMode | `AuthContext.tsx` | Añadido guard `seedingDone` ref para ejecutar `seedDevData()` solo una vez |
| StrictMode duplica efectos Firebase | `main.tsx` | Eliminado `<StrictMode>` — en apps Firebase causa doble registro de listeners y seeding duplicado |
| "Don Don Carlos" — honorífico duplicado | `AuthContext.tsx`, `seedDev.ts` | `pacienteNombre` tenía "Don Carlos" pero `honorifico` ya era "Don". Corregido a `pacienteNombre: "Carlos"` |
| Textos < 10px — ilegibles para adultos mayores | `Dashboard.tsx`, `RoleSelector.tsx`, `CaregiverDashboard.tsx`, `CaregiverMeds.tsx` | Elevados a mínimo `text-xs` (12px); instrucciones del paciente a `text-sm` (14px); etiquetas de tab nav de 8px a 11px |
| `setMapReady is not defined` — crash al abrir tab Mapa | `CaregiverMap.tsx` | `whenReady={() => setMapReady(true)}` en `MapContainer` usaba variable inexistente. Eliminada la prop — `MapController` ya maneja `invalidateSize()` |
| Error `network` en Edge — voz no funciona (Don Carlos no puede hablar) | `useEscuchar.ts` | Edge usa ASR de Microsoft que no soporta `es-CR` → lanza `network`. Fix: `getSpeechLang()` retorna `es-ES` en Edge/Safari. Además: (1) instancia se recrea tras cada error (`recognitionRef = null` en `onerror`), (2) auto-retry hasta 2 veces en error `network` transitorio vía `autoRetry` state + `useEffect` con 700ms. |
| Voz NO funciona en iOS, Android ni Windows — micrófono silencioso | `useEscuchar.ts` | Tres bugs combinados: (1) `getSpeechLang()` no detectaba iOS/Android → retornaba `es-CR` que Apple ASR y Google ASR rechazan con `network`. Fix: iOS/Android → `es-ES`. (2) `iniciarEscucha` era `async` con `await verificarConexion()` antes de `.start()` — iOS requiere que `.start()` se llame sincrónicamente en el user-gesture handler; el `await` rompía ese contexto. Fix: función ahora síncrona, check de `navigator.onLine` inline. (3) `detenerEscucha` dependía de `escuchando` state (stale closure) → si el usuario soltaba el botón antes de que `onstart` disparara, `escuchando` era `false` y `.stop()` nunca se llamaba. Fix: eliminada dependencia en `escuchando`, ahora usa solo `recognitionRef`. |
| Hold-to-talk no mostraba texto en tiempo real mientras se hablaba | `useEscuchar.ts`, `Dashboard.tsx` | `interimResults: false` → nunca se mostraba lo que el ASR estaba detectando. Fix: `interimResults: true`, nuevo estado `transcripcionInterim` para texto en vivo. Dashboard ahora muestra el texto interim en VisualBridge durante la escucha (con tipo `usuario`). |
| Loop infinito de reintentos en Edge — "(1/2)…" se repetía indefinidamente | `useEscuchar.ts` | `onstart` reseteaba `retryCountRef.current = 0` en cada intento, por lo que el contador nunca llegaba a MAX_RETRIES. Fix: (1) eliminar el reset de `onstart`; (2) `iniciarEscucha` (llamada por el usuario) sí resetea el contador; (3) nueva función `_iniciarRetry` para auto-retries que NO resetea el contador. |
| iOS — al soltar el botón no se enviaba la transcripción al asistente | `useEscuchar.ts` | iOS Safari frecuentemente omite el evento `onresult` con `isFinal:true` al llamar `.stop()`. Fix: `interimRef` rastrea el último texto interim; `onend` lo promueve a `transcripcion` final si no llegó resultado final. `detenerEscucha` ya no limpia `interimRef` para que `onend` pueda usarlo. |
| iOS — voz del asistente (TTS) silenciosa | `useVoz.ts`, `Dashboard.tsx` | iOS Safari bloquea `speechSynthesis.speak()` desde contexto asíncrono. Fix: nueva función `unlock()` que hace una llamada silenciosa a `speak()` en el primer user-gesture (`alPresionarMicro`). `hablar()` usa `setTimeout(speak, 50)` en iOS para el gap post-`cancel()`. Fallback de 1500ms para `vocesListas` porque iOS no dispara `onvoiceschanged`. |

---

## 10. PATRONES DE ARQUITECTURA

### 1. Estado compartido entre hermanos — via App.tsx
```
App.tsx (estado)
  ├─ ProactiveHeart (escribe setEsperandoConfirmacion)
  └─ Dashboard (lee esperandoConfirmacion, escribe setEsperandoConfirmacion)
```
No duplicar estados en componentes hijos cuando dos siblings necesitan el mismo estado.

### 2. pacienteId siempre dinámico
```typescript
// En hooks y componentes, SIEMPRE:
const pacienteId = profile?.rol === 'paciente' ? profile.uid : profile?.pacienteId;
// NUNCA:
const pacienteId = "paciente_principal"; // ← anti-pattern
```

### 3. Verificar `pacienteId` antes de Firestore
```typescript
if (!pacienteId) return; // o return false / return []
```

### 4. Colecciones Firestore — campo de tiempo
Usar siempre `createdAt: serverTimestamp()` como campo de tiempo en documentos nuevos. No mezclar con `fecha` (campo legacy en algunos documentos de `bienestar`).

### 5. Fallback de IA
Nunca asumir que Gemini responde. La cadena **Gemini → Groq → OpenAI → Dev rules** garantiza respuesta siempre.

**Cuotas gratuitas (referencia):**
| Proveedor | Modelo | Límite/min | Límite/día | Estado |
|-----------|--------|-----------|-----------|--------|
| Gemini | gemini-2.5-flash (primario) | 15 RPM | 1,500 RPD | ✅ Verificado |
| Gemini | gemini-2.0-flash | 15 RPM | 1,500 RPD | ✅ Verificado |
| Gemini | gemini-2.0-flash-lite | 30 RPM | 1,500 RPD | ✅ Verificado |
| Groq | llama-3.3-70b-versatile (primario) | 30 RPM | 14,400 RPD | ✅ Verificado |
| Groq | llama-3.1-8b-instant | 30 RPM | 14,400 RPD | ✅ Verificado |
| OpenAI | gpt-3.5-turbo | — | — | ❌ Sin créditos |

**IMPORTANTE:** Solicitudes fallidas (404, 429) **sí consumen cuota**. Por eso `GEMINI_MODELS` solo tiene 2 modelos — intentar modelos deprecados genera 404s que queman el límite por minuto (15 RPM) sin retornar respuesta útil.

---

## 11. CONFIGURACIÓN FIREBASE & DEPLOY

### Firebase
```
Project ID:         byurside-f671b
Auth Domain:        byurside-f671b.firebaseapp.com
Storage Bucket:     byurside-f671b.firebasestorage.app
Messaging Sender:   357066030641
App ID:             1:357066030641:web:9110b0dae3d80baec0df10
Firebase URL:       https://byurside-f671b.firebaseapp.com
```

**Rewrite rule (SPA):** Todas las rutas → `index.html`  
**Offline:** `persistentLocalCache` + `persistentMultipleTabManager`

### Vercel (deploy principal)
```
Repositorio:        https://github.com/NelSystems77/byurside.git
URL Producción:     https://byurside.vercel.app/
Build Command:      npm run build
Output Directory:   dist/
SPA Rewrites:       /(.*) → /index.html   (vercel.json)
```
Las variables de entorno (`VITE_GEMINI_API_KEY`, etc.) deben configurarse en el panel de Vercel → Settings → Environment Variables, NO en archivos `.env` commiteados.

---

## 12. VARIABLES DE ENTORNO (.env)

```bash
VITE_GEMINI_API_KEY=...
VITE_OPENAI_API_KEY=...
VITE_GROQ_API_KEY=...
VITE_OPENROUTER_API_KEY=...  # Disponible pero deshabilitado (CORS)
```
⚠️ En producción mover a `.env.local` (gitignored) o usar Cloud Functions como proxy.

---

## 13. COMANDOS DE DESARROLLO

```bash
npm run dev          # Servidor local http://localhost:5173
npm run build        # Build de producción → dist/
npm run lint         # ESLint
npm run seed-dev     # Sembrar datos de prueba en Firestore
npm run test-voice   # Probar síntesis de voz
npm run verify-hook  # Verificar ProactiveHeart
npm run test-gemini  # Verificar conexión Gemini

# Suite QA automatizada (Vitest)
npm test             # Ejecutar todos los tests una vez (83 tests)
npm run test:watch   # Modo watch para desarrollo TDD
npm run test:coverage  # Reporte de cobertura en dist/coverage/

firebase deploy      # Deploy alternativo a Firebase Hosting

# Deploy en Vercel (automático via GitHub)
# Push a main → Vercel detecta el cambio → build + deploy automático
# URL: https://byurside.vercel.app/
git push origin main
```

**Testing manual:**
- Paciente: ir a `/paciente` → hablar o escribir a Danay
- Cuidador: ir a `/familiar` → ver tabs
- Selección de rol: ir a `/` → pantalla de bienvenida
- Agua: en `/paciente` → tocar ícono 💧 → elegir cantidad
- Offline: desconectar WiFi → app sigue funcionando

---

## 14. FEATURES COMPLETADAS

✅ Pantalla de selección de rol (RoleSelector)  
✅ Vista del paciente — voz, texto, SOS  
✅ Vista del cuidador — 8 tabs (meds, compras, bienestar, biblia, GPS, stats, familia, config)  
✅ Asistente Danay — voz TTS + reconocimiento de voz es-CR  
✅ IA conversacional — Gemini 2.0 Flash + fallbacks (Groq, OpenAI, Dev rules)  
✅ Gestión de medicamentos — stock, alertas automáticas  
✅ Recordatorios proactivos — ProactiveHeart scheduler  
✅ Protocolo de emergencia — 5 min timeout → alerta Firestore  
✅ Lista de compras — por voz y manual  
✅ Registro de bienestar emocional  
✅ **Tomas de agua** — botones rápidos + voz + barra de progreso diaria ← NUEVO  
✅ Memoria de objetos — localStorage  
✅ GPS en tiempo real — mapa para cuidador  
✅ Versículos bíblicos diarios  
✅ Modo offline — PWA + Firestore caché  
✅ Alertas en tiempo real — onSnapshot para cuidador  
✅ PDF de lista de compras  

## 15. ROADMAP FUTURO

- [ ] Wearable integration (smartwatch vitals)
- [ ] Video call entre paciente y cuidador
- [ ] Multi-paciente (un cuidador con varios pacientes)
- [ ] Integración con farmacia (reposición automática)
- [ ] HIPAA compliance y audit logs
- [ ] Analytics de salud (tendencias semanales)
- [ ] Telemedicina (citas con médico)
- [ ] Autenticación real (Firebase Auth login)
- [ ] Firebase Security Rules para producción
- [ ] Code splitting (bundle actual > 1.6MB)

---

**Document Version:** 2.9 | **Updated:** May 12, 2026  
**Cambios v2.9:** Tres bugs de voz corregidos: (1) Loop infinito en Edge — `onstart` reseteaba `retryCountRef` causando que los reintentos nunca acumularan; separada función `_iniciarRetry` para auto-retries vs `iniciarEscucha` para starts frescos del usuario. (2) iOS — al soltar el botón la transcripción no llegaba al asistente porque iOS Safari omite `onresult` final después de `.stop()`; `interimRef` preserva el texto interim y `onend` lo promueve a final. (3) iOS — TTS silencioso porque `speak()` llamado desde contexto async es bloqueado; nueva función `unlock()` en `useVoz` llamada desde `alPresionarMicro` (user-gesture), más delay de 50ms post-`cancel()` en iOS y fallback timeout de 1500ms para `vocesListas`. 83/83 tests pasando.  
**Cambios v2.8:** Fix crítico de voz multiplataforma en `useEscuchar.ts` — tres bugs combinados que causaban que el micrófono no funcionara en iOS, Android ni Windows: (1) `getSpeechLang()` ahora retorna `es-ES` para iOS y Android (Apple/Google ASR rechazan `es-CR` con error `network`); (2) `iniciarEscucha` convertida a función síncrona — iOS Safari requiere que `.start()` se llame en el mismo call stack del user-gesture handler (el `await verificarConexion()` anterior rompía ese contexto); (3) `detenerEscucha` reescrita sin dependencia en `escuchando` state para evitar stale closure — antes, si el usuario soltaba el botón antes de que `onstart` disparara, `.stop()` nunca se llamaba. También: `interimResults: true` + nuevo estado `transcripcionInterim` para mostrar texto en vivo durante la escucha. Dashboard actualizado: VisualBridge muestra texto interim durante escucha, `onTouchCancel`/`onMouseLeave` añadidos al botón micrófono. 83/83 tests pasando.  
**Cambios v2.7:** Bug de voz corregido en `useEscuchar.ts` — Edge lanzaba `error network` porque Microsoft ASR no soporta `es-CR`. Fix: `getSpeechLang()` retorna `es-ES` en Edge/Safari. También: instancia de Recognition siempre se recrea tras error (eliminando instancias rotas), y auto-retry hasta 2 veces en error de red transitorio via `autoRetry` state + `useEffect`.  
**Cambios v2.6:** Bug `setMapReady is not defined` corregido en `CaregiverMap.tsx` — eliminada prop `whenReady` que referenciaba variable inexistente; `MapController` ya maneja `invalidateSize()`. Bug documentado en §9.  
**Cambios v2.5:** Repositorio subido a GitHub (https://github.com/NelSystems77/byurside.git). Deploy principal migrado a Vercel (https://byurside.vercel.app/) con `vercel.json` (buildCommand, outputDirectory, SPA rewrites). Variables de entorno ahora deben configurarse en el panel de Vercel. `vercel.json` añadido a §3 (estructura). §11 actualizado con sección Vercel. §13 actualizado: `git push origin main` como comando de deploy principal (Vercel CI/CD automático).  
**Cambios v2.4:** Suite QA completa implementada con Vitest + React Testing Library (83 tests, 9 archivos, 100% passing). Dependencias añadidas: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`. Configuración de tests en `vite.config.ts` (`test.environment: jsdom`, `setupFiles`). Archivos de prueba en `src/test/`: setup.ts (mocks globales), useMemoria, useVoz, useEscuchar, useAgua, useSalud, useIA, RoleSelector, VisualBridge, Dashboard. Scripts añadidos al `package.json`: `test`, `test:watch`, `test:coverage`. Regla §0 de mantenimiento de CLAUDE.md añadida.  
**Cambios v2.3:** Bug "Don Don Carlos" corregido (`pacienteNombre` sin honorífico en AuthContext + seedDev), textos mínimos elevados para accesibilidad adulto mayor (text-[8px]/[9px] → text-xs/text-sm en Dashboard, RoleSelector, CaregiverDashboard, CaregiverMeds), regla documentada en §8.  
**Cambios v2.2:** Fallback de IA reordenado (Groq antes de OpenAI), GEMINI_MODELS reducido a 2 modelos 2.0, eliminado StrictMode, seeding protegido contra duplicados, cuotas de API documentadas.  
**Cambios v2.1:** Routing actualizado (RoleSelector), useAgua hook, bugs corregidos, pacienteId dinámico en todos los componentes, patrones de arquitectura documentados.

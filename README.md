# Xendra — concepto 2

Primera versión funcional de la web-experiencia de **Xendra**, banda de pop-rock de
Navarra: un mapa 2D explorable de la isla de Uharte, controlado por un caracol,
que da acceso a la música, los conciertos, el grupo, la historia, el merch, el
archivo, las notas del público y el contacto.

La web es completamente navegable también desde un menú convencional, sin necesidad
de jugar: cada sección tiene su propia ruta y puede abrirse directamente.

## Instalar y ejecutar

Requiere Node.js 20+ y npm.

```bash
npm install
npm run dev
```

Abre la URL que indique Vite (por defecto `http://localhost:5173`).

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente. |
| `npm run build` | Type-check (`tsc -b`) + build estático de producción en `dist/`. |
| `npm run preview` | Sirve el build de `dist/` localmente para comprobarlo. |
| `npm run lint` | ESLint sobre todo el proyecto. |
| `npm run typecheck` | Comprobación de tipos sin generar salida. |
| `npm run test` | Suite de tests (Vitest + Testing Library). |

## Arquitectura general

- **Vite + React + TypeScript** controla la aplicación: rutas, paneles, HUD, menú,
  formularios y accesibilidad.
- **Phaser 4** controla únicamente el mundo del mapa: el caracol, la cámara, las
  colisiones, las zonas de proximidad y los efectos ambientales.
- Ambas capas se comunican mediante un **bridge de eventos tipado** en
  [`src/game/bridge/gameEvents.ts`](src/game/bridge/gameEvents.ts) (`TypedEventBus`),
  sin variables globales. React nunca vuelve a crear la instancia de Phaser en cada
  render: se monta una única vez en [`PhaserGame.tsx`](src/game/PhaserGame.tsx).
- **React Router** (`HashRouter`) gestiona rutas del tipo `#/musica`, compatibles con
  hosting estático. El mapa y el menú convencional resuelven contra la misma tabla
  ([`src/app/routes.ts`](src/app/routes.ts)), así que nunca pueden abrir contenidos
  distintos para el mismo destino.
- **CSS Modules** + variables globales en [`src/styles/tokens.css`](src/styles/tokens.css)
  para la paleta, tipografía, espaciado y motion. No se usa Tailwind.
- **Contenido**: todo el texto editable vive tipado en
  [`src/content/xendraContent.ts`](src/content/xendraContent.ts). Ningún componente
  contiene strings de contenido embebidos.
- **Persistencia**: solo `localStorage`, con claves versionadas `xendra:v1:*` y lectura
  segura ante datos corruptos (ver [`src/lib/storage.ts`](src/lib/storage.ts)).

### Estructura de carpetas

```text
src/
├── app/            shell de React: rutas, layout del mapa, providers (settings, progreso, bridge)
├── components/     UI compartida (Panel modal/lateral, EmptyState, LiveRegion, foco...)
├── content/        contenido tipado + geometría del mundo (xendraContent.ts, mapGeometry.ts)
├── features/
│   ├── intro/      pantalla de entrada
│   ├── navigation/ HUD, menú convencional, controles táctiles
│   ├── panels/     un componente de contenido por sección (música, conciertos, grupo...)
│   ├── audio/      reproductor global único, silenciado por defecto
│   └── publicNotes/ notas del público (repositorio + panel)
├── game/
│   ├── config/     configuración de Phaser.Game
│   ├── scenes/     MapScene (única escena)
│   ├── entities/   Snail (placeholder)
│   ├── systems/    proximidad, ambiente
│   ├── bridge/     TypedEventBus Phaser ↔ React
│   └── utils/      geometría (colisiones, normalización de movimiento), texturas placeholder
├── lib/            storage seguro, analítica no-op, hook de reduced-motion
└── styles/         tokens.css (paleta/tipografía) + global.css
```

## Desplegar como sitio estático

`npm run build` genera `dist/` como sitio 100 % estático (sin servidor obligatorio).
Puede servirse desde cualquier hosting estático (Netlify, Vercel, GitHub Pages, S3...).
Al usar rutas con hash (`#/musica`), **no hace falta configurar reescritura de rutas
en el servidor**: cualquier ruta profunda funciona tras recargar, porque siempre se
sirve `index.html` y React Router resuelve el hash en el cliente.

## Dónde cambiar contenido

Todo el contenido editorial (nombres, biografías, canciones, conciertos, merch,
historia, contacto...) está en un único archivo tipado:

➡️ [`src/content/xendraContent.ts`](src/content/xendraContent.ts)

Ver también [`docs/CONTENT.md`](docs/CONTENT.md) para la lista completa de
`TODO_CONTENT` pendientes de rellenar con datos reales.

## Dónde colocar el mapa y el sprite del caracol

- Mapa aprobado: `public/assets/map/xendra-map-approved.png` (ya incluido).
- Sprite del caracol: placeholder generado por código (`src/game/utils/placeholderTextures.ts`);
  ver [`docs/ASSETS.md`](docs/ASSETS.md) para el formato exacto del futuro spritesheet.

## Limitaciones actuales

- El mapa es una única imagen ilustrada (no por capas todavía). La arquitectura ya
  está preparada para pasar a capas — ver la sección correspondiente en
  [`docs/ASSETS.md`](docs/ASSETS.md).
- El caracol y los marcadores de los 8 destinos son **placeholders vectoriales**
  generados por código, no arte final.
- Las colisiones (orilla del río, edificios) están **aproximadas a mano** sobre la
  imagen actual del mapa; conviene ajustarlas cuando el mapa final por capas esté
  disponible.
- El "clic para moverse" usa un acercamiento simple al punto transitable más cercano,
  no pathfinding completo (ver comentario en `clampTargetToWalkable`, en
  `src/game/utils/geometry.ts`).
- No existen datos reales de la banda (integrantes, conciertos, canciones, fotos,
  email de contacto...): todo son `TODO_CONTENT` explícitos y visualmente honestos
  (empty states, en vez de datos inventados).
- El contacto no tiene backend: solo abre un `mailto:` una vez el email de contacto
  esté confirmado; hasta entonces, el formulario valida pero no finge un envío.
- Las notas del público solo se guardan en `localStorage` de quien las escribe; no
  son realmente públicas todavía (ver `PublicNotesRepository`, ya preparado para un
  backend futuro).
- El bundle de producción incluye Phaser en el chunk principal (~450 KB gzip);
  dividirlo en un chunk cargado de forma diferida sería una buena mejora futura de
  rendimiento, fuera del alcance de esta primera versión.

# Assets

Tabla de referencia para sustituir cada asset placeholder por el arte final.

| Asset | Path | Dimensiones recomendadas | Formato | Transparencia | Punto de anclaje | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| Mapa completo | `public/assets/map/xendra-map-base-v7-4k.webp` | 2560×1440 o superior (múltiplo de 16:9) | WebP/PNG | No | Esquina superior izquierda (0,0) | **Final** (dirección visual aprobada) |
| Mapa de repuesto | `public/assets/map/placeholder-map.svg` | 2560×1440 (vector, escala libre) | SVG | No | (0,0) | Placeholder — solo se usa si falta el PNG anterior |
| Sprite del caracol (4 direcciones) | generado en código: `src/game/utils/placeholderTextures.ts` | 128×128 por fotograma, 4–6 fotogramas por dirección | PNG/WebP con alpha | Sí | Centro del pie del caracol, igual en todos los fotogramas | Placeholder (vectorial, generado en runtime) |
| Marcador de destino (no visitado / visitado) | generado en código | 18×18 aprox. | — | Sí | Centro del landmark | Placeholder |
| Retratos de integrantes | `public/assets/members/*.jpg` (referenciado por `member.photoPath`) | 4:5 (recortado con `object-fit: cover`), zuri-beltzean | JPG | No | — | **Final** |
| Portada del disco | `public/assets/music/bihia-azala.jpg` (referenciado por `album.coverPath`) | 1:1 | JPG | No | — | **Final** |
| Fotos de merch | `public/assets/merch/kamiseta-naturala.jpg`, `kamiseta-urdina.jpg` (referenciado por `merch[].imagePath`) | 1:1 (recortado con `object-fit: cover`) | JPG | No | — | **Final** |
| Argazkiak (artxiboa) | `public/assets/media/photo-*.jpg` (referenciado por `media[].thumbnailPath`/`fullPath`) | 4:3 (miniatura recortada con `object-fit: cover`) | JPG | No | — | **Final** |
| Bideoak (artxiboa) | `public/assets/media/video-*.mp4` + `video-*-poster.jpg` (referenciado por `media[].fullPath`/`thumbnailPath`) | H.264 MP4, poster 4:3 | MP4/JPG | No | — | **Final** |
| Logotipo (wordmark) | `public/assets/brand/xendra-logo.svg` | 454×88 (vector, escala libre) | SVG | Sí | — | **Final** |
| Logotipo crema (pantalla de inicio) | `public/assets/brand/xendra-logo-cream.svg` | 454×88 (vector, escala libre) | SVG | Sí | — | **Final** (mismo trazado, relleno `#D7C6AF`) |
| Papel kraft de la pantalla de inicio | `public/assets/brand/intro-paper.jpg` | 920×1024 (se estira con `cover`) | JPG | No | — | **Final** (textura del Figma *xendra-mundua*, nodo 10:20, ya multiplicada sobre `#F3EAE1`) |
| Favicon | `public/favicon.svg` | vector | SVG | Sí | — | Placeholder de marca |

## Cómo reemplazar el mapa

1. Sustituye el archivo `public/assets/map/xendra-map-base-v7-4k.webp` manteniendo el
   mismo nombre y relación de aspecto 16:9 (o ajusta `WORLD_WIDTH`/`WORLD_HEIGHT` en
   `src/content/mapGeometry.ts` si cambia la proporción).
2. Si el nuevo mapa mueve la posición de algún destino, actualiza
   `LANDMARK_POSITIONS` en `src/content/mapGeometry.ts` (coordenadas en el "mundo
   virtual" de 2560×1440, no en píxeles de la imagen original).
3. Si cambian las zonas navegables (orilla, edificios), actualiza `ISLAND_POLYGON`,
   `OBSTACLE_RECTS` y `OBSTACLE_CIRCLES` en el mismo archivo.
4. Si el archivo no existe, la app usa automáticamente `placeholder-map.svg` y
   muestra un aviso discreto **solo en desarrollo** (`DevWarningBanner`) indicando la
   ruta exacta esperada. Nunca bloquea la aplicación ni genera un asset falso.

## Cómo reemplazar el sprite del caracol

El caracol actual es 100 % vectorial: sus formas y colores viven en
`src/game/utils/snailArt.ts` y `generateSnailTextures()`
(`src/game/utils/placeholderTextures.ts`) las dibuja produciendo 4 texturas
(`snail-down`, `snail-up`, `snail-left`, `snail-right`). La entidad `Snail`
(`src/game/entities/Snail.ts`) solo conoce esos 4 nombres de textura y cambia entre
ellos según la dirección de movimiento; nunca dibuja el caracol directamente.

Para sustituirlo por un spritesheet real:

1. Añade el spritesheet en `public/assets/characters/snail/` (fotogramas de
   128×128, fondo transparente, mismo centro/punto de apoyo en todos ellos).
2. En el `preload()` de `MapScene`, sustituye la llamada a
   `generateSnailTextures(this)` por `this.load.spritesheet(...)` + la creación de
   animaciones (`this.anims.create(...)`) para cada dirección
   (`snail-down`, `snail-up`, `snail-left`, `snail-right`, y variantes de caminar si
   se desea, por ejemplo `snail-walk-down`).
3. No hace falta tocar `Snail.ts` si mantienes los mismos nombres de textura/anim;
   si añades animaciones de fotogramas, cambia `setTexture` por `play()` en
   `updateFacing()`.
4. La pantalla de inicio dibuja el mismo caracol en SVG a partir de `snailArt.ts`
   (`src/features/intro/IntroSnail.tsx`, pose `right`), para que el que nace del
   huevo sea exactamente el que luego se controla. Al cambiar el caracol, sustituye
   ahí `SnailBody`/`SnailFeelers` por el nuevo arte (manteniendo la concha dentro
   del huevo y las antenas en su propio grupo, que es lo que se anima).

Restricciones del diseño del caracol (ver prompt maestro): exactamente dos antenas
largas y dos tentáculos cortos, nunca cuatro antenas iguales; silueta reconocible;
mismo centro y punto de apoyo en todos los fotogramas.

## Por qué preparar el mapa por capas (aunque no se use todavía)

El mapa actual es una única imagen. La arquitectura ya prevé una futura versión por
capas para cuando el arte final esté lista:

```text
terrain             (fondo, no interactivo)
water               (animable de forma independiente: brillo, olas)
paths               (caminos, no interactivo)
landmarks-back      (partes de un edificio detrás del personaje)
landmarks-front     (partes de un edificio delante del personaje, para oclusión)
vegetation          (árboles, arbustos y juncos — ya implementado como sprites
                      independientes, ver más abajo)
ambient-effects     (hojas, humo, luces — ya implementado como sprites/partículas
                      independientes de la imagen del mapa, ver src/game/systems/ambient.ts)
```

Separar en capas permitirá:

- **Oclusión real**: que el caracol pase "detrás" de un edificio o árbol grande sin
  necesidad de recalcular profundidad manualmente.
- **Profundidad**: ordenar por Y de forma más precisa combinando capas con
  fragmentos de escena en vez de una sola imagen plana.
- **Animación**: animar solo `water` o `vegetation-front` sin recomponer el resto
  del mapa.
- **Colisiones separadas del arte**: las colisiones (`ISLAND_POLYGON`,
  `OBSTACLE_RECTS`, `OBSTACLE_CIRCLES`) ya viven en `src/content/mapGeometry.ts`,
  completamente separadas de la imagen. Esto significa que el mapa por capas puede
  sustituirse sin tocar ninguna lógica de movimiento o colisión, solo habrá que
  reajustar las coordenadas si cambia la composición.

## Vegetación

Cipreses, árboles redondos, arbustos y juncos son sprites independientes, no parte
del mapa: el caracol pasa por detrás o por delante según su punto de apoyo, los
troncos bloquean el paso y todo se inclina con las ráfagas de viento.

- **Dibujo**: `src/game/utils/vegetationArt.ts` (formas planas con sombra y luz,
  como la referencia del mapa), generado a 2x en texturas potencia de dos.
- **Posiciones y tamaños**: `src/content/vegetationConfig.ts` (`VEGETATION`), sacadas
  de la referencia del mapa (misma composición, x1.28) y comprobadas contra el mapa
  real (hierba para árboles, orilla para juncos). `VEGETATION_KIND_SCALE` ajusta el
  tamaño de cada tipo.
- **Sustituir por PNG**: si se quieren ilustraciones propias, basta con cargar un PNG
  por tipo con la misma clave (`vegetation-cypress`… ver `vegetationTextureKey`) en vez
  de generarlo, manteniendo el punto de apoyo de `VEGETATION_FRAMES`.

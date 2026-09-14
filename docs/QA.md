# QA manual

Checklist para comprobar antes de dar por buena una versión. Automatizado
(`npm run lint && npm run typecheck && npm run test && npm run build`) más esta
pasada manual.

## Controles

- [ ] Flechas y WASD mueven al caracol en las 8 direcciones.
- [ ] Las diagonales no son más rápidas que el movimiento en eje (vector
      normalizado — cubierto también por test unitario en `geometry.test.ts`).
- [ ] Clic sobre el mapa mueve al caracol hacia el punto pulsado, sin atravesar
      el río ni los edificios.
- [ ] `E` / `Enter` interactúan con el destino más cercano cuando hay uno en rango.
- [ ] `Escape` cierra el panel o el menú abiertos.
- [ ] En móvil: el joystick virtual (abajo a la izquierda) mueve al caracol; el
      botón "Interactuar" (indicador de proximidad) funciona con el pulgar.

## Responsive

- [ ] Escritorio grande: el mapa ocupa toda la pantalla, se ve una zona amplia de
      la isla.
- [ ] Portátil/tablet: el panel y los controles siguen siendo usables.
- [ ] Móvil vertical: la cámara se acerca más, el joystick y el botón de
      interacción están en zonas alcanzables con el pulgar, los paneles ocupan casi
      toda la pantalla.
- [ ] Redimensionar la ventana no deforma el mapa (Scale.FIT + `autoCenter`) ni
      pierde el estado del caracol.

## Accesibilidad

- [ ] Navegación completa solo con teclado (Tab a través del menú convencional y de
      cada panel; el foco nunca desaparece).
- [ ] Cada panel: `role="dialog"` + `aria-modal` + `aria-labelledby`, foco atrapado
      dentro, foco devuelto al control anterior al cerrar.
- [ ] Región `aria-live="polite"` anuncia proximidad y descubrimiento de destinos
      sin ser invasiva (no se dispara en cada frame, solo al cambiar de destino).
- [ ] Contraste de texto suficiente sobre `--color-bg` / `--color-surface`.
- [ ] `prefers-reduced-motion: reduce` (SO) y el toggle adicional de movimiento
      reducen o eliminan: partículas de hojas/lluvia, parpadeo de la hoguera,
      pulso del anillo de proximidad, animaciones CSS de paneles/skip-link.
- [ ] El menú convencional da acceso a las 9 secciones sin necesidad de mover al
      caracol.

## Contenido y estados vacíos

- [ ] Conciertos sin datos reales → empty state cuidado, ninguna fecha inventada.
- [ ] Archivo (fotos/vídeos) sin datos reales → empty state, ningún placeholder de
      stock.
- [ ] `TODO_CONFIRM_ALBUM_TITLE` visible en el panel de música y en el código.
- [ ] Formulario de contacto: valida campos, y si `contact.email` es `null` no
      permite "enviar" nada ni finge un envío (test cubierto en
      `ContactPanel.test.tsx`).
- [ ] Notas del público: se guardan y leen de `localStorage`, con validación de
      longitud; nunca se presentan como públicas.

## Rendimiento y fallbacks

- [ ] Si falta `public/assets/map/xendra-map-base.png`, la app sigue
      funcionando con el mapa de repuesto (`placeholder-map.svg`) y muestra un
      aviso solo en desarrollo.
- [ ] Sin archivos de audio reales, la interfaz no genera peticiones repetidas ni
      errores de consola (los reproductores solo intentan cargar un `src` cuando
      existe una URL real en el contenido).
- [ ] Pestaña oculta → Phaser pausa su bucle (comportamiento por defecto de
      `pauseOnBlur`); las notas locales y el progreso no se corrompen al volver.
- [ ] Recargar la página estando dentro de una ruta de contenido (p. ej. `#/musica`)
      carga el mapa en segundo plano y abre directamente ese panel.
- [ ] Ruta desconocida (`#/algo-que-no-existe`) muestra un panel de "ruta
      desconocida" con enlace de vuelta al mapa, no una pantalla en blanco.

## Consola

- [ ] Sin errores ni warnings inesperados en consola durante una sesión típica
      (entrada, exploración de los 8 destinos, apertura de cada panel, cierre).

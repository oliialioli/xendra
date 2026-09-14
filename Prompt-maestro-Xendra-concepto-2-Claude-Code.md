# Prompt maestro para Claude Code — Web de Xendra, concepto 2

> Copia desde **INICIO DEL PROMPT** hasta **FIN DEL PROMPT** en Claude Code. Adjunta también el mapa conceptual cuando esté aprobado.

---

## INICIO DEL PROMPT

Quiero que actúes como un equipo senior formado por product designer, director/a de arte digital, desarrollador/a frontend y desarrollador/a de videojuegos 2D. Debes construir una primera versión completa, sólida, escalable y funcional de la web de la banda **Xendra**.

No quiero únicamente un plan, un wireframe o una demo estática. Inspecciona el entorno, crea el proyecto, implementa la experiencia, ejecútala, comprueba que funciona y corrige los errores que encuentres. Al terminar, deja documentación clara para sustituir contenido y assets sin tocar la lógica.

### 0. Seguridad del proyecto

- Antes de escribir nada, inspecciona el directorio actual.
- Si no estás ya dentro de una carpeta creada expresamente para este proyecto, crea una carpeta nueva llamada `xendra-concepto-2` y trabaja dentro de ella.
- No sobrescribas, elimines ni reorganices ningún proyecto o archivo existente.
- No uses comandos destructivos.
- Si ya existe `xendra-concepto-2`, inspecciona su contenido y conserva todo lo que no sea claramente reemplazable.
- Si encuentras cambios del usuario, no los descartes.

## 1. Contexto de marca y narrativa

**Xendra** es una banda de Navarra formada por siete integrantes. Su estilo es pop-rock y combina:

- violín;
- violonchelo;
- batería;
- guitarra acústica;
- guitarra eléctrica;
- bajo;
- piano.

El nombre **Xendra** procede de una palabra antigua del euskera navarro relacionada con un camino, una senda o un atajo. Esta idea de avanzar, descubrir y recorrer debe sentirse en la experiencia sin explicarla constantemente.

El símbolo asociado a su primer disco es un **caracol**. El caracol será el personaje que controla la persona visitante.

El disco tiene ocho canciones y sus letras utilizan metáforas vinculadas a la naturaleza. Los cuatro elementos —agua, tierra, viento y fuego— deben formar parte de la atmósfera:

- agua: el río Arga que rodea la isla y la lluvia ocasional;
- tierra: caminos, piedra, vegetación y una pequeña montaña;
- viento: hojas que se desplazan y movimiento suave de árboles y hierba;
- fuego: una hoguera relacionada con la historia del grupo.

Hay una inconsistencia pendiente en el material de partida entre los nombres `Bia` y `Bihia`. Centraliza el nombre del disco en un único campo de contenido llamado `albumTitle`, usa provisionalmente **Bihia** y deja un comentario visible `TODO_CONFIRM_ALBUM_TITLE`. No dupliques este texto por componentes.

No inventes nombres de integrantes, fechas de conciertos, letras, títulos de canciones, precios, enlaces, fotografías ni datos de contacto. Cuando no exista información real, utiliza contenido provisional corto y claramente identificado en el código mediante `TODO_CONTENT`, manteniendo la interfaz visualmente creíble.

## 2. Concepto de experiencia

La web será una **experiencia de exploración 2D**: un mapa amplio visto desde arriba, con una ligera inclinación que permita ver fachadas y tejados. No debe ser isométrico rígido, pixel art ni un videojuego complejo con puntuación, enemigos o misiones. Es una web cultural y musical que utiliza la exploración como sistema de navegación.

El mapa representa una pequeña isla inspirada en **Uharte**, completamente rodeada por el **río Arga**. El caracol se mueve libremente y descubre distintos espacios. Al aproximarse a un punto interactivo aparece una indicación discreta; al activarlo se abre contenido web accesible en un panel o modal sobre el mapa.

La experiencia debe ser:

- intuitiva aunque la persona no juegue habitualmente;
- poética, cercana y ligeramente mágica;
- contemporánea y con personalidad navarra, sin caer en folclore literal;
- limpia y no demasiado cargada;
- divertida de explorar, pero eficaz para encontrar música, conciertos o contacto;
- completamente navegable también desde un menú convencional.

## 3. Dirección de arte

### Estilo principal

- La referencia no es un paisaje realista: es un **mapa gráfico dibujado**.
- Ilustración editorial vectorial extremadamente sintética, con una ligera irregularidad manual.
- Grandes superficies de color plano y mucho espacio vacío.
- Aproximadamente un 70 % del mapa debe ser terreno, agua o caminos tranquilos; solo un 30 % debe contener hitos y vegetación.
- Formas orgánicas simples, bordes ligeramente imperfectos y alguna línea fina dibujada a mano.
- Edificios construidos con muy pocos polígonos y únicamente los rasgos necesarios para reconocerlos.
- Árboles convertidos en símbolos: conos, óvalos, círculos o trazos simples, colocados de forma aislada.
- Sombras planas, geométricas y todas en una única dirección. No uses iluminación realista.
- Textura de papel casi imperceptible. No añadas textura para simular materiales.
- Debe sentirse autoral y con personalidad, no como clip-art ni como concept art genérico de videojuego.
- Nada de tejas individuales, ventanas detalladas, piedras una a una, flores, bancos repetidos, farolas, jardines o vegetación densa.
- Nada de acabado pictórico, acuarela, volumen 3D, reflejos, brillos, gradientes ambientales ni realismo.

### Paleta provisional

Centralízala en variables CSS y haz que sea muy fácil modificarla:

- crema cálido y arena para caminos y fondos;
- verdes musgo y salvia para vegetación;
- azul verdoso desaturado para el Arga;
- terracota y burdeos apagado para tejados y pequeños acentos;
- carbón suave para texto y contornos;
- coral gastado y mostaza en detalles;
- amarillo más vivo únicamente para el buzón y alguna señal interactiva puntual.

Limita el mapa a entre seis y ocho colores mate. Evita neones, gradientes, variaciones realistas dentro de una misma superficie, sombras de interfaz genéricas, estética infantil y aspecto de render 3D. La interfaz debe acompañar al mundo ilustrado sin competir con él.

### Tipografía

- Usa una sans serif contemporánea, humana y muy legible para interfaz y textos.
- Centraliza `--font-ui` y `--font-display` para poder reemplazarlas.
- No dependas de una fuente remota para que la aplicación funcione.
- Mantén buena legibilidad en español, incluidos acentos y caracteres de euskera.

## 4. Arquitectura técnica

Usa una arquitectura separada entre motor de exploración y contenido editorial:

- **Vite + React + TypeScript**, usando versiones estables actuales compatibles.
- **Phaser 4.x** para el mapa, cámara, físicas ligeras, input y animaciones. Si durante la instalación compruebas mediante documentación oficial o tipos del paquete que una API necesaria ha cambiado, adáptate a la versión instalada; no copies APIs antiguas de Phaser 3 sin verificar.
- React debe controlar la aplicación, la navegación, los paneles, los formularios y la accesibilidad.
- Phaser debe controlar únicamente el mundo del mapa, el caracol, las zonas de proximidad, la cámara y los efectos ambientales.
- Integra ambas capas mediante un puente de eventos tipado y pequeño. Evita referencias globales descontroladas.
- Usa React Router con rutas basadas en hash, o una solución equivalente compatible con hosting estático, para que cada sección pueda abrirse con una URL directa.
- Usa CSS Modules o una estructura CSS por capas con variables globales. No añadas Tailwind salvo que el proyecto ya lo utilice.
- Evita dependencias innecesarias. Para estado global, utiliza Context + reducer o un store pequeño solo si aporta claridad real.
- Añade ESLint, formateo consistente, tests unitarios y scripts de comprobación.

La web debe poder desplegarse como sitio estático. No implementes un servidor obligatorio en esta fase.

## 5. Organización sugerida

Puedes mejorar esta organización si mantienes la misma separación de responsabilidades:

```text
xendra-concepto-2/
├── public/
│   └── assets/
│       ├── map/
│       ├── characters/snail/
│       ├── landmarks/
│       ├── ambient/
│       ├── music/
│       └── media/
├── src/
│   ├── app/
│   ├── components/
│   ├── content/
│   │   └── xendraContent.ts
│   ├── features/
│   │   ├── intro/
│   │   ├── navigation/
│   │   ├── panels/
│   │   ├── audio/
│   │   └── publicNotes/
│   ├── game/
│   │   ├── config/
│   │   ├── scenes/
│   │   ├── entities/
│   │   ├── systems/
│   │   ├── bridge/
│   │   └── utils/
│   ├── styles/
│   ├── types/
│   └── main.tsx
├── docs/
│   ├── ASSETS.md
│   ├── CONTENT.md
│   └── QA.md
└── README.md
```

## 6. Sistema de contenido

Todo el contenido editable debe vivir en uno o varios archivos tipados dentro de `src/content`, nunca repartido como strings por los componentes.

Define tipos para:

- datos generales de la banda;
- disco y canciones;
- integrantes e instrumentos;
- conciertos;
- productos de merch;
- hitos de historia;
- fotografías y vídeos;
- notas públicas;
- datos y enlaces de contacto;
- configuración de cada punto del mapa.

Cada punto interactivo debe incluir como mínimo:

```ts
type Landmark = {
  id: LandmarkId;
  route: string;
  title: string;
  shortLabel: string;
  description: string;
  position: { x: number; y: number };
  interactionRadius: number;
  visited: boolean;
};
```

No guardes `visited` dentro del contenido estático si resulta más limpio gestionarlo en estado. La intención es que la configuración visual, la ruta y el contenido estén relacionados mediante un ID tipado único.

## 7. Mapa y distribución

Configura un mundo virtual estable, por ejemplo de `2560 × 1440`, independiente del tamaño real de la imagen. Guarda todas las posiciones, polígonos de colisión y zonas de interacción en configuración, no dentro de escenas enormes con números mágicos.

El mapa debe mostrar:

- la isla completa rodeada por agua;
- caminos orgánicos y plazas conectadas;
- espacio suficiente para desplazarse;
- orillas con piedra, vegetación y juncos;
- una pequeña montaña o colina;
- varios árboles y bancos, sin saturar;
- dos puentes discretos si encajan en la composición;
- los ocho destinos principales descritos abajo.

Distribución orientativa del primer mapa conceptual:

- zona superior izquierda: vías y tren Irati;
- zona superior central: pequeño escenario;
- zona superior derecha: colina y escuela de música;
- centro: fuente circular y plaza principal;
- lateral derecho: frontón;
- zona inferior derecha: buzón amarillo;
- zona inferior central: tablón de anuncios;
- zona inferior izquierda: hoguera y área de historia;
- lateral izquierdo, cerca de la plaza: kiosco de merch.

La distribución es editable; conviértela en datos. No incrustes puntos clicables basándote solo en porcentajes CSS sobre una imagen.

### Asset inicial del mapa

El archivo visual aprobado se añadirá en:

```text
public/assets/map/xendra-map-approved.png
```

Si todavía no existe:

- no bloquees la aplicación;
- crea un placeholder SVG muy sencillo con río, isla, caminos y volúmenes de los ocho lugares;
- muestra en desarrollo un aviso discreto indicando el path exacto esperado;
- documenta cómo reemplazarlo;
- no generes falsos assets finales ni uses fotografías de stock.

El mapa conceptual inicial será una sola imagen, pero prepara la arquitectura para una futura versión por capas:

```text
terrain
water
paths
landmarks-back
landmarks-front
vegetation-back
vegetation-front
ambient-effects
```

No es necesario separar esas capas ahora. Documenta por qué serán útiles para oclusión, profundidad, animación y colisiones.

## 8. Personaje principal: caracol

El caracol debe sentirse pequeño respecto al mapa, pero siempre localizable.

Controles:

- teclado: flechas o WASD;
- permitir diagonales reales combinando teclas, normalizando el vector para que no corra más rápido;
- ratón: opción de clic para desplazarse hacia un punto transitable;
- táctil: joystick virtual discreto o control equivalente más botón de interacción;
- interacción: `E`, `Enter`, clic en la indicación o botón táctil;
- `Escape`: cerrar panel o menú.

Estados previstos del sprite:

- quieto hacia abajo, arriba, izquierda y derecha;
- caminando hacia abajo, arriba, izquierda y derecha;
- de 4 a 6 fotogramas por dirección;
- animación opcional breve al descubrir un lugar;
- fotogramas de `128 × 128 px`;
- fondo transparente;
- mismo centro y punto de apoyo;
- silueta reconocible;
- exactamente dos antenas largas y dos tentáculos cortos si son visibles; nunca cuatro antenas iguales.

En esta primera implementación no existe todavía el sprite final. Crea un placeholder vectorial muy simple y claramente sustituible, sin intentar convertirlo en la ilustración definitiva. Implementa desde el principio un atlas/configuración que permita cambiarlo por spritesheet sin reescribir la entidad.

## 9. Cámara, movimiento y colisiones

- La cámara debe mostrar una parte amplia de la isla en desktop y seguir al caracol con un movimiento muy suave.
- En pantallas pequeñas debe acercarse lo suficiente para mantener legible al personaje.
- Define límites de cámara y mundo.
- Evita que el caracol entre en el río, atraviese edificios, árboles grandes, la fuente, el escenario o el frontón.
- Mantén caminos y claros como zonas transitables.
- Separa colisiones estáticas, zonas interactivas y elementos decorativos.
- Si implementas clic para mover, respeta obstáculos. Si un sistema de pathfinding completo resulta excesivo, limita el destino al punto transitable más cercano y documenta la mejora futura; no permitas atravesar edificios.
- El personaje debe aparecer en una plaza o camino despejado, nunca encima de un punto interactivo.
- Ordena visualmente personaje y objetos según coordenada Y cuando sea necesario para simular profundidad.

## 10. Los ocho destinos interactivos

### 1. Kiosco → Merch

- Al aproximarse, el vendedor saluda: **«Aupa, egun on!»**.
- Confirma después el texto exacto con contenido editable.
- Al interactuar abre el panel de merch.
- El panel muestra productos provisionales en cards, pero no inventa precios ni disponibilidad.
- Prepara CTAs configurables para futura tienda externa.

### 2. Pequeño escenario → Conciertos

- Las luces se encienden gradualmente cuando el caracol se aproxima.
- Puede sonar un pequeño ambiente únicamente si el usuario ya ha activado el sonido.
- Al interactuar abre próximos conciertos.
- Cada concierto admite ciudad, sala, fecha, hora, estado y enlace de entradas.
- Si no hay conciertos reales, muestra un empty state cuidado, no fechas inventadas.

### 3. Escuela de música → Música y disco

- Abre la información del disco y sus ocho canciones.
- Incluye un reproductor accesible preparado para previews o temas completos.
- No reproduzcas audio automáticamente.
- Permite una portada, duración, créditos y enlaces externos configurables.
- Usa provisionalmente `albumTitle: "Bihia"` con `TODO_CONFIRM_ALBUM_TITLE`.

### 4. Fuente circular → El grupo

- En el mapa puede haber figuras sentadas alrededor, muy simplificadas.
- El panel presenta a los siete integrantes.
- Asigna los siete instrumentos conocidos como contenido provisional, sin inventar los nombres.
- Admite fotografía, nombre, pronombres o rol, instrumento y texto breve.

### 5. Vías, tren Irati y hoguera → Historia de Xendra

- Las vías y el tren forman la señal visual principal de esta zona.
- La hoguera representa el lugar donde se cuenta la trayectoria del grupo.
- Al aproximarse puede haber un movimiento breve del tren, humo muy sutil o luz del fuego.
- El panel presenta una línea temporal accesible, editable y responsive.
- Relaciona la metáfora del camino con el origen del nombre Xendra sin convertirlo en un bloque de texto excesivo.

### 6. Tablón de anuncios → Fotografías y vídeos

- Abre un archivo visual con filtros simples para fotos y vídeos.
- Usa lazy loading y miniaturas optimizadas.
- El visor ampliado debe funcionar con teclado y lector de pantalla.
- No inventes fotografías reales: usa placeholders neutros claramente identificados.

### 7. Puerta del frontón → Notas del público

- Permite leer y escribir mensajes breves que parecen notas colgadas.
- En esta fase, guarda las nuevas notas únicamente en `localStorage` y explícalo en documentación.
- Diseña un `PublicNotesRepository` o interfaz equivalente para poder conectar más adelante una API o base de datos.
- No simules que las notas locales son públicas ni las envíes a ningún servicio externo.
- Incluye nombre opcional, mensaje, fecha local y validación.
- Añade límites de longitud, sanitización y estados de error.

### 8. Buzón amarillo → Contacto y contratación

- Debe ser reconocible y funcionar como acento visual.
- El panel incluye contacto general y contratación.
- Campos: nombre, email, motivo, mensaje y consentimiento si finalmente se almacenan datos.
- Como no hay backend, usa un modo configurable: enlace de email o adaptador de endpoint futuro.
- No declares enviado un formulario si realmente no se ha enviado.
- Añade enlaces sociales como campos configurables, no como URLs inventadas.

## 11. Interacción y feedback

- Cuando el caracol entra en el radio de un destino, resalta el lugar de forma sutil.
- Muestra una etiqueta corta y una indicación de interacción.
- Si hay varios destinos cerca, prioriza el más próximo.
- Al abrir un panel, pausa o bloquea el movimiento del caracol.
- Al cerrar, devuelve el foco al control anterior y reanuda la escena.
- Marca los lugares visitados con un cambio pequeño, como una luz, una hoja, una nota o un punto en el menú.
- Guarda el progreso de lugares visitados en `localStorage`.
- No conviertas la visita en una lista de logros infantil.

## 12. Interfaz web

### Entrada

Crea una pantalla de entrada ligera con:

- espacio para el logo de Xendra;
- una frase corta provisional relacionada con recorrer o descubrir;
- botón principal `Entrar en la isla`;
- acceso secundario `Ver menú` para quien no quiera jugar;
- indicación breve de controles, que no bloquee la entrada;
- opción de sonido desactivada por defecto.

No reproduzcas audio antes de una interacción consciente.

### HUD

Debe ser mínimo:

- logo o símbolo;
- botón de menú;
- sonido on/off;
- ayuda de controles;
- indicador discreto de lugar cercano;
- botón de interacción en móvil.

### Paneles

- Usa un sistema común de panel/modal con variantes, no ocho implementaciones distintas.
- En desktop puede entrar lateralmente o abrirse como ventana editorial amplia.
- En móvil ocupa casi toda la pantalla.
- Incluye cierre visible, `Escape`, gestión del foco, `aria-labelledby` y scroll interno correcto.
- El mapa permanece visible detrás cuando el rendimiento lo permita.
- Las transiciones son orgánicas y breves.

### Menú convencional

Todas las secciones deben poder abrirse sin mover el caracol:

- Inicio / Mapa;
- Música;
- Conciertos;
- El grupo;
- Historia;
- Merch;
- Fotos y vídeos;
- Notas;
- Contacto.

El menú y los puntos del mapa deben abrir exactamente los mismos componentes y rutas.

## 13. Rutas sugeridas

Usa rutas compatibles con hosting estático:

```text
#/mapa
#/musica
#/conciertos
#/grupo
#/historia
#/merch
#/archivo
#/notas
#/contacto
```

Abrir o cerrar un panel debe actualizar la ruta sin reiniciar la escena del mapa. Entrar directamente en una ruta debe cargar el mapa en segundo plano y abrir el contenido correspondiente.

## 14. Atmósfera y motion

Implementa efectos ligeros y desacoplados:

- agua con movimiento muy sutil;
- algunas hojas arrastradas por el viento;
- árboles o hierba con oscilación lenta;
- llama de la hoguera;
- luces del escenario activadas por proximidad;
- lluvia ocasional muy breve, nunca constante;
- tren con una animación ambiental puntual;
- pequeñas ondas cerca de la orilla.

Reglas:

- no hagas que todos los elementos se muevan a la vez;
- usa pools para partículas repetidas;
- reduce o elimina efectos si `prefers-reduced-motion` está activo;
- pausa efectos cuando la pestaña no está visible;
- evita filtros caros y grandes capas de blur;
- permite desactivar sonido y motion adicional;
- ningún efecto debe impedir leer o interactuar.

## 15. Audio

Prepara un sistema de audio, aunque los archivos definitivos no existan:

- música o ambiente general opcional;
- sonidos suaves por destino;
- previews del disco;
- control de volumen y mute persistente;
- pausa adecuada al cambiar de pista;
- un único reproductor global para evitar audios superpuestos.

El sonido empieza desactivado y solo se activa tras una acción del usuario. Si faltan archivos, la interfaz debe seguir funcionando sin errores ni peticiones 404 repetidas.

## 16. Responsive

### Desktop

- La experiencia principal es un mapa a pantalla completa.
- Muestra una zona amplia para conservar sensación de isla.
- Controles de teclado y ratón.

### Tablet

- Ajusta zoom y tamaño de panel.
- Mantén accesibles controles táctiles y puntero.

### Móvil

- Cámara más próxima siguiendo al caracol.
- Joystick o control táctil sencillo en zona inferior izquierda.
- Botón de interacción en inferior derecha.
- Menú y paneles a pantalla casi completa.
- Áreas táctiles mínimas de 44 px.
- Respeta safe areas.
- Permite entrar directamente al menú si la exploración resulta incómoda.

El canvas debe redimensionarse sin deformar el mapa ni perder el estado.

## 17. Accesibilidad

La web no puede depender exclusivamente del canvas.

- Todo el contenido tiene equivalente HTML semántico.
- El menú convencional da acceso a todas las secciones.
- Navegación completa con teclado.
- Focus visible.
- Contraste suficiente.
- Alt text configurable para imágenes reales.
- Labels y errores asociados en formularios.
- Modales con focus trap y restauración del foco.
- Avisos de proximidad no invasivos para lectores de pantalla mediante una región `aria-live` moderada.
- Respeta `prefers-reduced-motion`.
- Evita parpadeos rápidos.
- No ocultes contenido SEO y accesible mediante técnicas engañosas.

## 18. Rendimiento

- Carga inicial progresiva con una pantalla breve coherente con la marca.
- Comprime mapas y fotografías; soporta WebP/AVIF cuando sea útil.
- Lazy load para contenido no visible.
- No cargues todas las canciones o vídeos al iniciar.
- Destruye listeners y recursos cuando corresponda.
- Evita recrear la instancia de Phaser por cada render de React.
- Pausa el loop cuando la pestaña esté oculta si es seguro.
- Incluye fallback visual si WebGL no está disponible.
- Evita layout shifts en paneles e imágenes.

## 19. SEO y metadatos

- `lang="es"`.
- Título y descripción centralizados.
- Open Graph y favicon configurables.
- Estructura semántica para información de banda, disco, conciertos y contacto.
- Datos estructurados solo cuando existan datos reales; no inventes eventos.
- Incluye una descripción HTML útil incluso antes de entrar al mapa.

## 20. Persistencia y backend futuro

Usa `localStorage` únicamente para:

- sonido y volumen;
- preferencia de movimiento reducido adicional;
- destinos visitados;
- notas del público creadas localmente durante el prototipo;
- si la persona ya vio la ayuda inicial.

Versiona las claves, por ejemplo `xendra:v1:*`, y maneja datos corruptos sin romper la aplicación.

Define adaptadores claros para conectar más adelante:

- CMS o JSON remoto;
- agenda de conciertos;
- tienda;
- envío de contacto;
- notas públicas moderadas;
- analítica.

No añadas ningún proveedor real ni claves de entorno sin indicación.

## 21. Analítica futura

Prepara una interfaz opcional sin proveedor:

```ts
type AnalyticsEvent =
  | { type: 'landmark_discovered'; landmarkId: LandmarkId }
  | { type: 'panel_opened'; landmarkId: LandmarkId; source: 'map' | 'menu' | 'direct' }
  | { type: 'audio_played'; trackId: string }
  | { type: 'contact_started' };
```

Por defecto debe ser un no-op. No instales trackers ni cookies.

## 22. Estados que deben estar resueltos

- carga inicial;
- asset de mapa no encontrado;
- audio no disponible;
- sección sin contenido real;
- sin próximos conciertos;
- error de formulario;
- guardado local correcto o fallido;
- pantalla estrecha;
- WebGL no disponible;
- modo sin movimiento;
- ruta desconocida;
- imagen o vídeo no disponible.

## 23. Tests y validación

Configura y ejecuta:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Añade tests al menos para:

- IDs y rutas únicas de los destinos;
- correspondencia entre destino, ruta y panel;
- normalización del movimiento diagonal;
- lectura segura de `localStorage` corrupto;
- progreso de lugares visitados;
- validación de notas;
- apertura y cierre accesible de paneles;
- contenido vacío de conciertos;
- formulario de contacto sin backend.

Haz también QA manual en:

- desktop grande;
- portátil;
- móvil vertical;
- navegación solo con teclado;
- `prefers-reduced-motion`;
- recarga estando dentro de una ruta de contenido;
- mapa ausente y audio ausente.

Si dispones de navegador automatizado, abre la aplicación, recorre los ocho destinos o simula sus eventos, comprueba los paneles y corrige cualquier error visible o de consola.

## 24. Documentación obligatoria

### `README.md`

Debe incluir:

- objetivo del proyecto;
- cómo instalar y ejecutar;
- scripts;
- arquitectura general;
- cómo desplegar estáticamente;
- dónde cambiar contenido;
- dónde colocar el mapa y el spritesheet;
- limitaciones actuales.

### `docs/ASSETS.md`

Debe incluir una tabla con:

- asset;
- path;
- dimensiones recomendadas;
- formato;
- si necesita transparencia;
- punto de anclaje;
- estado: placeholder o final.

Incluye como mínimo:

```text
mapa conceptual/completo: 2560 × 1440 o superior, WebP/PNG
sprite caracol: frames de 128 × 128, PNG/WebP con alpha
retratos integrantes: relación 4:5
portada disco: 1:1
miniaturas archivo: 4:3 o 16:9
```

Explica cómo evolucionar de un mapa plano a capas y cómo mantener las colisiones separadas del arte.

### `docs/CONTENT.md`

Lista todos los `TODO_CONTENT`, incluido:

- confirmar `Bia` o `Bihia`;
- nombre y bio de los siete integrantes;
- correspondencia definitiva de instrumentos;
- ocho canciones;
- conciertos;
- merch;
- historia;
- galería;
- email y contratación;
- enlaces sociales;
- saludo exacto del kiosco.

### `docs/QA.md`

Checklist manual de controles, responsive, accesibilidad, rendimiento, contenido y fallbacks.

## 25. Criterios de aceptación

No consideres terminada la tarea hasta que:

1. La aplicación arranque sin errores.
2. El mapa ocupe la experiencia principal.
3. El caracol se mueva en ocho direcciones mediante teclado.
4. Exista control usable en móvil.
5. El personaje no pueda entrar en agua o edificios.
6. Los ocho lugares se detecten por proximidad.
7. Los ocho paneles puedan abrirse desde el mapa y desde el menú.
8. Las rutas directas funcionen tras recargar en hosting estático.
9. El escenario reaccione a proximidad.
10. Existan efectos sutiles de agua, viento, tierra/follaje y fuego.
11. El sonido esté desactivado por defecto.
12. Los lugares visitados persistan.
13. Las notas locales funcionen sin fingir publicación real.
14. El contacto no finja envíos.
15. El contenido esté centralizado y tipado.
16. El mapa y el personaje puedan sustituirse sin reescribir la lógica.
17. La experiencia sea accesible sin utilizar el canvas.
18. `lint`, `typecheck`, `test` y `build` finalicen correctamente.
19. No se hayan inventado datos reales de la banda.
20. No se haya sobrescrito ningún trabajo existente.

## 26. Orden de implementación

Trabaja en este orden y verifica cada bloque antes de continuar:

1. inspección segura y creación del proyecto;
2. estructura, tipos, contenido y tokens visuales;
3. shell de React, entrada, rutas, menú y panel base;
4. instancia única de Phaser y puente de eventos;
5. mapa/placeholder, cámara y responsive;
6. movimiento del caracol y colisiones;
7. zonas de proximidad y los ocho destinos;
8. contenido de cada panel y rutas profundas;
9. controles táctiles;
10. persistencia;
11. efectos ambientales y audio preparado;
12. accesibilidad;
13. tests, build y QA;
14. documentación.

No te detengas después de generar el scaffolding. Si aparece un problema técnico, diagnostícalo y resuélvelo dentro del alcance. Usa placeholders honestos cuando falte material real.

## 27. Entrega final

Al finalizar, responde con:

- resumen breve de lo construido;
- ruta exacta del proyecto;
- comandos para abrirlo;
- resultado de `lint`, `typecheck`, `test` y `build`;
- lista de los assets y contenidos que tengo que aportar;
- decisiones técnicas importantes;
- limitaciones o mejoras siguientes realmente relevantes.

No pegues todos los archivos en la respuesta final; déjalos creados y señala los principales.

## FIN DEL PROMPT

---

## Prompt visual actualizado para el mapa minimalista

Las referencias visuales aportadas deben utilizarse solo para extraer estos principios: mapas editoriales muy claros, grandes masas de color, edificios geométricos, vegetación simbólica, sombras planas, paleta reducida y muchísimo espacio negativo. No se deben copiar sus composiciones, textos, logotipos ni edificios.

Este es el prompt corregido para generar el mapa antes de crear edificios o sprites por separado:

```text
Use case: stylized-concept
Asset type: art-direction map for a 2D interactive band website

Input images: use the supplied images only as visual-language references. Take from them the clarity of an illustrated map, large flat color fields, extreme restraint, sparse objects, simplified architecture, geometric vegetation, long flat shadows, organic paths and generous negative space. Do not copy their layouts, labels, logos, buildings or identifiable content.

Primary request: Design a complete minimal illustrated map for Xendra, a seven-member pop-rock band from Navarra. It represents Uharte as a small irregular green island fully surrounded by the Arga river. The map will become the navigable world of an interactive website controlled by a tiny snail, but do not draw the snail yet.

Scene and required locations: Show the full island and river in one frame. Inside, use a few wide pale organic paths connecting exactly these eight destinations: a very small kiosk; a minimal outdoor stage; a simplified music school; a circular fountain in a central open plaza; one short railway line with a tiny historic Irati-style train visually connected to a small campfire area; a simple bulletin board; a recognizable but extremely simplified pelota frontón wall and entrance; and one bright yellow postbox. Also include one low hill, a few reeds, and only a sparse handful of trees and bushes. Every object should earn its place. Leave most of the terrain open.

Style/medium: highly simplified editorial vector map with subtle hand-drawn irregularity. Flat matte shapes, intentionally reduced geometry, soft imperfect curves, occasional thin hand-drawn line and almost no internal detail. Buildings are graphic symbols made from a few polygons, not architectural illustrations. Trees are simple cones, ovals, circles or single-line symbols. Water is one calm flat color with at most a few minimal curved strokes. Ground uses broad abstract patches rather than realistic grass. The result should feel authored and artistic, not like generic game concept art or clip-art.

Visual density: extremely minimal. Use roughly 70 percent calm open surfaces and 30 percent landmarks, paths and vegetation. Use isolated objects rather than dense clusters. No decorative filler. No flowerbeds, roof tiles, stone-by-stone walls, detailed windows, repeated benches, lamp posts, crowds, realistic foliage or micro-textures.

Composition/framing: 16:9 landscape. Full island visible with an uninterrupted band of river around every edge. High oblique top-down view, between a flat illustrated map and a very gentle isometric view. No horizon. The fountain is a small central anchor, not a grand monument. Landmarks are distributed with substantial breathing room and connected by legible paths. Keep wide traversable areas for a small player character. Use one coherent perspective while allowing slight hand-drawn imperfection.

Lighting/depth: no realistic lighting. Create depth only with restrained flat geometric shadows in one consistent direction. No volumetric light, reflections, gradients, highlights or realistic material rendering.

Color palette: a reduced palette of 6–8 matte colors: warm oatmeal, pale muted green, one darker forest green, dusty blue-grey, soft cream, muted terracotta or coral, charcoal-brown and one mustard-yellow accent. Low contrast overall. Make landmarks readable through silhouette rather than detail.

Constraints: no text, labels, numbers, map key, logo, title, UI, player character or watermark. Do not create an infographic legend. Keep all eight destinations present but highly synthesized. Maintain large negative spaces. Every landmark needs a distinct silhouette. The island must read as Uharte surrounded by a river, not as a tropical or fantasy island.

Avoid: realism, semi-realism, detailed indie-game environment art, painterly surfaces, watercolor, photorealism, 3D rendering, miniature diorama, elaborate isometric city, individual roof tiles, detailed masonry, lush vegetation, gardens, flowers, many props, cinematic lighting, atmospheric haze, fantasy styling, children's-book cuteness, thick cartoon outlines, pixel art, text, logos and watermarks.
```

## Observaciones para la siguiente iteración del mapa

Antes de producir el resto de assets, conviene validar estas cinco cuestiones en la imagen:

1. si todavía sobra algún detalle o elemento decorativo;
2. si la isla se percibe como Uharte y no como una isla fantástica genérica;
3. si los ocho destinos se entienden a primera vista;
4. si los caminos dejan espacio real para que el caracol se mueva;
5. si la perspectiva sirve para separar después edificios, vegetación y elementos frontales en capas.

Las variantes anteriores, más realistas y recargadas, quedan descartadas como dirección visual.

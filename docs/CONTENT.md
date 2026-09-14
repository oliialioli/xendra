# Contenido pendiente (`TODO_CONTENT`)

Todo el contenido editorial vive en
[`src/content/xendraContent.ts`](../src/content/xendraContent.ts), tipado por
[`src/types/content.ts`](../src/types/content.ts). Esta lista recoge cada dato
provisional que hay que sustituir por información real, y dónde encontrarlo en el
código.

## Prioritario

- [ ] **Confirmar `Bia` vs `Bihia`** — campo único `album.albumTitle` en
      `xendraContent.ts` (buscar `TODO_CONFIRM_ALBUM_TITLE`). No está duplicado en
      ningún componente: cambiar solo este valor.
- [ ] **Saludo exacto del kiosco** — actualmente `«Aupa, egun on!»` provisional.
      Campo `kiosk.greetingTodo` en `xendraContent.ts`, usado en `MerchPanel.tsx`.
- [ ] **Email de contacto/contratación** — campo `contact.email` (actualmente
      `null`). Mientras sea `null`, el formulario de contacto valida pero no
      permite "enviar" nada (no finge un envío).

## Integrantes (7)

Array `members` en `xendraContent.ts`. Para cada uno: `name`, `pronouns`,
`bio`, y opcionalmente `photoPath` (ver `docs/ASSETS.md`). El `instrument` de
cada uno ya está asignado según los 7 instrumentos conocidos de la banda (violín,
violonchelo, batería, guitarra acústica, guitarra eléctrica, bajo, piano) — solo
falta el nombre y la biografía real de cada persona.

## Disco y canciones (8)

Array `album.tracks` en `xendraContent.ts`. Para cada una de las 8 canciones:
`title`, `durationLabel`, y opcionalmente `previewUrl`/`fullTrackUrl`. También
`album.coverPath` y `album.credits`.

## Conciertos

Array `concerts` (actualmente vacío → se muestra un empty state cuidado, nunca
fechas inventadas). Al añadir conciertos reales, cada uno admite: `city`, `venue`,
`date`, `time`, `status` (`upcoming` / `soldOut` / `cancelled` / `past`) y
`ticketsUrl`.

## Merch

Array `merch` en `xendraContent.ts`: nombre, imagen, precio y modo de CTA
(`externalLink` a una tienda futura, o `comingSoon`).

## Historia

Array `history` en `xendraContent.ts`: hitos con `year`, `title`, `description`.
Relacionado con el origen etimológico de "Xendra" (`band.originText`), que también
está pendiente de verificar con el grupo.

## Galería (fotos y vídeos)

Array `media` (actualmente vacío → empty state, nunca fotos de stock). Cada
elemento: `kind` (`photo`/`video`), `thumbnailPath`, `fullPath`, `altText`.

## Contacto y redes

- `contact.email` (ver arriba).
- `contact.socialLinks`: array vacío por ahora — añadir enlaces reales, nunca URLs
  inventadas.
- `contact.reasons`: motivos de contacto, ya definidos (contratación, prensa,
  otro) — ajustar si hace falta.

## Notas de implementación

- Ningún nombre de integrante, fecha de concierto, letra, título de canción,
  precio, enlace o dato de contacto ha sido inventado: todo lo que falta está
  marcado explícitamente con `TODO_CONTENT` (o `TODO_CONFIRM_ALBUM_TITLE` para el
  caso del título del disco).
- Al rellenar contenido real, mantén los tipos de `src/types/content.ts` — el
  build (`npm run typecheck`) fallará si falta o sobra algún campo.

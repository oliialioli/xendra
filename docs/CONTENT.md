# Contenido pendiente (`TODO_CONTENT`)

Todo el contenido editorial vive en
[`src/content/xendraContent.ts`](../src/content/xendraContent.ts), tipado por
[`src/types/content.ts`](../src/types/content.ts). Esta lista recoge cada dato
provisional que hay que sustituir por información real, y dónde encontrarlo en el
código.

## Prioritario

- [x] **`Bia` vs `Bihia`** — confirmado como "Bihia" (badok.eus y Apple Music).
      `album.albumTitle` en `xendraContent.ts`.
- [ ] **Saludo exacto del kiosco** — actualmente `«Aupa, egun on!»` provisional.
      Campo `kiosk.greetingTodo` en `xendraContent.ts`, usado en `MerchPanel.tsx`.
- [ ] **Email de contacto/contratación** — campo `contact.email` (actualmente
      `null`). Mientras sea `null`, el formulario de contacto valida pero no
      permite "enviar" nada (no finge un envío).

## Integrantes (7)

Array `members` en `xendraContent.ts`. Nombres, instrumentos y `photoPath` ya
son reales (fuente: la propia banda). Falta: `pronouns` y `bio` (biografía
breve) de cada persona.

## Disco y canciones (8)

Array `album.tracks` en `xendraContent.ts`. Títulos ya son reales (fuente:
badok.eus). Falta: `durationLabel` de cada canción (no aparece publicado en
badok.eus ni Apple Music) y opcionalmente `previewUrl`/`fullTrackUrl`.
`album.coverPath` (portada) también sigue pendiente.

## Conciertos

Array `concerts` en `xendraContent.ts`: 2 hurrengo kontzertu eta 15 iraganeko
kontzertu erreal, taldeak berak emandakoak. `venue` hutsik dago leku askotan
(taldeak herriaren izena bakarrik eman zuen, aretoarena ez); `time` eta
`ticketsUrl` ere hutsik daude oraindik. Kontzertu bakoitzak: `city`, `venue`,
`date`, `time`, `status` (`upcoming` / `soldOut` / `cancelled` / `past`) eta
`ticketsUrl`.

## Merch

Array `merch` en `xendraContent.ts`: nombre, imagen, precio y modo de CTA
(`externalLink` a una tienda futura, o `comingSoon`).

## Historia

Array `history` en `xendraContent.ts`: hitos con `year`, `title`, `description`.
Relacionado con el origen etimológico de "Xendra" (`band.originText`), que también
está pendiente de verificar con el grupo.

## Galería (fotos y vídeos)

Array `media` en `xendraContent.ts`: 19 fotos + 3 vídeos reales (zuri-beltzean
las de `members/`; en color las de `media/`), fuente: la propia banda. Cada
elemento: `kind` (`photo`/`video`), `thumbnailPath`, `fullPath`, `altText`.
Los vídeos originales (varios GB, 4K) se comprimieron con `avconvert`
(`PresetAppleM4VWiFi`) antes de publicarlos; los originales sin comprimir
quedan en `source-photos/` (fuera del repo, ver `.gitignore`).

## Contacto y redes

- `contact.email` (ver arriba).
- `contact.socialLinks`: array vacío por ahora — añadir enlaces reales, nunca URLs
  inventadas.
- `contact.reasons`: motivos de contacto, ya definidos (contratación, prensa,
  otro) — ajustar si hace falta.

## Notas de implementación

- Ningún nombre de integrante, fecha de concierto, letra, título de canción,
  precio, enlace o dato de contacto ha sido inventado: todo lo que falta está
  marcado explícitamente con `TODO_CONTENT`.
- Al rellenar contenido real, mantén los tipos de `src/types/content.ts` — el
  build (`npm run typecheck`) fallará si falta o sobra algún campo.

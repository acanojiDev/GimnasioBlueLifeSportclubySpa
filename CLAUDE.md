# BlueLife Sportclub & Spa (Coín, Málaga)

La guía general de webs de presentación se carga desde `~/.claude/CLAUDE.md`. Aquí solo va lo específico de este cliente.

## Negocio

- Club deportivo en la parte alta del Centro Comercial La Trocha, 29100 Coín: más de 4.000 m² en tres plantas.
- Gimnasio con maquinaria Life Fitness, más de 80 clases a la semana (pilates, yoga, spinning, Infinity Cross, Jumping Fitness, Strong by Zumba, TRX, Power, AquaFit), piscina climatizada con escuela de natación desde bebés y spa (sauna, vapor, hammam, iglú de hielo, jacuzzi, camas de burbujas).
- Los socios entran gratis a Thermae Spa. Hay 5 pistas de pádel en la azotea, con reserva en Playtomic (`playtomic.com/clubs/bluelife-padel`).
- Contacto: WhatsApp 661 62 17 55 (otro número en directorios: 951 31 52 24), `info@bluelife.es`, Instagram `@bluelifesportclub`, Facebook `bluelifesportclubandspa`.
- `bluelife.es` bloquea las peticiones automáticas (403): los datos salen de directorios.

## Identidad

- Concepto: "Entrena. Nada. Descansa." El hero es el fondo de una piscina en WebGL puro (`src/water.js`): cáusticas, azulejos, línea de calle y ondas con el cursor.
- Paleta: azul hondo `#04213F`, azul `#0B5FE0`, cian `#4FD6E8`, azulejo `#EEF4F8`, arena `#F1E9DD` (spa).
- Tipografía: Unbounded (títulos) e Instrument Sans (texto).

## Pendiente

- **Las fotos de `public/img/` están generadas con IA** (ElevenLabs, en `fotos-originales/ia-*.png`): no son del club. Hay que cambiarlas por fotos reales antes de publicar la web definitiva.
- Falta el logo oficial; ahora la marca es el texto "BlueLife".
- Datos a confirmar: cuota "desde 32 €/mes" anual (una reseña habla de 39 €), pase de día 10 €, horario (L–V 7:00–22:30, S 9:00–21:00, D 9:00–14:00; otro directorio dice que entre semana cierran a las 23:00) y número de pistas de pádel (5, aunque una fuente dice 4).

## Publicación

- GitHub Actions está bloqueado por la facturación de la cuenta: se publica compilando en local y subiendo `dist/` más `.nojekyll` a la rama `gh-pages` (ver la guía global).
- Todavía no se ha publicado: el usuario tiene que confirmarlo.

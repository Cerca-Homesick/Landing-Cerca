# CERCA · Plan de medición y conversión

**Estado:** propuesta para que Marcelo la apruebe (2026-11-10). No se ha implementado nada de este plan.
**Alcance:** la landing publicada (cercahomesick.com, rama `main`, formulario de Tally `GeKvlz`).

## Objetivo

Saber qué hace la gente en la página y por qué no se registra, para subir la conversión (visitas → registros confirmados en Tally). Concretamente:

1. **Mapa de calor y grabaciones:** dónde tocan, hasta dónde bajan y en qué se quedan viendo, en teléfono y en escritorio.
2. **Embudo:** visita → ve cada escena → toca un botón → abre el formulario → lo envía. Con el idioma y la campaña de origen (UTM).
3. **Datos del registro:** país y ciudad aproximados (sin guardar la IP), idioma, de qué botón vino, y la aceptación del aviso de privacidad.
4. **Botón fácil de encontrar:** que nadie dude dónde tocar para registrarse.
5. **Rendimiento:** medir la velocidad real en los teléfonos de la gente (Web Vitals), no solo con Lighthouse.

## Reglas que no cambian

- **Nada sin permiso.** Las grabaciones, el mapa de calor y cualquier cookie de análisis solo se encienden si la persona acepta. Rechazar es igual de fácil que aceptar. Hay visitantes en Italia, así que aplica el RGPD; en México, la LFPDPPP.
- **Ubicación aproximada, nunca exacta.** Solo país, región y ciudad deducidos de la conexión, y la IP no se guarda. Nunca se pide el permiso de ubicación del navegador.
- **Las grabaciones tapan todo lo que se escribe.** Correos y nombres nunca quedan grabados.
- **Un clic no es un registro.** Solo cuenta como registro el evento `Tally.FormSubmitted`, o la vuelta con `?registro=confirmado`.
- **No se inventan datos.** Nada de contadores de gente registrada, testimonios ni fechas de lanzamiento.

---

## Fase 0 · Decisiones de Marcelo (antes de programar)

| # | Decisión | Recomendación |
|---|---|---|
| D1 | Herramienta de análisis | **PostHog (servidor en la UE)**: en una sola herramienta tiene eventos, embudos, mapa de calor, grabaciones y pruebas A/B. El plan gratis es amplio (1 M de eventos y 5,000 grabaciones al mes). Alternativa: **Microsoft Clarity**, gratis e ilimitado y con buenos mapas de calor, pero sin embudos serios ni A/B; se podría combinar con Plausible. |
| D2 | Responsable de los datos para el aviso de privacidad | El nombre o la razón social, un correo de contacto y el país. Sin esto no se puede publicar el aviso. |
| D3 | Campos del formulario de Tally | Dejar **nombre y correo** obligatorios. Cumpleaños, opcional o eliminado. Plataforma: «¿Usas Android? Te avisamos si llega», opcional. Agregar la casilla obligatoria de aviso de privacidad. Corregir «wishlist» → «waitlist» e «IOS» → «iOS», y poner el formulario en español (la página está en español). |
| D4 | ¿Preguntar «¿en qué ciudad está tu persona?»? | Sí, opcional: es el dato más valioso para CERCA (qué parejas de ciudades hay). |
| D5 | Cloudflare | El sitio pasa por Cloudflare antes de llegar a Vercel. Activar en Cloudflare la regla «Add visitor location headers» (gratis) para tener país y ciudad reales. Si no, Vercel vería la ubicación de Cloudflare, no la de la persona. |

---

## Fase 1 · Consentimiento y aviso de privacidad (1 día)

- **Banner propio, bilingüe y ligero**, sin depender de terceros. Tiene dos botones del mismo tamaño, «Aceptar» y «Rechazar», más un enlace al aviso.
  - En el teléfono va abajo y no tapa el botón de registro.
  - La decisión se guarda en `localStorage` con fecha y versión del aviso.
  - En el pie hay un enlace «Preferencias de privacidad» para cambiarla.
- **Página de aviso de privacidad** en `/privacidad` (ES) y `/en/privacy` (EN). Dice:
  - qué se recoge y para qué: lista de espera y mejora de la página;
  - las herramientas que se usan: Tally, PostHog y Supabase o Sheets;
  - cuánto tiempo se guarda;
  - cómo pedir que se borren los datos.

  Contenido según D2.
- **Sin consentimiento:** solo se cuentan visitas de forma agregada y sin cookies, en el modo sin cookies de PostHog. No hay grabaciones ni mapa de calor.
- **Pruebas E2E:**
  - antes de aceptar no se carga ningún script de análisis;
  - al rechazar sigue sin cargarse;
  - al aceptar se carga;
  - la decisión se recuerda;
  - el banner no tapa el botón de registro a 320 px.

## Fase 2 · Base de medición y embudo (1 día)

- Conectar PostHog al `track()` que ya existe en `src/analytics.ts`. Hoy ya dispara `waitlist_cta_click` (con `location`), `waitlist_signup_confirmed`, `letter_side_change` y `album_day_open`.
- **Eventos nuevos:**
  - `scene_view` (hero, día, carta, sello, distancia, llegada, álbum, final), cuando cada escena entra en pantalla;
  - `form_loaded` y `form_abandoned` (se cerró el formulario sin enviarlo, con el tiempo que estuvo abierto);
  - `lang_change`;
  - `web_vitals` (LCP, INP y CLS de visitas reales).
- Cada evento lleva idioma, tipo de dispositivo y UTM. No lleva el correo ni ningún otro dato personal.
- **Embudo en PostHog:** visita → `scene_view` hero → `waitlist_cta_click` → `form_loaded` → `waitlist_signup_confirmed`, separado por botón (`header`, `hero`, `seal`, `final`), por idioma y por teléfono o escritorio.
- **Pruebas E2E:** cada evento se dispara una sola vez, con sus datos y sin información personal.

## Fase 3 · Mapa de calor y grabaciones (½ día)

- Encender el mapa de calor (toques, scroll y toques en elementos que no hacen nada) y las grabaciones en PostHog, **solo con consentimiento**.
- **Enmascarado:**
  - todo campo de texto se tapa;
  - el iframe de Tally no se graba (PostHog no ve dentro de un iframe de otro dominio, y así se queda).
- **Qué se busca primero:**
  - toques en cosas que no hacen nada, como el sobre, las estampillas o la paloma; gente que intenta registrarse ahí;
  - toques repetidos con frustración;
  - hasta qué escena llega la mayoría;
  - cuánto tardan en encontrar el botón.
- Un tablero en PostHog: «Landing · semana», con el embudo, el scroll por escena, los toques en elementos que no responden y los Web Vitals.

## Fase 4 · Datos del registro: ubicación, origen y aceptación (1 día)

El formulario vive en Tally, así que los datos se mandan como **campos ocultos** de Tally, rellenados desde la URL del iframe. Tally los guarda junto al registro y los pasa a Supabase y Sheets.

- **Función `/api/geo` en Vercel:**
  - Lee el país, la región y la ciudad de las cabeceras de Cloudflare (D5) y los devuelve.
  - No guarda la IP ni nada más.
  - Sin datos, devuelve vacío y el formulario funciona igual.
- **Al abrir el formulario**, la URL del iframe agrega `country`, `region`, `city`, `lang`, `cta` (qué botón), `utm_source`, `utm_medium`, `utm_campaign` y `ref`.
- **En Tally** (lo configura Marcelo, con guía paso a paso):
  - crear esos campos ocultos;
  - la casilla obligatoria «Acepto el aviso de privacidad» con el enlace;
  - los cambios de D3 y D4.
- **En Supabase:** verificar que lleguen las columnas nuevas. Agregarlas a la tabla si la integración no las crea sola.
- **Pruebas E2E:** el iframe se abre con los parámetros correctos; sin `/api/geo` se abre igual. Prueba de la función con cabeceras simuladas.

## Fase 5 · Un botón que nadie se pierde (1–2 días)

**Diagnóstico.** El botón principal es una píldora oscura «Acércame» sobre fondo azul. Tiene dos problemas:

1. «Acércame» es poético, pero no dice qué pasa al tocarlo.
2. En el teléfono, el sobre y la paloma son lo más llamativo de la pantalla, y la gente puede intentar tocarlos a ellos. La Fase 3 lo va a confirmar o descartar con datos.

**Cambios propuestos** (dentro del sistema de diseño de CERCA, sin cambiar la paleta):

- **Texto que dice la acción:**
  - «Acércame» pasa a ser el título;
  - el botón dice **«Unirme a la lista de espera»** con una flecha;
  - debajo, la nota ya existente «Lista de espera de la app para iPhone, en desarrollo».

  Se mide con una prueba A/B si el tráfico alcanza; si no, se compara antes y después.
- **Botón fijo abajo en el teléfono** cuando el del inicio sale de la pantalla:
  - se esconde mientras el formulario está abierto y cuando el botón final está a la vista;
  - mide al menos 48 px y queda lejos del borde inferior del iPhone (`safe-area`).
- **El sobre también registra:** tocar el sobre o la paloma posados abre el formulario, con su propio `location`. Así se aprovechan los toques que hoy no hacen nada. Con teclado sigue habiendo un único botón real; el sobre no se vuelve un control nuevo para lectores de pantalla.
- **Señal de «se puede tocar»:** al cargar, el botón principal hace una sola vez un leve pulso con la paloma (se omite con «reducir movimiento»). Además, estados de presionado y enfoque bien visibles.
- **Pruebas E2E:**
  - el botón fijo aparece y desaparece cuando debe y no tapa el banner de privacidad;
  - el sobre abre el formulario;
  - todos los botones miden al menos 44 px;
  - a 320 px no se desborda nada.

## Fase 6 · Ciclo de mejora (continuo)

- **Revisión semanal del tablero:**
  - dónde se cae la gente en el embudo;
  - qué escena retiene;
  - qué botón convierte más;
  - Web Vitals.
- **Pruebas A/B** con las *feature flags* de PostHog (texto del botón, orden de escenas), **solo cuando haya unos cientos de visitas por semana por variante**. Con menos, se itera viendo grabaciones.
- **Rendimiento:** meta de LCP < 2.5 s e INP < 200 ms en teléfonos reales (percentil 75). Si el vuelo de la paloma sube el INP, se optimiza.
- Cada cambio queda anotado con su fecha en el tablero, para ver su efecto.

---

## Orden y esfuerzo

| Orden | Fase | Depende de | Esfuerzo |
|---|---|---|---|
| 1 | F0 Decisiones | — | Marcelo |
| 2 | F1 Consentimiento y aviso | D2 | 1 día |
| 3 | F2 Medición y embudo | D1, F1 | 1 día |
| 4 | F3 Mapa de calor y grabaciones | F1, F2 | ½ día |
| 5 | F4 Datos del registro | D3–D5 | 1 día + configurar Tally |
| 6 | F5 Botón visible | F2 (para medir antes y después) | 1–2 días |
| 7 | F6 Ciclo de mejora | todo | continuo |

F5 puede ir antes si se prefiere el cambio rápido, pero entonces no habrá un «antes» medido para comparar.

**Lo que necesito de Marcelo para empezar:** D1 (herramienta) y D2 (responsable del aviso). Con eso arranco F1 y F2 mientras configuras Tally (D3–D5).

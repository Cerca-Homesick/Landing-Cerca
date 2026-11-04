# Landing de CERCA · lista de espera

React + TypeScript + Vite. `npm run dev` · `npm run build` · `npm run preview`.

- **Nombre provisional:** `src/brand.ts` (también actualiza el `<title>` y los metadatos).
- **Textos (español e inglés):** `src/copy.ts`. Estructura de la demostración (orden, ilustración, color):
  `src/content.ts`. Ilustraciones de muestra: `src/assets/illustrations/`; para usar fotos reales, cambia
  el mapa `ART` en `content.ts`. Colores, tipos y componentes: `CERCA-DESIGN-SYSTEM.md`.
- **Idioma:** botón ES/EN en el encabezado. Se elige por `?lang=es|en`, luego lo que la persona eligió antes
  y, si no, el idioma del navegador. Los eventos de clic en la lista de espera incluyen `lang`.
- **Jotform:** `src/config.ts` (app "Cerca Waiting List"). Para cambiarla sin tocar código, `VITE_JOTFORM_URL` en `.env`.
- **Inscripciones confirmadas:** en Jotform, redirige la página de agradecimiento a
  `https://<tu-dominio>/?registro=confirmado`. Solo esa redirección dispara `waitlist_signup_confirmed`;
  los clics se registran aparte como `waitlist_cta_click` (ver `src/analytics.ts`, se envían a `window.dataLayer`).
- **El vuelo:** `src/components/Flight.tsx` traza la ruta con los marcadores `data-*` de `App.tsx` y mueve el sobre con el scroll.
- **Formulario en inglés:** el aviso temporal es `waitlist.formNote` en `src/copy.ts`; déjalo vacío cuando el formulario de Jotform esté en español.

# Landing de CERCA · lista de espera

React + TypeScript + Vite, GSAP 3.15 (ScrollTrigger). `npm run dev` · `npm run build` · `npm run preview`.

- **Nombre provisional:** `src/brand.ts` (también actualiza el `<title>` y los metadatos).
- **Textos (español e inglés):** `src/copy.ts`. Estructura de la demostración (orden, ilustración, color):
  `src/content.ts`. Ilustraciones provisionales: `src/components/Art.tsx`; para usar fotos reales, añade
  `image` a cada momento en `content.ts`.
- **Idioma:** botón ES/EN en el encabezado. Se elige por `?lang=es|en`, luego lo que la persona eligió antes
  y, si no, el idioma del navegador. Los eventos de clic en la lista de espera incluyen `lang`.
- **Jotform:** `src/config.ts` (app "Cerca Wishlist"). Para cambiarla sin tocar código, `VITE_JOTFORM_URL` en `.env`.
- **Inscripciones confirmadas:** en Jotform, redirige la página de agradecimiento a
  `https://<tu-dominio>/?registro=confirmado`. Solo esa redirección dispara `waitlist_signup_confirmed`;
  los clics se registran aparte como `waitlist_cta_click` (ver `src/analytics.ts`, se envían a `window.dataLayer`).
- **El hilo:** `src/components/Thread.tsx` recorre los elementos `data-anchor` en orden y termina en `[data-x-mark]`.

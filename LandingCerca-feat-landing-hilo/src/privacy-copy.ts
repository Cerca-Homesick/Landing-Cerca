import { BRAND_NAME } from './brand'

/*
 * F1 · Aviso de privacidad (ES/EN). Lo publicado aquí es un compromiso: si
 * cambia lo que se recoge, se actualiza `UPDATED` y se sube CONSENT_VERSION en
 * consent.ts. Pendiente: revisión legal (RGPD y LFPDPPP).
 */
export const CONTROLLER = 'Arnoldo Marcelo Sias Saucedo'
export const CONTACT_EMAIL = (import.meta.env.VITE_PRIVACY_EMAIL ?? '').trim()
export const UPDATED = '2026-11-10'

type Section = { title: string; body: string[] }
type PrivacyCopy = {
  title: string
  updated: string
  back: string
  other: { label: string; href: string; lang: string }
  intro: string
  contact: string
  sections: Section[]
  prefs: string
}

export const PRIVACY: Record<'es' | 'en', PrivacyCopy> = {
  es: {
    title: 'Aviso de privacidad',
    updated: 'Actualizado el 10 de noviembre de 2026',
    back: `Volver a ${BRAND_NAME}`,
    other: { label: 'English', href: '/privacy/', lang: 'en' },
    intro: `${BRAND_NAME} es una app para iPhone en desarrollo. Esta página explica qué datos se recogen en la landing y en la lista de espera, para qué y qué puedes hacer con ellos.`,
    contact: 'Para cualquier pregunta o para ejercer tus derechos, escribe a',
    sections: [
      {
        title: 'Quién es responsable',
        body: [`${CONTROLLER}, con domicilio en México, es el responsable de tus datos personales.`],
      },
      {
        title: 'Qué datos se recogen',
        body: [
          'Lista de espera: lo que escribes en el formulario (por ejemplo, tu nombre y tu correo), el idioma y desde qué botón te registraste.',
          'Uso de la página: qué partes se ven, qué botones se tocan, el tipo de dispositivo y navegador, el idioma, el país aproximado de la conexión y la campaña de la que vienes (por ejemplo, un enlace de Instagram). No se guarda tu dirección IP ni lo que escribes en los campos.',
          'Si aceptas la cookie de análisis, se guarda además un identificador en tu navegador para reconocer cuando vuelves. Si no aceptas, solo se cuentan visitas y nada se guarda en tu navegador.',
        ],
      },
      {
        title: 'Para qué',
        body: [
          `Avisarte cuando ${BRAND_NAME} esté lista y mandarte novedades del lanzamiento. Puedes darte de baja cuando quieras.`,
          'Entender qué partes de la página sirven y cuáles no, para mejorarla.',
        ],
      },
      {
        title: 'Base legal',
        body: [
          'Tu consentimiento: al registrarte en la lista de espera y al aceptar la cookie de análisis. Puedes retirarlo cuando quieras.',
          'El interés legítimo de mejorar la página, para el conteo de visitas sin cookies.',
        ],
      },
      {
        title: 'Con quién se comparten',
        body: [
          'Solo con los servicios que hacen funcionar la página, que tratan los datos por encargo: Tally (formulario, Unión Europea), PostHog (medición, servidores en la Unión Europea), Supabase y Google Sheets (almacenamiento de la lista), y Vercel y Cloudflare (alojamiento).',
          'Algunos de estos servicios pueden tratar datos fuera de la Unión Europea o de México, con las garantías que exige la ley (como las cláusulas contractuales tipo). No se venden ni se ceden datos a nadie.',
        ],
      },
      {
        title: 'Cuánto tiempo',
        body: [
          'Los datos de la lista de espera, hasta 12 meses después del lanzamiento o hasta que te des de baja, lo que pase primero.',
          'Los datos de uso de la página, hasta 12 meses.',
        ],
      },
      {
        title: 'Tus derechos',
        body: [
          'Puedes pedir acceso a tus datos, corregirlos, borrarlos, oponerte a su uso, limitarlo, llevártelos (portabilidad) y retirar tu consentimiento (derechos ARCO en México). Se contesta en un plazo máximo de un mes.',
          'Si crees que tus datos no se trataron bien, puedes presentar una reclamación ante la autoridad de protección de datos de tu país (en Italia, el Garante per la protezione dei dati personali).',
        ],
      },
      {
        title: 'Cookies y almacenamiento',
        body: [
          'cerca:consent y cerca:lang (en tu navegador): recuerdan tu decisión sobre la cookie y el idioma. Son necesarias.',
          'ph_* (PostHog): identificador de análisis. Solo si aceptas.',
        ],
      },
    ],
    prefs: 'Cambiar mis preferencias de privacidad',
  },
  en: {
    title: 'Privacy notice',
    updated: 'Updated on November 10, 2026',
    back: `Back to ${BRAND_NAME}`,
    other: { label: 'Español', href: '/privacidad/', lang: 'es' },
    intro: `${BRAND_NAME} is an iPhone app in development. This page explains what data the landing page and the waitlist collect, why, and what you can do about it.`,
    contact: 'For any question or to exercise your rights, write to',
    sections: [
      {
        title: 'Who is responsible',
        body: [`${CONTROLLER}, based in Mexico, is the controller of your personal data.`],
      },
      {
        title: 'What is collected',
        body: [
          'Waitlist: what you type in the form (for example, your name and email), your language and which button you signed up from.',
          'Page use: which parts are seen, which buttons are tapped, your device and browser type, language, the approximate country of your connection and the campaign you came from (for example, an Instagram link). Your IP address and what you type in fields are not stored.',
          'If you accept the analytics cookie, an identifier is also stored in your browser to recognize return visits. If you don’t, visits are only counted and nothing is stored in your browser.',
        ],
      },
      {
        title: 'Why',
        body: [
          `To let you know when ${BRAND_NAME} is ready and send you launch news. You can unsubscribe at any time.`,
          'To understand which parts of the page work and which don’t, so it can be improved.',
        ],
      },
      {
        title: 'Legal basis',
        body: [
          'Your consent: when you join the waitlist and when you accept the analytics cookie. You can withdraw it at any time.',
          'The legitimate interest of improving the page, for counting visits without cookies.',
        ],
      },
      {
        title: 'Who it is shared with',
        body: [
          'Only with the services that run the page, which process data on our behalf: Tally (form, European Union), PostHog (analytics, servers in the European Union), Supabase and Google Sheets (waitlist storage), and Vercel and Cloudflare (hosting).',
          'Some of these services may process data outside the European Union or Mexico, with the safeguards the law requires (such as standard contractual clauses). Data is never sold or handed to anyone else.',
        ],
      },
      {
        title: 'How long',
        body: [
          'Waitlist data, up to 12 months after launch or until you unsubscribe, whichever comes first.',
          'Page-use data, up to 12 months.',
        ],
      },
      {
        title: 'Your rights',
        body: [
          'You can ask to access, correct or delete your data, object to or restrict its use, take it with you (portability) and withdraw your consent (ARCO rights in Mexico). Requests are answered within one month.',
          'If you think your data was mishandled, you can complain to the data protection authority in your country (in Italy, the Garante per la protezione dei dati personali).',
        ],
      },
      {
        title: 'Cookies and storage',
        body: [
          'cerca:consent and cerca:lang (in your browser): remember your cookie choice and language. They are necessary.',
          'ph_* (PostHog): analytics identifier. Only if you accept.',
        ],
      },
    ],
    prefs: 'Change my privacy preferences',
  },
}

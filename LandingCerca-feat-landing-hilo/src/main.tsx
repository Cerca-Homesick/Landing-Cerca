import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { track } from './analytics'
import { SIGNUP_MESSAGE, SIGNUP_PARAM, SIGNUP_VALUE } from './config'
import { COPY } from './copy'
import { detectLang } from './i18n'
import { LangProvider } from './LangProvider'

const params = new URLSearchParams(window.location.search)
const confirmed = params.get(SIGNUP_PARAM) === SIGNUP_VALUE
const root = document.getElementById('root')!

if (confirmed && window.parent !== window) {
  // Jotform redirigió a esta página dentro del iframe del modal: avisa a la
  // página principal (mismo origen) y no carga la landing dentro del iframe.
  // `top` y no `parent`: el formulario vive en un iframe dentro del de la app de Jotform.
  window.top?.postMessage({ type: SIGNUP_MESSAGE }, window.location.origin)
  root.textContent = COPY[detectLang()].signupInFrame
} else {
  if (confirmed) {
    // Formulario enviado desde la pestaña nueva.
    track('waitlist_signup_confirmed', { via: 'direct' })
    params.delete(SIGNUP_PARAM)
    const query = params.toString()
    history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)
  }
  createRoot(root).render(
    <StrictMode>
      <LangProvider>
        <App confirmed={confirmed} />
      </LangProvider>
    </StrictMode>,
  )
}

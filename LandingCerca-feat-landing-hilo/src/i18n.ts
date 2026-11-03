import { createContext, useContext } from 'react'
import { COPY, type Copy } from './copy'

export type Lang = keyof typeof COPY
export const LANGS: Lang[] = ['es', 'en']

export const LANG_PARAM = 'lang'
export const LANG_STORAGE_KEY = 'cerca:lang'

const isLang = (value: string | null | undefined): value is Lang => LANGS.includes(value as Lang)

/** `?lang=` gana; luego lo que eligió la persona antes; luego el idioma del navegador. */
export function detectLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get(LANG_PARAM)
  if (isLang(fromUrl)) return fromUrl
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch {
    // Almacenamiento bloqueado: seguimos con el navegador.
  }
  const browser = navigator.languages?.[0] ?? navigator.language ?? ''
  return browser.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export type LangState = { lang: Lang; setLang: (lang: Lang) => void }

export const LangContext = createContext<LangState>({ lang: 'es', setLang: () => {} })

export const useLang = () => useContext(LangContext)
export const useCopy = (): Copy => COPY[useLang().lang]

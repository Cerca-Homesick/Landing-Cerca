import { useEffect, useState, type ReactNode } from 'react'
import { COPY } from './copy'
import { detectLang, LANG_PARAM, LANG_STORAGE_KEY, LangContext, type Lang } from './i18n'

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectLang)

  useEffect(() => {
    const copy = COPY[lang]
    document.documentElement.lang = copy.htmlLang
    document.title = copy.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', copy.meta.description)
    const url = new URL(window.location.href)
    if (url.searchParams.has(LANG_PARAM)) {
      url.searchParams.set(LANG_PARAM, lang)
      history.replaceState(null, '', url)
    }
  }, [lang])

  // Solo se recuerda lo que la persona eligió; si no, manda el idioma del navegador.
  function choose(next: Lang) {
    setLang(next)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento, el idioma solo dura esta visita.
    }
  }

  return <LangContext.Provider value={{ lang, setLang: choose }}>{children}</LangContext.Provider>
}

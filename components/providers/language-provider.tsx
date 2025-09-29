"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export type SupportedLanguage = "en" | "es" | "fr" | "de"

type LanguageContextType = {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage, persist?: boolean) => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to en; hydrate from Convex if available or localStorage as fallback
  const [language, setLanguageState] = useState<SupportedLanguage>("en")
  const mySettings = useQuery(api.userSettings.getMySettings) as
    | { language?: string | undefined }
    | null
    | undefined
  const upsert = useMutation(api.userSettings.upsertMySettings)

  // Hydrate from backend or localStorage
  useEffect(() => {
    const ls = typeof window !== "undefined" ? (localStorage.getItem("app.language") as SupportedLanguage | null) : null
    if (ls) {
      setLanguageState(ls)
    }
  }, [])

  useEffect(() => {
    const fromBackend = (mySettings?.language as SupportedLanguage | undefined) || undefined
    if (fromBackend) {
      setLanguageState(fromBackend)
      if (typeof window !== "undefined") localStorage.setItem("app.language", fromBackend)
    }
  }, [mySettings])

  const setLanguage = useCallback((lang: SupportedLanguage, persist: boolean = false) => {
    setLanguageState(lang)
    if (typeof window !== "undefined") localStorage.setItem("app.language", lang)
    if (persist) {
      // Best-effort persist to backend
      upsert({ language: lang }).catch(() => {})
    }
  }, [upsert])

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}

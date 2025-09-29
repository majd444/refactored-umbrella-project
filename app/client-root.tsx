'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Providers } from './providers'
import { LanguageProvider } from '@/components/providers/language-provider'
import { Toaster } from '@/components/ui/toaster'

export default function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Providers>
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </Providers>
    </ThemeProvider>
  )
}

// src/components/ThemeProvider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Kita tidak akan mengimpor tipenya, kita akan 'mencurinya' dari komponen itu sendiri.

// Ini adalah trik TypeScript yang canggih untuk mendapatkan tipe props dari sebuah komponen
type NextThemesProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
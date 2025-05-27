import type React from "react"
import type { Metadata } from "next"
import { Chakra_Petch, Gabarito } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/supabase/auth-context"

// Chakra Petch para títulos e elementos principais
const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra-petch",
})

// Gabarito para texto corpo e elementos secundários
const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gabarito",
})

export const metadata: Metadata = {
  title: "Central de Compras Brasil",
  description: "Plataforma de licitações e compras públicas do Brasil",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${chakraPetch.variable} ${gabarito.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

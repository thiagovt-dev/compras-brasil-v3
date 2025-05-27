import type React from "react"
import type { Metadata } from "next"
import BrasilIntegrationClient from "./BrasilIntegrationClient"

export const metadata: Metadata = {
  title: "Integração +Brasil",
  description: "Gerencie a integração com a plataforma +Brasil",
}

interface BrasilIntegrationLayoutProps {
  children: React.ReactNode
}

export default function BrasilIntegrationLayout({ children }: BrasilIntegrationLayoutProps) {
  return <BrasilIntegrationClient children={children} />
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-provider"

interface RegisterParticipationButtonProps {
  tenderId: string
}

export function RegisterParticipationButton({ tenderId }: RegisterParticipationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()

  const registerParticipation = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/tenders/${tenderId}/session`)}`)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/tenders/${tenderId}/register-participation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao registrar participação")
      }

      toast({
        title: "Sucesso",
        description: "Sua participação foi registrada com sucesso.",
      })

      router.refresh()
    } catch (error) {
      console.error("Erro ao registrar participação:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao registrar participação",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
      <Button disabled className="w-full">
        Carregando...
      </Button>
    )
  }

  return (
    <Button onClick={registerParticipation} disabled={isLoading} className="w-full">
      {isLoading ? "Registrando..." : "Registrar Participação"}
    </Button>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface SystemMessageFormProps {
  tenderId: string
}

export function SystemMessageForm({ tenderId }: SystemMessageFormProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const sendSystemMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/tenders/${tenderId}/system-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao enviar mensagem do sistema")
      }

      setMessage("")
      toast({
        title: "Sucesso",
        description: "Mensagem do sistema enviada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao enviar mensagem do sistema:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar mensagem do sistema",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Mensagem do Sistema</CardTitle>
      </CardHeader>
      <form onSubmit={sendSystemMessage}>
        <CardContent>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite a mensagem do sistema..."
            className="min-h-[100px]"
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading || !message.trim()}>
            {isLoading ? "Enviando..." : "Enviar Mensagem"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

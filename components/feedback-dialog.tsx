"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: string
  query: string
  response: string
  rating: boolean
  language: string
}

export function FeedbackDialog({
  open,
  onOpenChange,
  messageId,
  query,
  response,
  rating,
  language,
}: FeedbackDialogProps) {
  const { toast } = useToast()
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          query,
          response,
          rating,
          comment,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to submit feedback")
      }

      toast({
        title: language === "pt-BR" ? "Feedback enviado" : "Feedback sent",
        description: language === "pt-BR" ? "Obrigado pelo seu feedback!" : "Thank you for your feedback!",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: language === "pt-BR" ? "Erro" : "Error",
        description:
          language === "pt-BR"
            ? "Ocorreu um erro ao enviar seu feedback. Tente novamente."
            : "An error occurred while sending your feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {language === "pt-BR"
              ? `Feedback ${rating ? "Positivo" : "Negativo"}`
              : `${rating ? "Positive" : "Negative"} Feedback`}
          </DialogTitle>
          <DialogDescription>
            {language === "pt-BR"
              ? "Compartilhe seus comentários sobre esta resposta para nos ajudar a melhorar."
              : "Share your comments about this response to help us improve."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder={language === "pt-BR" ? "Seus comentários (opcional)" : "Your comments (optional)"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "pt-BR" ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? language === "pt-BR"
                ? "Enviando..."
                : "Submitting..."
              : language === "pt-BR"
                ? "Enviar feedback"
                : "Submit feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

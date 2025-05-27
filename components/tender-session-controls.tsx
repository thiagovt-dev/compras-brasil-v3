"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Play, Pause, StopCircle, Clock, AlertTriangle } from "lucide-react"

interface TenderSessionControlsProps {
  tenderId: string
}

export function TenderSessionControls({ tenderId }: TenderSessionControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const supabase = createClientSupabaseClient()
  const { toast } = useToast()
  const router = useRouter()

  const updateTenderStatus = async (status: string, systemMessage: string) => {
    setIsLoading(true)
    setCurrentAction(status)

    try {
      // Atualizar status da licitação
      const { error: updateError } = await supabase.from("tenders").update({ status }).eq("id", tenderId)

      if (updateError) throw updateError

      // Enviar mensagem do sistema
      const { error: messageError } = await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        content: systemMessage,
        type: "system",
      })

      if (messageError) throw messageError

      toast({
        title: "Sucesso",
        description: `Status da sessão atualizado para ${formatStatus(status)}.`,
      })

      router.refresh()
    } catch (error) {
      console.error("Erro ao atualizar status da sessão:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da sessão.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setCurrentAction(null)
    }
  }

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      in_progress: "Em Andamento",
      suspended: "Suspensa",
      completed: "Concluída",
    }

    return statusMap[status] || status
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" className="w-full" disabled={isLoading}>
              <Play className="mr-2 h-4 w-4" />
              Iniciar Sessão
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Iniciar Sessão Pública</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a iniciar a sessão pública desta licitação. Todos os fornecedores serão notificados e
                poderão participar. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => updateTenderStatus("in_progress", "A sessão pública foi iniciada pelo pregoeiro.")}
                disabled={isLoading && currentAction === "in_progress"}
              >
                {isLoading && currentAction === "in_progress" ? "Iniciando..." : "Iniciar Sessão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={isLoading}>
              <Pause className="mr-2 h-4 w-4" />
              Suspender
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspender Sessão</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a suspender temporariamente a sessão pública. Informe aos participantes o motivo e
                quando a sessão será retomada. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  updateTenderStatus("suspended", "A sessão pública foi suspensa temporariamente pelo pregoeiro.")
                }
                disabled={isLoading && currentAction === "suspended"}
              >
                {isLoading && currentAction === "suspended" ? "Suspendendo..." : "Suspender Sessão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={isLoading}>
              <StopCircle className="mr-2 h-4 w-4" />
              Encerrar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar Sessão</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a encerrar definitivamente a sessão pública. Esta ação não pode ser desfeita. Deseja
                continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => updateTenderStatus("completed", "A sessão pública foi encerrada pelo pregoeiro.")}
                disabled={isLoading && currentAction === "completed"}
              >
                {isLoading && currentAction === "completed" ? "Encerrando..." : "Encerrar Sessão"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="outline" className="w-full">
          <Clock className="mr-2 h-4 w-4" />
          Definir Tempo para Lances
        </Button>

        <Button variant="outline" className="w-full">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Enviar Alerta
        </Button>
      </div>
    </div>
  )
}

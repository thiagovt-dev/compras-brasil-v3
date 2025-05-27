"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  RefreshCw,
} from "lucide-react"

export default function BrasilSchedulePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [scheduledTasks, setScheduledTasks] = useState([])

  // Fetch scheduled tasks
  useEffect(() => {
    fetchScheduledTasks()
  }, [])

  const fetchScheduledTasks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/integrations/brasil/schedule")

      if (!response.ok) {
        throw new Error("Falha ao carregar tarefas agendadas")
      }

      const data = await response.json()
      setScheduledTasks(data.tasks || [])
    } catch (error) {
      console.error("Erro ao carregar tarefas agendadas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tarefas agendadas.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleTasks = async () => {
    try {
      setIsScheduling(true)
      const response = await fetch("/api/integrations/brasil/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "schedule" }),
      })

      if (!response.ok) {
        throw new Error("Falha ao agendar tarefas")
      }

      toast({
        title: "Sucesso",
        description: "Tarefas de sincronização agendadas com sucesso.",
      })

      // Refresh the task list
      fetchScheduledTasks()
    } catch (error: any) {
      console.error("Erro ao agendar tarefas:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível agendar as tarefas.",
        variant: "destructive",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const handleExecuteTasks = async () => {
    try {
      setIsExecuting(true)
      const response = await fetch("/api/integrations/brasil/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "execute" }),
      })

      if (!response.ok) {
        throw new Error("Falha ao executar tarefas")
      }

      toast({
        title: "Sucesso",
        description: "Tarefas pendentes executadas com sucesso.",
      })

      // Refresh the task list
      fetchScheduledTasks()
    } catch (error: any) {
      console.error("Erro ao executar tarefas:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível executar as tarefas.",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Get task type label
  const getTaskTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      import_tenders: "Importar Licitações",
      export_tenders: "Exportar Licitações",
      sync_documents: "Sincronizar Documentos",
    }
    return typeMap[type] || type
  }

  // Get task status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pendente</span>
          </Badge>
        )
      case "running":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Em Execução</span>
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Concluída</span>
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Falha</span>
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Desconhecido</span>
          </Badge>
        )
    }
  }

  // Get task icon
  const getTaskIcon = (type: string) => {
    switch (type) {
      case "import_tenders":
        return <ArrowDownToLine className="h-5 w-5 text-blue-500" />
      case "export_tenders":
        return <ArrowUpFromLine className="h-5 w-5 text-green-500" />
      case "sync_documents":
        return <FileText className="h-5 w-5 text-purple-500" />
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamento de Sincronização</h1>
          <p className="text-muted-foreground">Gerencie as sincronizações agendadas com a plataforma +Brasil</p>
        </div>
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <Button
            variant="outline"
            onClick={handleScheduleTasks}
            disabled={isScheduling}
            className="flex items-center gap-1"
          >
            {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            <span>Agendar Sincronização</span>
          </Button>
          <Button
            variant="default"
            onClick={handleExecuteTasks}
            disabled={isExecuting}
            className="flex items-center gap-1"
          >
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Executar Pendentes</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tarefas Agendadas</CardTitle>
          <CardDescription>Visualize e gerencie as tarefas de sincronização agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : scheduledTasks.length > 0 ? (
            <div className="space-y-4">
              {scheduledTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {getTaskIcon(task.task)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-medium">{getTaskTypeLabel(task.task)}</h3>
                      <div className="mt-1 sm:mt-0">{getStatusBadge(task.status)}</div>
                    </div>
                    <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Agendada para: {formatDate(task.scheduled_for)}</span>
                      </div>
                      <div className="hidden sm:block">•</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Atualizada em: {task.updated_at ? formatDate(task.updated_at) : formatDate(task.created_at)}
                        </span>
                      </div>
                    </div>
                    {task.result && task.status === "failed" && (
                      <div className="mt-2 text-sm text-red-500">Erro: {task.result.error || "Erro desconhecido"}</div>
                    )}
                    {task.result && task.status === "completed" && (
                      <div className="mt-2 text-sm text-green-600">
                        {task.result.message || "Tarefa concluída com sucesso"}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Detalhes
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma tarefa agendada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Não há tarefas de sincronização agendadas com a plataforma +Brasil.
              </p>
              <Button onClick={handleScheduleTasks} className="mt-4" disabled={isScheduling}>
                {isScheduling ? "Agendando..." : "Agendar Sincronização"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

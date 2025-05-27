"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThumbsUp, ThumbsDown, Search, Calendar, Download } from "lucide-react"
import { useAuth } from "@/lib/supabase/auth-context"
import { createClient } from "@/lib/supabase/client"

type FeedbackItem = {
  id: string
  user_id: string
  message_id: string
  query: string
  response: string
  rating: boolean
  comment: string | null
  created_at: string
  user_email?: string
}

export default function AssistantFeedbackPage() {
  const { user, profile } = useAuth()
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "positive" | "negative">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all")
  const supabase = createClient()

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from("assistant_feedback")
          .select("*, profiles(email)")
          .order("created_at", { ascending: false })

        // Aplicar filtros
        if (filter === "positive") {
          query = query.eq("rating", true)
        } else if (filter === "negative") {
          query = query.eq("rating", false)
        }

        // Aplicar filtro de data
        if (dateRange === "today") {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          query = query.gte("created_at", today.toISOString())
        } else if (dateRange === "week") {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          query = query.gte("created_at", weekAgo.toISOString())
        } else if (dateRange === "month") {
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          query = query.gte("created_at", monthAgo.toISOString())
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        // Processar os dados para incluir o email do usuário
        const processedData = data.map((item: any) => ({
          ...item,
          user_email: item.profiles?.email || "Unknown",
        }))

        setFeedback(processedData)
      } catch (error) {
        console.error("Error fetching feedback:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [filter, dateRange])

  const filteredFeedback = feedback.filter(
    (item) =>
      item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.comment && item.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.user_email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const positiveCount = feedback.filter((item) => item.rating).length
  const negativeCount = feedback.filter((item) => !item.rating).length
  const totalCount = feedback.length

  const positivePercentage = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const exportToCSV = () => {
    // Preparar os dados para exportação
    const csvData = filteredFeedback.map((item) => ({
      id: item.id,
      user_email: item.user_email,
      query: item.query,
      response: item.response,
      rating: item.rating ? "Positivo" : "Negativo",
      comment: item.comment || "",
      created_at: formatDate(item.created_at),
    }))

    // Converter para CSV
    const headers = ["ID", "Usuário", "Pergunta", "Resposta", "Avaliação", "Comentário", "Data"]
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      csvData
        .map((row) =>
          Object.values(row)
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n")

    // Criar link de download
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `feedback-assistente-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback do Assistente IA</h1>
          <p className="text-muted-foreground">Analise o feedback dos usuários para melhorar o assistente virtual</p>
        </div>
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">Avaliações recebidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Positivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{positiveCount}</div>
              <Badge className="ml-2 bg-green-500" variant="secondary">
                {positivePercentage}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              <ThumbsUp className="mr-1 inline h-3 w-3" />
              Usuários satisfeitos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Negativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{negativeCount}</div>
              <Badge className="ml-2 bg-red-500" variant="secondary">
                {totalCount > 0 ? 100 - positivePercentage : 0}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              <ThumbsDown className="mr-1 inline h-3 w-3" />
              Oportunidades de melhoria
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Feedback</CardTitle>
          <CardDescription>Visualize e analise o feedback dos usuários sobre o assistente virtual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(value: "all" | "positive" | "negative") => setFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas avaliações</SelectItem>
                  <SelectItem value="positive">Positivas</SelectItem>
                  <SelectItem value="negative">Negativas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={dateRange}
                onValueChange={(value: "all" | "today" | "week" | "month") => setDateRange(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="text-center">
                <div className="mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Carregando feedback...</p>
              </div>
            </div>
          ) : filteredFeedback.length > 0 ? (
            <div className="space-y-4">
              {filteredFeedback.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${
                            item.rating ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.rating ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                          {item.rating ? "Positivo" : "Negativo"}
                        </Badge>
                        <span className="text-sm font-medium">{item.user_email}</span>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.created_at)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-1 text-sm font-medium">Pergunta:</h4>
                        <p className="text-sm">{item.query}</p>
                      </div>
                      <div>
                        <h4 className="mb-1 text-sm font-medium">Resposta:</h4>
                        <p className="whitespace-pre-line text-sm">{item.response}</p>
                      </div>
                      {item.comment && (
                        <div>
                          <h4 className="mb-1 text-sm font-medium">Comentário:</h4>
                          <p className="whitespace-pre-line text-sm">{item.comment}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <ThumbsUp className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhum feedback encontrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm
                  ? "Nenhum feedback corresponde à sua pesquisa."
                  : "Ainda não há feedback para o assistente virtual."}
              </p>
              {searchTerm && (
                <Button className="mt-4" variant="outline" onClick={() => setSearchTerm("")}>
                  Limpar pesquisa
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

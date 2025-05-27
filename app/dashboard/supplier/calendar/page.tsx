"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Clock,
  FileText,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import Link from "next/link"

interface Event {
  id: string
  title: string
  date: string
  time: string
  agency: string
  status: string
}

const events: Event[] = [
  {
    id: "1",
    title: "Licitação de Exemplo 1",
    date: "2024-08-15",
    time: "10:00",
    agency: "Prefeitura Municipal",
    status: "Publicada",
  },
  {
    id: "2",
    title: "Licitação de Exemplo 2",
    date: "2024-08-20",
    time: "14:00",
    agency: "Governo do Estado",
    status: "Aguardando abertura",
  },
  {
    id: "3",
    title: "Licitação de Exemplo 3",
    date: "2024-09-01",
    time: "11:00",
    agency: "Empresa Pública",
    status: "Em disputa",
  },
  {
    id: "4",
    title: "Licitação de Exemplo 4",
    date: "2024-09-10",
    time: "16:00",
    agency: "Ministério X",
    status: "Em andamento",
  },
  {
    id: "5",
    title: "Licitação de Exemplo 5",
    date: "2024-09-22",
    time: "09:00",
    agency: "Secretaria Y",
    status: "Homologada",
  },
  {
    id: "6",
    title: "Licitação de Exemplo 6",
    date: "2024-10-05",
    time: "15:00",
    agency: "Autarquia Z",
    status: "Revogada",
  },
]

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false)
  const [view, setView] = useState<"month" | "list">("month")

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const today = () => {
    setCurrentMonth(new Date())
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsEventDetailsOpen(true)
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleString("pt-BR", { month: "long" })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getEventsForDay = (date: Date) => {
    if (!date) return []
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Publicada":
        return "secondary"
      case "Aguardando abertura":
        return "default"
      case "Em disputa":
        return "warning"
      case "Em andamento":
        return "default"
      case "Homologada":
        return "success"
      case "Revogada":
        return "destructive"
      case "Anulada":
        return "destructive"
      default:
        return "outline"
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const getUpcomingEvents = () => {
    const today = new Date()
    return events
      .filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate >= today
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">Visualize suas licitações em um calendário</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(value) => setView(value as "month" | "list")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione a visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Visualização Mensal</SelectItem>
              <SelectItem value="list">Lista de Eventos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={today}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-xl capitalize">
              {getMonthName(currentMonth)} {currentMonth.getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
              <div className="py-2">Dom</div>
              <div className="py-2">Seg</div>
              <div className="py-2">Ter</div>
              <div className="py-2">Qua</div>
              <div className="py-2">Qui</div>
              <div className="py-2">Sex</div>
              <div className="py-2">Sáb</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : []
                return (
                  <div
                    key={index}
                    className={`min-h-24 rounded-md border p-1 ${
                      day ? (isToday(day) ? "border-primary bg-primary/5" : "") : "bg-gray-50"
                    }`}
                  >
                    {day && (
                      <>
                        <div className="text-right text-sm">{day.getDate()}</div>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => handleEventClick(event)}
                              className="w-full truncate rounded-sm bg-primary/10 px-1 py-0.5 text-left text-xs hover:bg-primary/20"
                            >
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-center text-xs text-muted-foreground">
                              +{dayEvents.length - 3} mais
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Próximas Licitações</CardTitle>
            <CardDescription>Lista de licitações agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {getUpcomingEvents().length > 0 ? (
                getUpcomingEvents().map((event) => (
                  <div key={event.id} className="flex gap-4 rounded-md border p-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge variant={getStatusBadgeVariant(event.status)}>{event.status}</Badge>
                      </div>
                      <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>{new Date(event.date).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div className="hidden sm:block">•</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{event.time}</span>
                        </div>
                        <div className="hidden sm:block">•</div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{event.agency}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEventClick(event)}>
                          Ver Detalhes
                        </Button>
                        {event.status === "Aguardando abertura" && (
                          <Link href={`/dashboard/supplier/my-tenders/${event.id}`}>
                            <Button size="sm">Participar</Button>
                          </Link>
                        )}
                        {event.status === "Em disputa" && (
                          <Link href={`/dashboard/session/${event.id}`}>
                            <Button size="sm" variant="default">
                              Acessar Sessão
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-2 font-medium">Nenhuma licitação agendada</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Você não tem licitações agendadas para os próximos dias.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Detalhes da licitação selecionada.</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <FileText className="col-span-1 h-4 w-4 text-muted-foreground" />
                <p className="col-span-3 text-sm font-medium leading-none">{selectedEvent.title}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <CalendarIcon className="col-span-1 h-4 w-4 text-muted-foreground" />
                <p className="col-span-3 text-sm leading-none">
                  {new Date(selectedEvent.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Clock className="col-span-1 h-4 w-4 text-muted-foreground" />
                <p className="col-span-3 text-sm leading-none">{selectedEvent.time}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Building2 className="col-span-1 h-4 w-4 text-muted-foreground" />
                <p className="col-span-3 text-sm leading-none">{selectedEvent.agency}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                {selectedEvent.status === "Publicada" && <CheckCircle className="col-span-1 h-4 w-4 text-green-500" />}
                {selectedEvent.status === "Aguardando abertura" && (
                  <AlertCircle className="col-span-1 h-4 w-4 text-yellow-500" />
                )}
                {selectedEvent.status === "Em disputa" && (
                  <AlertCircle className="col-span-1 h-4 w-4 text-yellow-500" />
                )}
                {selectedEvent.status === "Em andamento" && (
                  <AlertCircle className="col-span-1 h-4 w-4 text-yellow-500" />
                )}
                {selectedEvent.status === "Homologada" && <CheckCircle className="col-span-1 h-4 w-4 text-green-500" />}
                {(selectedEvent.status === "Revogada" || selectedEvent.status === "Anulada") && (
                  <XCircle className="col-span-1 h-4 w-4 text-red-500" />
                )}
                <p className="col-span-3 text-sm leading-none">{selectedEvent.status}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={() => setIsEventDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

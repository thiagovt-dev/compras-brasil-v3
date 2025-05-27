"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, CalendarIcon, FileText } from "lucide-react"
import Link from "next/link"

// Sample data for events
const events = [
  {
    id: "1",
    title: "Abertura de Licitação #12345",
    date: new Date(2024, 7, 15, 10, 0),
    endDate: new Date(2024, 7, 15, 11, 30),
    type: "opening",
    location: "Online - Microsoft Teams",
    participants: 12,
    description: "Abertura da licitação para aquisição de equipamentos de informática",
    tenderNumber: "12345",
  },
  {
    id: "2",
    title: "Prazo Final - Licitação #12346",
    date: new Date(2024, 7, 20, 18, 0),
    type: "deadline",
    location: null,
    participants: 0,
    description: "Prazo final para envio de propostas",
    tenderNumber: "12346",
  },
  {
    id: "3",
    title: "Sessão Pública - Licitação #12347",
    date: new Date(2024, 7, 25, 14, 0),
    endDate: new Date(2024, 7, 25, 16, 0),
    type: "session",
    location: "Brasília - Ministério da Economia",
    participants: 8,
    description: "Sessão pública para abertura das propostas",
    tenderNumber: "12347",
  },
  {
    id: "4",
    title: "Resultado - Licitação #12348",
    date: new Date(2024, 7, 28, 9, 0),
    type: "result",
    location: "Online - Portal de Compras",
    participants: 15,
    description: "Divulgação do resultado da licitação",
    tenderNumber: "12348",
  },
]

export default function AgencyCalendarPage() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    time: "10:00",
    endTime: "11:00",
    type: "opening",
    location: "",
    description: "",
    tenderNumber: "",
  })

  // Filter events for the selected date
  const selectedDateEvents = events.filter(
    (event) =>
      selectedDate &&
      event.date.getDate() === selectedDate.getDate() &&
      event.date.getMonth() === selectedDate.getMonth() &&
      event.date.getFullYear() === selectedDate.getFullYear(),
  )

  // Format time from date
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  // Format date range
  const formatDateRange = (start: Date, end?: Date) => {
    if (!end) return formatTime(start)
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  // Get event badge color based on type
  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "opening":
        return "bg-blue-500 hover:bg-blue-600"
      case "deadline":
        return "bg-red-500 hover:bg-red-600"
      case "session":
        return "bg-green-500 hover:bg-green-600"
      case "result":
        return "bg-purple-500 hover:bg-purple-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Check if a date has events
  const hasEvents = (day: Date) => {
    return events.some(
      (event) =>
        event.date.getDate() === day.getDate() &&
        event.date.getMonth() === day.getMonth() &&
        event.date.getFullYear() === day.getFullYear(),
    )
  }

  const handleAddEvent = () => {
    // In a real app, we would save the event to the database
    toast({
      title: "Evento adicionado",
      description: "O evento foi adicionado com sucesso ao calendário.",
    })
    setIsAddEventOpen(false)
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setIsEventDetailsOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agenda de Licitações</h2>
        <div className="flex items-center gap-2">
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Evento</DialogTitle>
                <DialogDescription>Crie um novo evento no calendário de licitações</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Título do evento"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date.toISOString().split("T")[0]}
                      onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opening">Abertura</SelectItem>
                        <SelectItem value="deadline">Prazo Final</SelectItem>
                        <SelectItem value="session">Sessão Pública</SelectItem>
                        <SelectItem value="result">Resultado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="time">Hora de Início</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">Hora de Término</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Local do evento"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tenderNumber">Número da Licitação</Label>
                  <Input
                    id="tenderNumber"
                    value={newEvent.tenderNumber}
                    onChange={(e) => setNewEvent({ ...newEvent, tenderNumber: e.target.value })}
                    placeholder="Ex: 12345"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Descrição do evento"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddEvent}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
            <CardDescription>Gerencie os eventos de licitações</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={setSelectedDate}
              className="rounded-md border"
              components={{
                DayContent: ({ day }) => (
                  <div className="relative">
                    <div>{day.day}</div>
                    {hasEvents(day.date) && (
                      <div className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"></div>
                    )}
                  </div>
                ),
              }}
            />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="flex-1">
              <CardTitle>
                {selectedDate?.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <CardDescription>{selectedDateEvents.length} evento(s) agendado(s)</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (selectedDate) {
                    const newDate = new Date(selectedDate)
                    newDate.setDate(newDate.getDate() - 1)
                    setSelectedDate(newDate)
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (selectedDate) {
                    const newDate = new Date(selectedDate)
                    newDate.setDate(newDate.getDate() + 1)
                    setSelectedDate(newDate)
                  }
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="flex flex-col space-y-2 rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{event.title}</h3>
                      <Badge className={cn("ml-2", getEventBadgeColor(event.type))}>
                        {event.type === "opening" && "Abertura"}
                        {event.type === "deadline" && "Prazo Final"}
                        {event.type === "session" && "Sessão Pública"}
                        {event.type === "result" && "Resultado"}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      {formatDateRange(event.date, event.endDate)}
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                    {event.participants > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-1 h-4 w-4" />
                        {event.participants} participante(s)
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEventClick(event)}>
                        Detalhes
                      </Button>
                      {event.type === "session" && (
                        <Link href={`/dashboard/session/${event.id}`}>
                          <Button variant="default" size="sm">
                            Gerenciar Sessão
                          </Button>
                        </Link>
                      )}
                      {event.type === "opening" && (
                        <Link href={`/dashboard/agency/active-tenders/${event.tenderNumber}`}>
                          <Button variant="default" size="sm">
                            Gerenciar Licitação
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <h3 className="mt-4 text-lg font-medium">Nenhum evento para esta data</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecione outra data no calendário ou crie um novo evento.
                </p>
                <Button className="mt-4" onClick={() => setIsAddEventOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Evento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
          <CardDescription>Eventos agendados para os próximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events
              .filter((event) => event.date > new Date())
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-center gap-4 rounded-md border p-4">
                  <div className={cn("rounded-full p-2", getEventBadgeColor(event.type).replace("hover:", ""))}>
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="mt-1 sm:mt-0">
                        <Badge className={cn(getEventBadgeColor(event.type))}>
                          {event.type === "opening" && "Abertura"}
                          {event.type === "deadline" && "Prazo Final"}
                          {event.type === "session" && "Sessão Pública"}
                          {event.type === "result" && "Resultado"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {event.date.toLocaleDateString("pt-BR")} às {formatTime(event.date)}
                        </span>
                      </div>
                      {event.location && (
                        <>
                          <div className="hidden sm:block">•</div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{event.location}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={() => handleEventClick(event)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
            <DialogDescription>Informações detalhadas sobre o evento</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Título</Label>
                <div className="rounded-md bg-muted p-2">{selectedEvent.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data</Label>
                  <div className="rounded-md bg-muted p-2">{selectedEvent.date.toLocaleDateString("pt-BR")}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Horário</Label>
                  <div className="rounded-md bg-muted p-2">
                    {formatDateRange(selectedEvent.date, selectedEvent.endDate)}
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <div className="rounded-md bg-muted p-2">
                  {selectedEvent.type === "opening" && "Abertura"}
                  {selectedEvent.type === "deadline" && "Prazo Final"}
                  {selectedEvent.type === "session" && "Sessão Pública"}
                  {selectedEvent.type === "result" && "Resultado"}
                </div>
              </div>
              {selectedEvent.location && (
                <div className="grid gap-2">
                  <Label>Local</Label>
                  <div className="rounded-md bg-muted p-2">{selectedEvent.location}</div>
                </div>
              )}
              {selectedEvent.description && (
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <div className="rounded-md bg-muted p-2">{selectedEvent.description}</div>
                </div>
              )}
              {selectedEvent.tenderNumber && (
                <div className="grid gap-2">
                  <Label>Número da Licitação</Label>
                  <div className="rounded-md bg-muted p-2">#{selectedEvent.tenderNumber}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
              Fechar
            </Button>
            {selectedEvent && selectedEvent.type === "session" && (
              <Link href={`/dashboard/session/${selectedEvent.id}`}>
                <Button>Gerenciar Sessão</Button>
              </Link>
            )}
            {selectedEvent && selectedEvent.type === "opening" && (
              <Link href={`/dashboard/agency/active-tenders/${selectedEvent.tenderNumber}`}>
                <Button>Gerenciar Licitação</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

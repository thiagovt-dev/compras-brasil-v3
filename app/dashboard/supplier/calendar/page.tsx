// app/dashboard/supplier/calendar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Timer,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { fetchSupplierTenderSchedule } from "@/lib/actions/supplierAction";
import { useAuth } from "@/lib/supabase/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

interface TenderEvent {
  id: string;
  tender_id: string;
  title: string;
  tender_number: string;
  date: string;
  time: string;
  agency: string;
  status: string;
  type: "submission_deadline" | "opening_date" | "closing_date" | "session_date";
  estimated_value: number;
  proposal_status?: string;
  proposal_value?: number;
  days_remaining?: number;
  is_past?: boolean
}

export default function CalendarPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TenderEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [view, setView] = useState<"month" | "list">("month");
  const [events, setEvents] = useState<TenderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const loadTenderSchedule = async () => {
      if (authLoading) return;
      
      if (!user || profile?.profile_type !== "supplier") {
        setError("Acesso restrito a fornecedores");
        setIsLoading(false);
        return;
      }
  
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("📅 Carregando agenda do fornecedor...");
        
        // APENAS dados reais - sem fallback
        const result = await fetchSupplierTenderSchedule();
        
        if (result.success) {
          console.log("✅ Agenda carregada:", result.data?.length, "eventos");
          setEvents(result.data || []); // Se vazio, calendário ficará sem eventos
        } else {
          console.error("❌ Erro ao carregar agenda:", result.error);
          setError(result.error || "Erro ao carregar agenda");
        }
      } catch (error) {
        console.error("💥 Erro fatal ao carregar agenda:", error);
        setError("Erro inesperado ao carregar agenda");
      } finally {
        setIsLoading(false);
      }
    };
  
    loadTenderSchedule();
  }, [user, profile, authLoading]);
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const today = () => {
    setCurrentMonth(new Date());
  };

  const handleEventClick = (event: TenderEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleString("pt-BR", { month: "long" });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    if (!date) return [];
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default";
      case "in_progress":
        return "secondary";
      case "completed":
        return "default";
      case "cancelled":
      case "revoked":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getEventTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "submission_deadline":
        return "destructive";
      case "opening_date":
        return "default";
      case "closing_date":
        return "secondary";
      case "session_date":
        return "default";
      default:
        return "outline";
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "submission_deadline":
        return "Prazo de Envio";
      case "opening_date":
        return "Abertura";
      case "closing_date":
        return "Fechamento";
      case "session_date":
        return "Sessão";
      default:
        return "Evento";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "submission_deadline":
        return <Timer className="h-4 w-4" />;
      case "opening_date":
        return <CalendarIcon className="h-4 w-4" />;
      case "closing_date":
        return <Clock className="h-4 w-4" />;
      case "session_date":
        return <FileText className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter((event) => {
        // Na lista, mostrar apenas eventos futuros
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10); // Mostrar apenas os próximos 10 eventos
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">Visualize suas licitações em um calendário</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar agenda</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Visualize os prazos das suas licitações em um calendário
          </p>
          {events.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {events.length} evento(s) encontrado(s)
            </p>
          )}
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
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div
                    key={index}
                    className={`min-h-24 rounded-md border p-1 ${
                      day ? (isToday(day) ? "border-primary bg-primary/5" : "") : "bg-gray-50"
                    }`}
                  >
                    {day && (
                      <>
                        <div className="text-right text-sm font-medium">{day.getDate()}</div>

                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <button
                              key={`${event.id}-${event.type}`}
                              onClick={() => handleEventClick(event)}
                              className={`w-full truncate rounded-sm px-1 py-0.5 text-left text-xs hover:opacity-80 ${
                                event.is_past 
                                  ? "bg-purple-100 text-gray-600 opacity-75" // Eventos passados em cinza
                                  : event.type === "submission_deadline" 
                                  ? "bg-red-100 text-red-800" 
                                  : event.type === "opening_date"
                                  ? "bg-blue-100 text-blue-800"
                                  : event.type === "closing_date"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {getEventTypeLabel(event.type)}: {event.title.substring(0, 15)}...
                            </button>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-center text-xs text-muted-foreground">
                              +{dayEvents.length - 2} mais
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Próximos Prazos</CardTitle>
            <CardDescription>
              Lista de prazos das licitações onde você enviou propostas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {getUpcomingEvents().length > 0 ? (
                getUpcomingEvents().map((event) => (
                  <div key={`${event.id}-${event.type}`} className="flex gap-4 rounded-md border p-4">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md ${
                      event.type === "submission_deadline" 
                        ? "bg-red-100 text-red-600" 
                        : event.type === "opening_date"
                        ? "bg-blue-100 text-blue-600"
                        : event.type === "closing_date"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-green-100 text-green-600"
                    }`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="flex gap-2">
                          <Badge variant={getEventTypeBadgeVariant(event.type)}>
                            {getEventTypeLabel(event.type)}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(event.status)}>
                            {event.status === "published" ? "Publicada" :
                             event.status === "in_progress" ? "Em Andamento" :
                             event.status === "completed" ? "Concluída" :
                             event.status === "cancelled" ? "Cancelada" :
                             event.status === "revoked" ? "Revogada" : event.status}
                          </Badge>
                        </div>
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
                        {event.days_remaining !== undefined && (
                          <>
                            <div className="hidden sm:block">•</div>
                            <div className={`flex items-center gap-1 ${
                              event.days_remaining <= 1 ? "text-red-600" :
                              event.days_remaining <= 3 ? "text-yellow-600" : ""
                            }`}>
                              <Timer className="h-3.5 w-3.5" />
                              <span>
                                {event.days_remaining === 0 ? "Hoje" :
                                 event.days_remaining === 1 ? "Amanhã" :
                                 `${event.days_remaining} dias`}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {(event.estimated_value || event.proposal_value) && (
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          {event.estimated_value && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>Estimado: {formatCurrency(event.estimated_value)}</span>
                            </div>
                          )}
                          {event.proposal_value && (
                            <div className="flex items-center gap-1 text-green-600">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>Sua proposta: {formatCurrency(event.proposal_value)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEventClick(event)}>
                          Ver Detalhes
                        </Button>
                        <Link href={`/dashboard/supplier/my-tenders/${event.tender_id}`}>
                          <Button size="sm" variant="default">
                            Ver Licitação
                          </Button>
                        </Link>
                        {event.type === "session_date" && event.status === "in_progress" && (
                          <Link href={`/dashboard/session/${event.tender_id}`}>
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
                  <h3 className="mt-2 font-medium">Nenhum prazo próximo</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Você não tem prazos de licitações nos próximos dias.
                  </p>
                  <div className="mt-4">
                    <Link href="/dashboard/supplier/search-tenders">
                      <Button>Buscar Licitações</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getEventIcon(selectedEvent.type)}
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Detalhes do prazo da licitação selecionada
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <FileText className="col-span-1 h-4 w-4 text-muted-foreground" />
                <p className="col-span-3 text-sm font-medium leading-none">
                  {selectedEvent.tender_number}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <CalendarIcon className="col-span-1 h-4 w-4 text-muted-foreground" />
                <p className="col-span-3 text-sm leading-none">
                  {new Date(selectedEvent.date).toLocaleDateString("pt-BR")} às {selectedEvent.time}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Building2 className="col-span-1 h-4 w-4 text-muted-foreground" />
                <p className="col-span-3 text-sm leading-none">{selectedEvent.agency}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Timer className="col-span-1 h-4 w-4 text-muted-foreground" />
                <p className="col-span-3 text-sm leading-none">
                  Tipo: {getEventTypeLabel(selectedEvent.type)}
                </p>
              </div>
              {selectedEvent.estimated_value && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <DollarSign className="col-span-1 h-4 w-4 text-muted-foreground" />
                  <p className="col-span-3 text-sm leading-none">
                    Valor estimado: {formatCurrency(selectedEvent.estimated_value)}
                  </p>
                </div>
              )}
              {selectedEvent.proposal_value && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <DollarSign className="col-span-1 h-4 w-4 text-green-600" />
                  <p className="col-span-3 text-sm leading-none text-green-600">
                    Sua proposta: {formatCurrency(selectedEvent.proposal_value)}
                  </p>
                </div>
              )}
              {selectedEvent.days_remaining !== undefined && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Clock className="col-span-1 h-4 w-4 text-muted-foreground" />
                  <p className={`col-span-3 text-sm leading-none ${
                    selectedEvent.days_remaining <= 1 ? "text-red-600 font-medium" :
                    selectedEvent.days_remaining <= 3 ? "text-yellow-600" : ""
                  }`}>
                    {selectedEvent.days_remaining === 0 ? "Vence hoje!" :
                     selectedEvent.days_remaining === 1 ? "Vence amanhã!" :
                     `Faltam ${selectedEvent.days_remaining} dias`}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Link href={`/dashboard/supplier/my-tenders/${selectedEvent.tender_id}`} className="flex-1">
                  <Button className="w-full" variant="outline">
                    Ver Licitação
                  </Button>
                </Link>
                {selectedEvent.type === "session_date" && selectedEvent.status === "in_progress" && (
                  <Link href={`/dashboard/session/${selectedEvent.tender_id}`} className="flex-1">
                    <Button className="w-full">
                      Acessar Sessão
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
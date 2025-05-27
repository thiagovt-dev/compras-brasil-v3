"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Clock, Send, HandIcon as HandRaised, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function LiveSessionPage() {
  const params = useParams()
  const router = useRouter()
  const tenderId = params.id as string
  const supabase = createClientComponentClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [tender, setTender] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatEnabled, setChatEnabled] = useState(true)
  const [handRaised, setHandRaised] = useState(false)
  const [raisedHands, setRaisedHands] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [lots, setLots] = useState<any[]>([])
  const [currentLot, setCurrentLot] = useState<string | null>(null)
  const [bids, setBids] = useState<any[]>([])
  const [newBid, setNewBid] = useState("")
  const [sessionStatus, setSessionStatus] = useState<string>("waiting")
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [negotiationValue, setNegotiationValue] = useState("")
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false)
  const [timer, setTimer] = useState<number | null>(null)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])

  useEffect(() => {
    if (!tenderId) {
      router.push("/dashboard")
      return
    }

    async function fetchData() {
      setLoading(true)

      // Get user info
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (profile) {
          setUserRole(profile.role)
        }
      }

      // Get tender details
      const { data: tenderData, error: tenderError } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", tenderId)
        .single()

      if (tenderError) {
        console.error("Error fetching tender:", tenderError)
        setError("Erro ao carregar dados da licitação")
      } else {
        setTender(tenderData)
        setSessionStatus(tenderData.session_status || "waiting")
      }

      // Get lots
      const { data: lotsData, error: lotsError } = await supabase
        .from("tender_lots")
        .select("*")
        .eq("tender_id", tenderId)
        .order("number", { ascending: true })

      if (lotsError) {
        console.error("Error fetching lots:", lotsError)
      } else {
        setLots(lotsData || [])
        if (lotsData && lotsData.length > 0) {
          setCurrentLot(lotsData[0].id)
        }
      }

      // Get suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("tender_suppliers")
        .select(`
          *,
          profiles:supplier_id(id, name, role)
        `)
        .eq("tender_id", tenderId)

      if (suppliersError) {
        console.error("Error fetching suppliers:", suppliersError)
      } else {
        setSuppliers(suppliersData || [])
      }

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("session_messages")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: true })

      if (messagesError) {
        console.error("Error fetching messages:", messagesError)
      } else {
        setMessages(messagesData || [])
      }

      // Get documents
      const { data: documentsData, error: documentsError } = await supabase
        .from("tender_documents")
        .select(`
          *,
          profiles:user_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })

      if (documentsError) {
        console.error("Error fetching documents:", documentsError)
      } else {
        setDocuments(documentsData || [])
      }

      // Get proposals
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("tender_proposals")
        .select(`
          *,
          profiles:supplier_id(name, role)
        `)
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false })

      if (proposalsError) {
        console.error("Error fetching proposals:", proposalsError)
      } else {
        setProposals(proposalsData || [])
      }

      // Set up real-time listeners
      const messagesChannel = supabase
        .channel("session_messages_channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "session_messages",
            filter: `tender_id=eq.${tenderId}`,
          },
          (payload) => {
            // Fetch the user info for the new message
            const fetchMessageUser = async () => {
              const { data: userData } = await supabase
                .from("profiles")
                .select("name, role")
                .eq("id", payload.new.user_id)
                .single()

              setMessages((prev) => [
                ...prev,
                {
                  ...payload.new,
                  profiles: userData,
                },
              ])
            }
            fetchMessageUser()
          },
        )
        .subscribe()

      const bidsChannel = supabase
        .channel("bids_channel")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "bids",
            filter: `tender_id=eq.${tenderId}`,
          },
          (payload) => {
            setBids((prev) => [...prev, payload.new])
          },
        )
        .subscribe()

      const tenderChannel = supabase
        .channel("tender_channel")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "tenders",
            filter: `id=eq.${tenderId}`,
          },
          (payload) => {
            setTender(payload.new)
            setSessionStatus(payload.new.session_status || "waiting")
          },
        )
        .subscribe()

      setLoading(false)

      // Cleanup function
      return () => {
        supabase.removeChannel(messagesChannel)
        supabase.removeChannel(bidsChannel)
        supabase.removeChannel(tenderChannel)
        if (timerInterval) {
          clearInterval(timerInterval)
        }
      }
    }

    fetchData()
  }, [tenderId, router, supabase])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatEnabled) return

    try {
      const { error } = await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: userId,
        content: newMessage,
        type: "chat",
      })

      if (error) {
        console.error("Error sending message:", error)
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem",
          variant: "destructive",
        })
        return
      }

      setNewMessage("")
    } catch (err) {
      console.error("Error:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      })
    }
  }

  const toggleHandRaise = async () => {
    try {
      if (handRaised) {
        // Lower hand
        const { error } = await supabase.from("session_messages").insert({
          tender_id: tenderId,
          user_id: userId,
          content: "Abaixou a mão",
          type: "system",
        })

        if (error) {
          console.error("Error lowering hand:", error)
          return
        }

        setHandRaised(false)
        setRaisedHands((prev) => prev.filter((id) => id !== userId))
      } else {
        // Raise hand
        const { error } = await supabase.from("session_messages").insert({
          tender_id: tenderId,
          user_id: userId,
          content: "Levantou a mão",
          type: "system",
        })

        if (error) {
          console.error("Error raising hand:", error)
          return
        }

        setHandRaised(true)
        setRaisedHands((prev) => [...prev, userId!])
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const startSession = async () => {
    try {
      const { error } = await supabase
        .from("tenders")
        .update({
          session_status: "active",
          session_start_date: new Date().toISOString(),
        })
        .eq("id", tenderId)

      if (error) {
        console.error("Error starting session:", error)
        toast({
          title: "Erro",
          description: "Não foi possível iniciar a sessão",
          variant: "destructive",
        })
        return
      }

      // Add system message
      await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: userId,
        content: "Sessão iniciada",
        type: "system",
      })

      setSessionStatus("active")
      toast({
        title: "Sucesso",
        description: "Sessão iniciada com sucesso",
      })
    } catch (err) {
      console.error("Error:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      })
    }
  }

  const endSession = async () => {
    try {
      const { error } = await supabase
        .from("tenders")
        .update({
          session_status: "ended",
          session_end_date: new Date().toISOString(),
        })
        .eq("id", tenderId)

      if (error) {
        console.error("Error ending session:", error)
        toast({
          title: "Erro",
          description: "Não foi possível encerrar a sessão",
          variant: "destructive",
        })
        return
      }

      // Add system message
      await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: userId,
        content: "Sessão encerrada",
        type: "system",
      })

      setSessionStatus("ended")
      toast({
        title: "Sucesso",
        description: "Sessão encerrada com sucesso",
      })
    } catch (err) {
      console.error("Error:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      })
    }
  }

  const toggleChat = async (enabled: boolean) => {
    setChatEnabled(enabled)

    try {
      // Add system message
      await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: userId,
        content: enabled ? "Chat habilitado" : "Chat desabilitado",
        type: "system",
      })

      toast({
        title: "Chat",
        description: enabled ? "Chat habilitado" : "Chat desabilitado",
      })
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const startTimer = async (seconds: number) => {
    setTimer(seconds)

    if (timerInterval) {
      clearInterval(timerInterval)
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimerInterval(interval)

    try {
      // Add system message
      await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: userId,
        content: `Timer iniciado: ${seconds} segundos`,
        type: "system",
      })
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const submitBid = async () => {
    if (!newBid.trim() || !currentLot) return

    try {
      const bidValue = Number.parseFloat(newBid.replace(/[^\d.,]/g, "").replace(",", "."))

      if (isNaN(bidValue)) {
        toast({
          title: "Erro",
          description: "Valor inválido",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("bids").insert({
        tender_id: tenderId,
        lot_id: currentLot,
        supplier_id: userId,
        value: bidValue,
      })

      if (error) {
        console.error("Error submitting bid:", error)
        toast({
          title: "Erro",
          description: "Não foi possível enviar o lance",
          variant: "destructive",
        })
        return
      }

      // Add system message
      await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: userId,
        content: `Lance enviado: R$ ${bidValue.toFixed(2)}`,
        type: "system",
      })

      setNewBid("")
      toast({
        title: "Sucesso",
        description: "Lance enviado com sucesso",
      })
    } catch (err) {
      console.error("Error:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      })
    }
  }

  const startNegotiation = async (supplierId: string) => {
    setSelectedSupplier(supplierId)
    setShowNegotiationDialog(true)
  }

  const submitNegotiation = async () => {
    if (!negotiationValue.trim() || !selectedSupplier || !currentLot) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    try {
      const negotiationValueNum = Number.parseFloat(negotiationValue.replace(/[^\d.,]/g, "").replace(",", "."))

      if (isNaN(negotiationValueNum)) {
        toast({
          title: "Erro",
          description: "Valor inválido",
          variant: "destructive",
        })
        return
      }

      // Add system message
      await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: userId,
        content: `Negociação iniciada com fornecedor: valor proposto R$ ${negotiationValueNum.toFixed(2)}`,
        type: "system",
      })

      setShowNegotiationDialog(false)
      setNegotiationValue("")
      toast({
        title: "Sucesso",
        description: "Negociação iniciada com sucesso",
      })
    } catch (err) {
      console.error("Error:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-muted-foreground">Carregando sessão...</p>
        </div>
      </div>
    )
  }

  if (!tender) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Licitação não encontrada ou você não tem permissão para acessá-la.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isAgency = userRole === "agency"
  const isSupplier = userRole === "supplier"
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="container mx-auto py-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Sessão Pública: {tender.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                <Badge
                  variant={
                    sessionStatus === "waiting" ? "outline" : sessionStatus === "active" ? "default" : "secondary"
                  }
                >
                  {sessionStatus === "waiting"
                    ? "Aguardando início"
                    : sessionStatus === "active"
                      ? "Em andamento"
                      : "Encerrada"}
                </Badge>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isAgency && sessionStatus === "waiting" && <Button onClick={startSession}>Iniciar Sessão</Button>}
              {isAgency && sessionStatus === "active" && (
                <Button variant="destructive" onClick={endSession}>
                  Encerrar Sessão
                </Button>
              )}
              <Button variant="outline" onClick={() => router.back()}>
                Voltar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Órgão</h3>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{tender.agency_name?.charAt(0) || "A"}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{tender.agency_name}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Data da Sessão</h3>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {tender.session_date
                    ? format(new Date(tender.session_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "Não definida"}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Participantes</h3>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{suppliers.length} fornecedores</span>
              </div>
            </div>
          </div>

          {timer !== null && timer > 0 && (
            <div className="mt-4 flex items-center justify-between bg-muted p-2 rounded-md">
              <span className="text-sm font-medium">Tempo restante:</span>
              <span className="text-lg font-bold">{formatTime(timer)}</span>
            </div>
          )}

          {isAgency && sessionStatus === "active" && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={chatEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleChat(!chatEnabled)}
                >
                  {chatEnabled ? "Desabilitar Chat" : "Habilitar Chat"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => startTimer(60)}>
                  Timer 1min
                </Button>
                <Button variant="outline" size="sm" onClick={() => startTimer(300)}>
                  Timer 5min
                </Button>
              </div>
              <div>
                {raisedHands.length > 0 && (
                  <Badge variant="outline" className="mr-2">
                    <HandRaised className="h-3 w-3 mr-1" /> {raisedHands.length}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Tabs defaultValue="chat">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="proposals">Propostas</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4 border rounded-lg p-4 h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${message.profiles?.name}`}
                        alt={message.profiles?.name}
                      />
                      <AvatarFallback>{message.profiles?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{message.profiles?.name}</p>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                {chatEnabled && (
                  <div className="flex items-center space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                    />
                    <Button onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4 border rounded-lg p-4 h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4">
                {documents.map((document, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${document.profiles?.name}`}
                        alt={document.profiles?.name}
                      />
                      <AvatarFallback>{document.profiles?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{document.profiles?.name}</p>
                      <p className="text-sm">{document.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="proposals" className="mt-4 border rounded-lg p-4 h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4">
                {proposals.map((proposal, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${proposal.profiles?.name}`}
                        alt={proposal.profiles?.name}
                      />
                      <AvatarFallback>{proposal.profiles?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{proposal.profiles?.name}</p>
                      <p className="text-sm">Valor: R$ {proposal.value.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lotes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lots.map((lot, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lote {lot.number}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentLot(lot.id)}>
                    Selecionar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {isSupplier && currentLot && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Lance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={newBid} onChange={(e) => setNewBid(e.target.value)} placeholder="Digite seu lance..." />
                <Button onClick={submitBid}>Enviar Lance</Button>
              </CardContent>
            </Card>
          )}

          {isSupplier && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Negociação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{supplier.profiles?.name}</span>
                    <Button variant="outline" size="sm" onClick={() => startNegotiation(supplier.supplier_id)}>
                      Negociar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showNegotiationDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Negociação com {selectedSupplier}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={negotiationValue}
                onChange={(e) => setNegotiationValue(e.target.value)}
                placeholder="Digite o valor da negociação..."
              />
              <Button onClick={submitNegotiation}>Enviar Valor</Button>
              <Button variant="destructive" onClick={() => setShowNegotiationDialog(false)}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

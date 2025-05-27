"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send, Clock, Hand, FileText, AlertCircle, CheckCircle, X, DollarSign } from "lucide-react"
import { useAuth } from "@/lib/supabase/auth-context"

export default function PublicSessionPage() {
  const params = useParams()
  const tenderId = params.id as string
  const { profile } = useAuth()
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("chat")
  const [isRaisingHand, setIsRaisingHand] = useState(false)
  const [bidValue, setBidValue] = useState("")
  const [currentLot, setCurrentLot] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isSupplier, setIsSupplier] = useState(false)

  // In a real app, we would fetch the tender data from an API
  // For now, we'll use mock data
  const tender = tenders.find((t) => t.id === tenderId) || tenders[0]

  useEffect(() => {
    // Check if the user is a supplier
    if (profile?.profile_type === "supplier") {
      setIsSupplier(true)
    }

    // Scroll to the bottom of the chat when new messages arrive
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }

    // Simulate countdown for bidding
    if (tender.status === "Em disputa" && countdown === null) {
      setCountdown(300) // 5 minutes in seconds
    }

    // Countdown timer
    let timer: NodeJS.Timeout
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown, profile, tender.status])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, we would send the message to an API
    console.log("Message sent:", message)
    setMessage("")
  }

  const handleRaiseHand = () => {
    setIsRaisingHand(!isRaisingHand)
    // In a real app, we would send a notification to the auctioneer
    console.log("Hand raised:", !isRaisingHand)
  }

  const handleSendBid = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, we would send the bid to an API
    console.log("Bid sent:", bidValue)
    setBidValue("")
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{tender.title}</h1>
            <p className="text-sm text-muted-foreground">
              {tender.number} • {tender.agency}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(tender.status)}>{tender.status}</Badge>
              {countdown !== null && (
                <div className="flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800">
                  <Clock className="h-4 w-4" />
                  {formatTime(countdown)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container flex flex-1 gap-4 overflow-hidden py-4">
        <div className="flex w-3/4 flex-col overflow-hidden rounded-lg border">
          <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="flex items-center justify-between border-b px-4">
              <TabsList className="h-12">
                <TabsTrigger value="chat" className="relative">
                  Chat
                  {isRaisingHand && (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="items">Itens</TabsTrigger>
                <TabsTrigger value="proposals">Propostas</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                {isSupplier && (
                  <Button
                    variant={isRaisingHand ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleRaiseHand}
                    className="gap-2"
                  >
                    <Hand className="h-4 w-4" />
                    {isRaisingHand ? "Cancelar Pedido" : "Pedir a Palavra"}
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="chat" className="flex-1 overflow-hidden p-0">
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {tender.sessionChat.map((chatMessage, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{chatMessage.time}</span>
                          <span
                            className={`text-sm font-medium ${
                              chatMessage.sender === "Pregoeiro" ? "text-primary" : "text-gray-800"
                            }`}
                          >
                            {chatMessage.sender}:
                          </span>
                        </div>
                        <p className="text-sm">{chatMessage.content}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[60px] resize-none"
                    />
                    <Button type="submit" size="icon" className="h-[60px] w-[60px]">
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="overflow-auto p-4">
              <div className="space-y-6">
                {tender.lots.map((lot, index) => (
                  <Card key={lot.id} className={currentLot === index ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {tender.judgmentCriteria === "Menor Preço por item" ? "Item" : "Lote"} {lot.id}
                        </CardTitle>
                        <Badge variant={getLotStatusBadgeVariant(lot.status || tender.status)}>
                          {lot.status || tender.status}
                        </Badge>
                      </div>
                      <CardDescription>{lot.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="px-2 py-2 text-left font-medium">Item</th>
                              <th className="px-2 py-2 text-left font-medium">Descrição</th>
                              <th className="px-2 py-2 text-left font-medium">Quantidade</th>
                              <th className="px-2 py-2 text-left font-medium">Unidade</th>
                              <th className="px-2 py-2 text-left font-medium">Valor Unitário</th>
                              <th className="px-2 py-2 text-left font-medium">Valor Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lot.items.map((item) => (
                              <tr key={item.id} className="border-b">
                                <td className="px-2 py-2">{item.id}</td>
                                <td className="px-2 py-2">{item.description}</td>
                                <td className="px-2 py-2">{item.quantity}</td>
                                <td className="px-2 py-2">{item.unit}</td>
                                <td className="px-2 py-2">R$ {item.unitPrice}</td>
                                <td className="px-2 py-2">
                                  R$ {(Number.parseFloat(item.unitPrice) * Number.parseInt(item.quantity)).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {isSupplier && tender.status === "Em disputa" && currentLot === index && (
                        <div className="mt-4">
                          <form onSubmit={handleSendBid} className="flex items-end gap-2">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor="bid">Seu Lance</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  id="bid"
                                  placeholder="0,00"
                                  value={bidValue}
                                  onChange={(e) => setBidValue(e.target.value)}
                                  className="pl-9"
                                />
                              </div>
                            </div>
                            <Button type="submit">Enviar Lance</Button>
                          </form>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="proposals" className="overflow-auto p-4">
              <div className="space-y-6">
                {tender.lots.map((lot) => (
                  <Card key={lot.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {tender.judgmentCriteria === "Menor Preço por item" ? "Item" : "Lote"} {lot.id}
                      </CardTitle>
                      <CardDescription>{lot.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="rounded-md border">
                          <div className="border-b bg-gray-50 px-4 py-2 font-medium">Classificação</div>
                          <div className="divide-y">
                            {lot.proposals?.map((proposal, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-3 ${index === 0 ? "bg-green-50" : ""}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                      index === 0 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {tender.status === "Em disputa"
                                        ? `Fornecedor ${proposal.supplier}`
                                        : proposal.supplierName}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {proposal.date} • {proposal.time}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">R$ {proposal.value}</p>
                                  {index === 0 && (
                                    <Badge variant="success" className="mt-1">
                                      Melhor lance
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="overflow-auto p-4">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos da Licitação</CardTitle>
                    <CardDescription>Documentos disponíveis para download</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tender.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between rounded-md border p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-primary" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Publicado em {doc.date} • {doc.size}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {tender.status !== "Publicada" && tender.status !== "Aguardando abertura" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Documentos de Habilitação</CardTitle>
                      <CardDescription>Documentos enviados pelos fornecedores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {tender.habilitationDocuments?.length > 0 ? (
                        <div className="space-y-4">
                          {tender.habilitationDocuments.map((doc, index) => (
                            <div key={index} className="rounded-md border p-4">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <h3 className="font-medium">
                                    {tender.status === "Em disputa" ? `Fornecedor ${doc.supplier}` : doc.supplierName}
                                  </h3>
                                </div>
                                <Badge
                                  variant={
                                    doc.status === "Aprovado"
                                      ? "success"
                                      : doc.status === "Reprovado"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {doc.status}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {doc.files.map((file, fileIndex) => (
                                  <div
                                    key={fileIndex}
                                    className="flex items-center justify-between rounded-md bg-gray-50 p-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-sm">{file.name}</span>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      Download
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed p-6 text-center">
                          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Nenhum documento de habilitação disponível.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-1/4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Informações da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <Badge variant={getStatusBadgeVariant(tender.status)} className="mt-1">
                    {tender.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Pregoeiro</h3>
                  <p className="text-sm">{tender.team?.auctioneer}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Início da Sessão</h3>
                  <p className="text-sm">{tender.sessionStartTime || tender.openingDate}</p>
                </div>
                {tender.status === "Em disputa" && (
                  <div>
                    <h3 className="text-sm font-medium">Tempo Restante</h3>
                    <div className="mt-1 flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800">
                      <Clock className="h-4 w-4" />
                      {countdown !== null ? formatTime(countdown) : "00:00"}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tender.participants?.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border p-2">
                    <div className="flex items-center gap-2">
                      {participant.type === "auctioneer" ? (
                        <Badge variant="outline" className="bg-primary/10">
                          Pregoeiro
                        </Badge>
                      ) : participant.type === "support" ? (
                        <Badge variant="outline" className="bg-blue-100">
                          Apoio
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100">
                          Fornecedor {participant.code}
                        </Badge>
                      )}
                      <span className="text-sm">
                        {participant.type === "supplier"
                          ? tender.status === "Em disputa"
                            ? `Fornecedor ${participant.code}`
                            : participant.name
                          : participant.name}
                      </span>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {tender.status === "Em disputa" && isSupplier && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Solicitar Esclarecimento
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <X className="h-4 w-4" />
                    Cancelar Último Lance
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Confirmar Proposta
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions for badges
function getStatusBadgeVariant(status: string) {
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

function getLotStatusBadgeVariant(status: string) {
  switch (status) {
    case "Em disputa":
      return "warning"
    case "Em negociação":
      return "default"
    case "Em habilitação":
      return "secondary"
    case "Declarado vencedor":
      return "success"
    case "Em recurso":
      return "destructive"
    case "Homologado":
      return "success"
    case "Fracassado":
      return "destructive"
    case "Deserto":
      return "outline"
    default:
      return getStatusBadgeVariant(status)
  }
}

// Mock data for a tender
const tenders = [
  {
    id: "1",
    title: "Aquisição de equipamentos de informática",
    number: "Pregão Eletrônico nº 001/2025",
    processNumber: "123456/2025",
    agency: "Ministério da Educação",
    status: "Em disputa",
    modality: "Pregão Eletrônico",
    category: "Aquisição de bens",
    judgmentCriteria: "Menor Preço por item",
    disputeMode: "Aberto",
    openingDate: "10/06/2025 às 10:00",
    publicationDate: "01/06/2025",
    exclusiveMeEpp: true,
    sessionStartTime: "10/06/2025 10:00:00",
    object:
      "Aquisição de equipamentos de informática, incluindo computadores, notebooks, impressoras e periféricos para atender às necessidades do Ministério da Educação, conforme condições, quantidades e exigências estabelecidas neste Edital e seus anexos.",
    team: {
      auctioneer: "João Silva",
      authority: "Carlos Ferreira",
      supportTeam: ["Maria Santos", "Pedro Oliveira", "Ana Costa"],
    },
    lots: [
      {
        id: 1,
        description: "Computadores e Notebooks",
        status: "Em disputa",
        proposals: [
          {
            supplier: "F1",
            supplierName: "Empresa ABC Informática",
            value: "245.000,00",
            date: "10/06/2025",
            time: "10:30:15",
          },
          {
            supplier: "F2",
            supplierName: "Empresa XYZ Tecnologia",
            value: "248.500,00",
            date: "10/06/2025",
            time: "10:28:45",
          },
          {
            supplier: "F3",
            supplierName: "Empresa DEF Comércio",
            value: "252.000,00",
            date: "10/06/2025",
            time: "10:25:30",
          },
        ],
        items: [
          {
            id: 1,
            description: "Computador Desktop - Processador Intel Core i7, 16GB RAM, SSD 512GB",
            quantity: "50",
            unit: "UN",
            unitPrice: "5200.00",
          },
          {
            id: 2,
            description: "Notebook - Processador Intel Core i5, 8GB RAM, SSD 256GB",
            quantity: "30",
            unit: "UN",
            unitPrice: "4300.00",
          },
        ],
      },
      {
        id: 2,
        description: "Impressoras e Scanners",
        status: "Aguardando disputa",
        proposals: [
          {
            supplier: "F2",
            supplierName: "Empresa XYZ Tecnologia",
            value: "43.500,00",
            date: "10/06/2025",
            time: "10:15:20",
          },
          {
            supplier: "F1",
            supplierName: "Empresa ABC Informática",
            value: "45.000,00",
            date: "10/06/2025",
            time: "10:12:35",
          },
          {
            supplier: "F4",
            supplierName: "Empresa GHI Equipamentos",
            value: "46.800,00",
            date: "10/06/2025",
            time: "10:10:15",
          },
        ],
        items: [
          {
            id: 1,
            description: "Impressora Multifuncional Laser Colorida",
            quantity: "10",
            unit: "UN",
            unitPrice: "2800.00",
          },
          {
            id: 2,
            description: "Scanner de Mesa com Alimentador Automático",
            quantity: "5",
            unit: "UN",
            unitPrice: "1500.00",
          },
        ],
      },
    ],
    documents: [
      {
        name: "Edital - Pregão Eletrônico nº 001/2025",
        date: "01/06/2025",
        size: "2.5 MB",
        url: "#",
      },
      {
        name: "Termo de Referência",
        date: "01/06/2025",
        size: "1.8 MB",
        url: "#",
      },
      {
        name: "Estudo Técnico Preliminar",
        date: "01/06/2025",
        size: "1.2 MB",
        url: "#",
      },
      {
        name: "Minuta de Contrato",
        date: "01/06/2025",
        size: "950 KB",
        url: "#",
      },
    ],
    habilitationDocuments: [
      {
        supplier: "F1",
        supplierName: "Empresa ABC Informática",
        status: "Em análise",
        files: [
          { name: "Contrato Social.pdf", url: "#" },
          { name: "Certidão Negativa de Débitos.pdf", url: "#" },
          { name: "Atestado de Capacidade Técnica.pdf", url: "#" },
        ],
      },
    ],
    sessionChat: [
      {
        time: "10/06/2025 10:00:00",
        sender: "Sistema",
        content: "A sessão pública foi iniciada.",
      },
      {
        time: "10/06/2025 10:01:23",
        sender: "Pregoeiro",
        content: "Bom dia a todos. Vamos iniciar a análise das propostas.",
      },
      {
        time: "10/06/2025 10:15:45",
        sender: "Sistema",
        content: "As propostas foram analisadas e o processo foi aberto.",
      },
      {
        time: "10/06/2025 10:16:12",
        sender: "Pregoeiro",
        content: "Todas as propostas foram classificadas. Vamos iniciar a fase de lances.",
      },
      {
        time: "10/06/2025 10:16:30",
        sender: "Sistema",
        content: "O item 0001 foi aberto para lances.",
      },
      {
        time: "10/06/2025 10:20:15",
        sender: "Fornecedor F1",
        content: "Pregoeiro, qual o valor mínimo entre lances?",
      },
      {
        time: "10/06/2025 10:21:00",
        sender: "Pregoeiro",
        content: "O valor mínimo entre lances é de R$ 100,00 ou 0,1%, conforme edital.",
      },
      {
        time: "10/06/2025 10:25:30",
        sender: "Sistema",
        content: "O fornecedor F3 enviou lance de R$ 252.000,00 para o lote 1.",
      },
      {
        time: "10/06/2025 10:28:45",
        sender: "Sistema",
        content: "O fornecedor F2 enviou lance de R$ 248.500,00 para o lote 1.",
      },
      {
        time: "10/06/2025 10:30:15",
        sender: "Sistema",
        content: "O fornecedor F1 enviou lance de R$ 245.000,00 para o lote 1.",
      },
    ],
    participants: [
      {
        name: "João Silva",
        type: "auctioneer",
        code: null,
      },
      {
        name: "Maria Santos",
        type: "support",
        code: null,
      },
      {
        name: "Empresa ABC Informática",
        type: "supplier",
        code: "F1",
      },
      {
        name: "Empresa XYZ Tecnologia",
        type: "supplier",
        code: "F2",
      },
      {
        name: "Empresa DEF Comércio",
        type: "supplier",
        code: "F3",
      },
      {
        name: "Empresa GHI Equipamentos",
        type: "supplier",
        code: "F4",
      },
    ],
  },
]

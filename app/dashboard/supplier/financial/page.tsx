"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
  BarChart,
  ArrowUpRight,
} from "lucide-react"

export default function FinancialPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("plan")
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [planDuration, setPlanDuration] = useState("annual")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")

  const handleRenewPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // In a real app, we would process the payment through a payment gateway
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

      toast({
        title: "Plano renovado com sucesso",
        description: "Seu plano foi renovado e já está ativo.",
      })

      setIsRenewDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro ao renovar plano",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim()
      .substring(0, 19)
  }

  const formatCardExpiry = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(?=\d)/, "$1/")
      .substring(0, 5)
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatCardExpiry(e.target.value))
  }

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/\D/g, "").substring(0, 3))
  }

  const getPlanPrice = () => {
    switch (planDuration) {
      case "quarterly":
        return "R$ 450,00"
      case "semiannual":
        return "R$ 750,00"
      case "annual":
        return "R$ 1.200,00"
      default:
        return "R$ 1.200,00"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Posição Financeira</h1>
        <p className="text-muted-foreground">Gerencie seu plano e visualize seu histórico financeiro</p>
      </div>

      <Tabs defaultValue="plan" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="plan">Plano Atual</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
          <TabsTrigger value="history">Histórico de Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>Informações sobre seu plano atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Plano Anual</h3>
                    <p className="text-sm text-muted-foreground">Acesso a todas as funcionalidades do sistema</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50">
                    Ativo
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Validade:</span>
                    <span className="text-sm font-medium">05/06/2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Valor:</span>
                    <span className="text-sm font-medium">R$ 1.200,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <span className="text-sm font-medium text-green-600">Ativo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Renovação Automática:</span>
                    <span className="text-sm font-medium">Sim</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-4 font-medium">Benefícios do Plano</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Participação ilimitada em licitações</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Alertas personalizados de novas licitações</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Acesso a histórico completo de licitações</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Relatórios detalhados de participação</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Renovar Plano</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Renovar Plano</DialogTitle>
                    <DialogDescription>Escolha a duração do plano e a forma de pagamento</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRenewPlan}>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Duração do Plano</Label>
                        <RadioGroup
                          value={planDuration}
                          onValueChange={setPlanDuration}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="quarterly" id="quarterly" />
                            <Label htmlFor="quarterly" className="flex items-center justify-between w-full">
                              <span>Trimestral</span>
                              <span className="font-medium">R$ 450,00</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="semiannual" id="semiannual" />
                            <Label htmlFor="semiannual" className="flex items-center justify-between w-full">
                              <span>Semestral</span>
                              <span className="font-medium">R$ 750,00</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="annual" id="annual" />
                            <Label htmlFor="annual" className="flex items-center justify-between w-full">
                              <span>Anual</span>
                              <span className="font-medium">R$ 1.200,00</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <RadioGroup
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="credit_card" id="credit_card" />
                            <Label htmlFor="credit_card" className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              <span>Cartão de Crédito</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pix" id="pix" />
                            <Label htmlFor="pix" className="flex items-center gap-2">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M11.6666 2.66675L13.3333 4.33341M13.3333 4.33341L11.6666 6.00008M13.3333 4.33341H10.6666C9.78216 4.33341 8.93426 4.68469 8.30913 5.30982C7.684 5.93494 7.33331 6.78284 7.33331 7.66675V8.00008M4.33331 13.3334L2.66665 11.6667M2.66665 11.6667L4.33331 10.0001M2.66665 11.6667H5.33331C6.21722 11.6667 7.06512 11.3155 7.69025 10.6903C8.31537 10.0652 8.66665 9.21733 8.66665 8.33341V8.00008M11.6666 11.6667C11.6666 12.0203 11.8071 12.3595 12.0571 12.6095C12.3072 12.8596 12.6463 13.0001 13 13.0001C13.3536 13.0001 13.6928 12.8596 13.9428 12.6095C14.1929 12.3595 14.3333 12.0203 14.3333 11.6667C14.3333 11.3131 14.1929 10.9739 13.9428 10.7239C13.6928 10.4738 13.3536 10.3334 13 10.3334C12.6463 10.3334 12.3072 10.4738 12.0571 10.7239C11.8071 10.9739 11.6666 11.3131 11.6666 11.6667ZM1.66665 4.33341C1.66665 4.68699 1.80712 5.02618 2.05717 5.27622C2.30722 5.52627 2.6464 5.66675 2.99998 5.66675C3.35355 5.66675 3.69274 5.52627 3.94279 5.27622C4.19284 5.02618 4.33331 4.68699 4.33331 4.33341C4.33331 3.97984 4.19284 3.64065 3.94279 3.3906C3.69274 3.14056 3.35355 3.00008 2.99998 3.00008C2.6464 3.00008 2.30722 3.14056 2.05717 3.3906C1.80712 3.64065 1.66665 3.97984 1.66665 4.33341Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span>PIX</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="boleto" id="boleto" />
                            <Label htmlFor="boleto" className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Boleto Bancário</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {paymentMethod === "credit_card" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="card_number">Número do Cartão</Label>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="card_number"
                                placeholder="0000 0000 0000 0000"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="card_name">Nome no Cartão</Label>
                            <Input
                              id="card_name"
                              placeholder="Nome como está no cartão"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="card_expiry">Validade</Label>
                              <Input
                                id="card_expiry"
                                placeholder="MM/AA"
                                value={cardExpiry}
                                onChange={handleCardExpiryChange}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="card_cvv">CVV</Label>
                              <Input
                                id="card_cvv"
                                placeholder="123"
                                value={cardCvv}
                                onChange={handleCardCvvChange}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "pix" && (
                        <div className="space-y-4">
                          <div className="rounded-md border p-4 text-center">
                            <div className="mx-auto mb-2 h-32 w-32 bg-gray-100 flex items-center justify-center">
                              <svg
                                width="100"
                                height="100"
                                viewBox="0 0 100 100"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <rect width="100" height="100" fill="white" />
                                <path
                                  d="M20 20H30V30H20V20ZM30 30H40V40H30V30ZM40 40H50V50H40V40ZM50 50H60V60H50V50ZM60 60H70V70H60V60ZM70 70H80V80H70V70ZM20 40H30V50H20V40ZM40 20H50V30H40V20ZM50 30H60V40H50V30ZM60 40H70V50H60V40ZM70 50H80V60H70V50ZM20 60H30V70H20V60ZM30 70H40V80H30V70ZM50 70H60V80H50V70ZM20 80H30V90H20V80ZM40 80H50V90H40V80ZM60 80H70V90H60V80ZM80 20H90V30H80V20ZM80 40H90V50H80V40ZM80 80H90V90H80V80Z"
                                  fill="black"
                                />
                              </svg>
                            </div>
                            <p className="text-sm font-medium">Escaneie o QR Code para pagar</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              O pagamento será confirmado automaticamente
                            </p>
                            <div className="mt-4">
                              <Button variant="outline" size="sm" className="w-full">
                                Copiar código PIX
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "boleto" && (
                        <div className="space-y-4">
                          <div className="rounded-md border p-4">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">Boleto Bancário</p>
                                <p className="text-sm text-muted-foreground">O boleto será gerado após a confirmação</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <p className="text-sm">
                                <span className="font-medium">Valor:</span> {getPlanPrice()}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Vencimento:</span> 5 dias úteis
                              </p>
                            </div>
                            <div className="mt-4">
                              <Button variant="outline" size="sm" className="w-full">
                                Gerar Boleto
                              </Button>
                            </div>
                          </div>
                          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div className="ml-3">
                                <p>
                                  O plano será ativado somente após a confirmação do pagamento do boleto, o que pode
                                  levar até 3 dias úteis.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isProcessing}>
                        {isProcessing ? "Processando..." : `Pagar ${getPlanPrice()}`}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Licitações Participadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">42</p>
                    <p className="text-sm text-muted-foreground">Nos últimos 12 meses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Licitações Vencidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">15</p>
                    <p className="text-sm text-muted-foreground">Nos últimos 12 meses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-purple-100 p-3">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">R$ 1.2M</p>
                    <p className="text-sm text-muted-foreground">Em contratos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Faturas</CardTitle>
              <CardDescription>Histórico de faturas emitidas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-sm font-medium">
                  <div className="col-span-3">Número</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2">Valor</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3 text-right">Ações</div>
                </div>
                <div className="divide-y">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="grid grid-cols-12 items-center px-4 py-3">
                      <div className="col-span-3">{invoice.number}</div>
                      <div className="col-span-2 text-sm">{invoice.date}</div>
                      <div className="col-span-2 text-sm">{invoice.amount}</div>
                      <div className="col-span-2">
                        <Badge
                          variant={
                            invoice.status === "Pago"
                              ? "success"
                              : invoice.status === "Pendente"
                                ? "warning"
                                : "default"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="col-span-3 flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>XML</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>Histórico de todos os pagamentos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-sm font-medium">
                  <div className="col-span-3">Descrição</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-2">Valor</div>
                  <div className="col-span-2">Método</div>
                  <div className="col-span-3 text-right">Status</div>
                </div>
                <div className="divide-y">
                  {payments.map((payment) => (
                    <div key={payment.id} className="grid grid-cols-12 items-center px-4 py-3">
                      <div className="col-span-3">{payment.description}</div>
                      <div className="col-span-2 text-sm">{payment.date}</div>
                      <div className="col-span-2 text-sm">{payment.amount}</div>
                      <div className="col-span-2 flex items-center gap-1 text-sm">
                        {payment.method === "Cartão de Crédito" ? (
                          <CreditCard className="h-3.5 w-3.5" />
                        ) : payment.method === "PIX" ? (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11.6666 2.66675L13.3333 4.33341M13.3333 4.33341L11.6666 6.00008M13.3333 4.33341H10.6666C9.78216 4.33341 8.93426 4.68469 8.30913 5.30982C7.684 5.93494 7.33331 6.78284 7.33331 7.66675V8.00008M4.33331 13.3334L2.66665 11.6667M2.66665 11.6667L4.33331 10.0001M2.66665 11.6667H5.33331C6.21722 11.6667 7.06512 11.3155 7.69025 10.6903C8.31537 10.0652 8.66665 9.21733 8.66665 8.33341V8.00008M11.6666 11.6667C11.6666 12.0203 11.8071 12.3595 12.0571 12.6095C12.3072 12.8596 12.6463 13.0001 13 13.0001C13.3536 13.0001 13.6928 12.8596 13.9428 12.6095C14.1929 12.3595 14.3333 12.0203 14.3333 11.6667C14.3333 11.3131 14.1929 10.9739 13.9428 10.7239C13.6928 10.4738 13.3536 10.3334 13 10.3334C12.6463 10.3334 12.3072 10.4738 12.0571 10.7239C11.8071 10.9739 11.6666 11.3131 11.6666 11.6667ZM1.66665 4.33341C1.66665 4.68699 1.80712 5.02618 2.05717 5.27622C2.30722 5.52627 2.6464 5.66675 2.99998 5.66675C3.35355 5.66675 3.69274 5.52627 3.94279 5.27622C4.19284 5.02618 4.33331 4.68699 4.33331 4.33341C4.33331 3.97984 4.19284 3.64065 3.94279 3.3906C3.69274 3.14056 3.35355 3.00008 2.99998 3.00008C2.6464 3.00008 2.30722 3.14056 2.05717 3.3906C1.80712 3.64065 1.66665 3.97984 1.66665 4.33341Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        <span>{payment.method}</span>
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-1">
                        {payment.status === "Aprovado" ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-sm text-green-600">Aprovado</span>
                          </>
                        ) : payment.status === "Pendente" ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                            <span className="text-sm text-yellow-600">Pendente</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <span className="text-sm text-red-600">Recusado</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>Visão geral das suas finanças</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <Wallet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Investido</p>
                      <p className="text-xl font-bold">R$ 3.600,00</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>Aumento de 20% em relação ao ano anterior</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <BarChart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Retorno sobre Investimento</p>
                      <p className="text-xl font-bold">R$ 1.200.000,00</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>ROI de 333x</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Próximo Pagamento</p>
                      <p className="text-xl font-bold">05/06/2026</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span>Em 365 dias</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Mock data for invoices
const invoices = [
  {
    id: "1",
    number: "NF-e 000001",
    date: "05/06/2025",
    amount: "R$ 1.200,00",
    status: "Pago",
  },
  {
    id: "2",
    number: "NF-e 000002",
    date: "05/06/2024",
    amount: "R$ 1.200,00",
    status: "Pago",
  },
  {
    id: "3",
    number: "NF-e 000003",
    date: "05/06/2023",
    amount: "R$ 1.200,00",
    status: "Pago",
  },
]

// Mock data for payments
const payments = [
  {
    id: "1",
    description: "Renovação de Plano Anual",
    date: "05/06/2025",
    amount: "R$ 1.200,00",
    method: "Cartão de Crédito",
    status: "Aprovado",
  },
  {
    id: "2",
    description: "Renovação de Plano Anual",
    date: "05/06/2024",
    amount: "R$ 1.200,00",
    method: "PIX",
    status: "Aprovado",
  },
  {
    id: "3",
    description: "Renovação de Plano Anual",
    date: "05/06/2023",
    amount: "R$ 1.200,00",
    method: "Boleto",
    status: "Aprovado",
  },
  {
    id: "4",
    description: "Tentativa de Pagamento",
    date: "04/06/2023",
    amount: "R$ 1.200,00",
    method: "Cartão de Crédito",
    status: "Recusado",
  },
]

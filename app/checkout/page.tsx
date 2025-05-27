"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, FileText, Check, ArrowLeft, Loader2 } from "lucide-react"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const [planType, setPlanType] = useState("")
  const [planPrice, setPlanPrice] = useState(0)
  const [planDuration, setPlanDuration] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Formulário de cartão
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")

  // Dados do cliente
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [document, setDocument] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    const plan = searchParams.get("plan")

    if (plan === "trimestral") {
      setPlanType("Trimestral")
      setPlanPrice(600)
      setPlanDuration("90 dias")
    } else if (plan === "semestral") {
      setPlanType("Semestral")
      setPlanPrice(720)
      setPlanDuration("180 dias")
    } else if (plan === "anual") {
      setPlanType("Anual")
      setPlanPrice(880)
      setPlanDuration("365 dias")
    } else {
      // Plano padrão se nenhum for especificado
      setPlanType("Trimestral")
      setPlanPrice(600)
      setPlanDuration("90 dias")
    }
  }, [searchParams])

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

  const formatDocument = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      .substring(0, 14)
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 15)
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

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocument(formatDocument(e.target.value))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica
    if (paymentMethod === "credit_card") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        toast({
          title: "Dados incompletos",
          description: "Por favor, preencha todos os dados do cartão.",
          variant: "destructive",
        })
        return
      }
    }

    if (!name || !email || !document) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os dados pessoais.",
        variant: "destructive",
      })
      return
    }

    // Simulação de processamento
    setIsProcessing(true)

    try {
      // Simula uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simula sucesso
      setIsProcessing(false)
      setIsSuccess(true)

      toast({
        title: "Pagamento realizado com sucesso!",
        description: `Seu plano ${planType} foi ativado.`,
      })

      // Após 3 segundos, redireciona para a página inicial
      setTimeout(() => {
        router.push("/dashboard/supplier")
      }, 3000)
    } catch (error) {
      setIsProcessing(false)

      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
            <CardDescription>Seu plano {planType} foi ativado com sucesso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Detalhes da compra</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Plano:</span>
                  <span className="font-medium">{planType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(planPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duração:</span>
                  <span className="font-medium">{planDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método de pagamento:</span>
                  <span className="font-medium">
                    {paymentMethod === "credit_card"
                      ? "Cartão de Crédito"
                      : paymentMethod === "pix"
                        ? "PIX"
                        : "Boleto Bancário"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Você será redirecionado para o dashboard em instantes...
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/dashboard/supplier")}>
              Ir para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para a página inicial
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Pagamento</CardTitle>
                <CardDescription>Preencha os dados abaixo para finalizar sua compra</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dados Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          placeholder="Digite seu nome completo"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="document">CPF</Label>
                        <Input
                          id="document"
                          placeholder="000.000.000-00"
                          value={document}
                          onChange={handleDocumentChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" placeholder="(00) 00000-0000" value={phone} onChange={handlePhoneChange} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Forma de Pagamento</h3>
                    <Tabs defaultValue="credit_card" onValueChange={setPaymentMethod}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="credit_card" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Cartão</span>
                        </TabsTrigger>
                        <TabsTrigger value="pix" className="flex items-center gap-2">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
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
                        </TabsTrigger>
                        <TabsTrigger value="boleto" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Boleto</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="credit_card" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="card_number">Número do Cartão</Label>
                          <Input
                            id="card_number"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="card_name">Nome no Cartão</Label>
                          <Input
                            id="card_name"
                            placeholder="Nome como está no cartão"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
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
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="card_cvv">CVV</Label>
                            <Input id="card_cvv" placeholder="123" value={cardCvv} onChange={handleCardCvvChange} />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="pix" className="mt-4">
                        <div className="rounded-md border p-4 text-center">
                          <div className="mx-auto mb-2 h-48 w-48 bg-gray-100 flex items-center justify-center">
                            <svg
                              width="180"
                              height="180"
                              viewBox="0 0 180 180"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect width="180" height="180" fill="white" />
                              <path
                                d="M20 20H40V40H20V20ZM40 40H60V60H40V40ZM60 60H80V80H60V60ZM80 80H100V100H80V80ZM100 100H120V120H100V100ZM120 120H140V140H120V120ZM20 60H40V80H20V60ZM60 20H80V40H60V20ZM80 40H100V60H80V40ZM100 60H120V80H100V60ZM120 80H140V100H120V80ZM20 100H40V120H20V100ZM40 120H60V140H40V120ZM80 120H100V140H80V120ZM20 140H40V160H20V140ZM60 140H80V160H60V140ZM100 140H120V160H100V140ZM140 20H160V40H140V20ZM140 60H160V80H140V60ZM140 140H160V160H140V140Z"
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
                      </TabsContent>

                      <TabsContent value="boleto" className="mt-4">
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
                              <span className="font-medium">Valor:</span>{" "}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(planPrice)}
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
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full" disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        `Finalizar Pagamento - ${new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(planPrice)}`
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Plano {planType}</h3>
                    <p className="text-sm text-muted-foreground mb-4">Acesso por {planDuration}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Acesso a todas as licitações</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Boletim de Editais</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Participação limitada em licitações pelo período</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Assistência Técnica por Telefone</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(planPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Impostos</span>
                      <span>Inclusos</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(planPrice)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 text-sm text-center text-muted-foreground">
              Ao finalizar a compra, você concorda com nossos{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Termos de Serviço
              </a>{" "}
              e{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Política de Privacidade
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Download, TrendingUp, ArrowUpRight, DollarSign } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function FinancialDashboardPage() {
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [tenderStats, setTenderStats] = useState<any>({
    participated: 0,
    won: 0,
    totalValue: 0,
  })
  const [paymentMethod, setPaymentMethod] = useState("pix")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("monthly")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [monthlyActivity, setMonthlyActivity] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      try {
        // Get user info
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setError("Usuário não autenticado")
          setLoading(false)
          return
        }

        setUserId(user.id)

        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)
          setError("Erro ao carregar dados do perfil")
          setLoading(false)
          return
        }

        setProfile(profileData)

        // Get subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (!subscriptionError) {
          setSubscription(subscriptionData)
        }

        // Get invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from("invoices")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (invoicesError) {
          console.error("Error fetching invoices:", invoicesError)
        } else {
          setInvoices(invoicesData || [])
        }

        // Get tender stats
        const { data: participatedData, error: participatedError } = await supabase
          .from("tender_suppliers")
          .select("tender_id")
          .eq("supplier_id", user.id)

        if (participatedError) {
          console.error("Error fetching participated tenders:", participatedError)
        } else {
          const participated = participatedData?.length || 0
          setTenderStats((prev) => ({ ...prev, participated }))
        }

        // Get won tenders
        const { data: wonData, error: wonError } = await supabase
          .from("tender_lots")
          .select("id, value")
          .eq("winner_id", user.id)

        if (wonError) {
          console.error("Error fetching won tenders:", wonError)
        } else {
          const won = wonData?.length || 0
          const totalValue = wonData?.reduce((sum, lot) => sum + Number.parseFloat(lot.value || "0"), 0) || 0
          setTenderStats((prev) => ({ ...prev, won, totalValue }))
        }

        // Generate monthly activity data
        const months = []
        for (let i = 0; i < 6; i++) {
          const month = subMonths(new Date(), i)
          const startDate = startOfMonth(month)
          const endDate = endOfMonth(month)

          // Get tenders participated in this month
          const { data: monthParticipatedData } = await supabase
            .from("tender_suppliers")
            .select("created_at")
            .eq("supplier_id", user.id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())

          // Get tenders won in this month
          const { data: monthWonData } = await supabase
            .from("tender_lots")
            .select("created_at")
            .eq("winner_id", user.id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())

          months.push({
            month: format(month, "MMM", { locale: ptBR }),
            participated: monthParticipatedData?.length || 0,
            won: monthWonData?.length || 0,
          })
        }

        setMonthlyActivity(months.reverse())
      } catch (err) {
        console.error("Error:", err)
        setError("Ocorreu um erro ao carregar os dados")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handlePayment = async () => {
    setProcessingPayment(true)
    setError(null)

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create subscription
      const now = new Date()
      const endDate = new Date()

      if (selectedPlan === "monthly") {
        endDate.setMonth(now.getMonth() + 1)
      } else if (selectedPlan === "quarterly") {
        endDate.setMonth(now.getMonth() + 3)
      } else if (selectedPlan === "yearly") {
        endDate.setFullYear(now.getFullYear() + 1)
      }

      const planPrices = {
        monthly: 99.9,
        quarterly: 269.7,
        yearly: 999.0,
      }

      const price = planPrices[selectedPlan as keyof typeof planPrices]

      // Create subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan: selectedPlan,
          status: "active",
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          price,
        })
        .select()
        .single()

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError)
        setError("Erro ao criar assinatura")
        setProcessingPayment(false)
        return
      }

      // Create invoice
      const { error: invoiceError } = await supabase.from("invoices").insert({
        user_id: userId,
        subscription_id: subscriptionData.id,
        amount: price,
        status: "paid",
        payment_method: paymentMethod,
        description: `Assinatura ${selectedPlan === "monthly" ? "Mensal" : selectedPlan === "quarterly" ? "Trimestral" : "Anual"}`,
      })

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError)
        setError("Erro ao criar fatura")
        setProcessingPayment(false)
        return
      }

      setSubscription(subscriptionData)
      setShowPaymentDialog(false)
      setSuccess("Pagamento processado com sucesso! Sua assinatura está ativa.")

      // Refresh invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      setInvoices(invoicesData || [])
    } catch (err) {
      console.error("Error:", err)
      setError("Ocorreu um erro ao processar o pagamento")
    } finally {
      setProcessingPayment(false)
    }
  }

  const downloadInvoice = (invoice: any) => {
    // In a real application, this would generate and download a PDF invoice
    alert(`Baixando fatura ${invoice.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  const isSubscriptionActive =
    subscription && subscription.status === "active" && new Date(subscription.end_date) > new Date()

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura e visualize suas faturas</p>
        </div>

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="my-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Sucesso</AlertTitle>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Licitações Participadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenderStats.participated}</div>
              <p className="text-xs text-muted-foreground">Total de licitações que você participou</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Licitações Vencidas</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenderStats.won}</div>
              <p className="text-xs text-muted-foreground">Total de licitações que você venceu</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenderStats.participated > 0
                  ? `${((tenderStats.won / tenderStats.participated) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">Percentual de licitações vencidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {tenderStats.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Valor total das licitações vencidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tender Impugnation/Clarification Management Page */}
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Gerenciamento de Impugnações e Clarificações de Licitações
          </h2>
          <p className="text-muted-foreground">
            Aqui você pode gerenciar suas impugnações e solicitações de esclarecimento de licitações.
          </p>
        </div>

        {/* Monthly Activity Table */}
        <div>
          <h2 className="text-xl font-bold tracking-tight">Atividade Mensal</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Participações</TableHead>
                <TableHead>Vitórias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyActivity.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell>{activity.month}</TableCell>
                  <TableCell>{activity.participated}</TableCell>
                  <TableCell>{activity.won}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Invoices Table */}
        <div>
          <h2 className="text-xl font-bold tracking-tight">Faturas</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice, index) => (
                <TableRow key={index}>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>{format(new Date(invoice.created_at), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    R$ {invoice.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "paid" ? "success" : "default"}>
                      {invoice.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => downloadInvoice(invoice)} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogTrigger asChild>
            <Button disabled={isSubscriptionActive} variant="default">
              {isSubscriptionActive ? "Assinatura Ativa" : "Assinar"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assinar Plano</DialogTitle>
              <DialogDescription>Selecione o plano que deseja assinar e conclua o pagamento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plan" className="text-right">
                  Plano
                </Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentMethod" className="text-right">
                  Método de Pagamento
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Selecione um método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "credit_card" && (
                <div className="grid gap-2">
                  <Input
                    id="cardNumber"
                    label="Número do Cartão"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                  <Input
                    id="cardName"
                    label="Nome no Cartão"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                  <Input
                    id="cardExpiry"
                    label="Validade"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                  />
                  <Input id="cardCvv" label="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePayment} disabled={processingPayment}>
                {processingPayment ? "Processando..." : "Pagar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

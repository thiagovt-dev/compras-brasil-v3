import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default async function InvoicesPage() {
  const supabase = createServerComponentClient({ cookies })

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faturas</h1>
          <p className="text-muted-foreground">Você precisa estar logado para visualizar suas faturas.</p>
        </div>
      </div>
    )
  }

  // Fetch invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      transaction:payment_transactions(*)
    `)
    .eq("user_id", user.id)
    .order("issue_date", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faturas</h1>
        <p className="text-muted-foreground">Visualize e baixe suas faturas</p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>Todas as faturas emitidas para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 border-b bg-muted px-4 py-3 text-sm font-medium">
                <div className="col-span-3">Número</div>
                <div className="col-span-2">Data</div>
                <div className="col-span-2">Valor</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Ações</div>
              </div>
              <div className="divide-y">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="grid grid-cols-12 items-center px-4 py-3">
                    <div className="col-span-3">{invoice.invoice_number}</div>
                    <div className="col-span-2 text-sm">
                      {format(new Date(invoice.issue_date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <div className="col-span-2 text-sm">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(invoice.amount)}
                    </div>
                    <div className="col-span-2">
                      <InvoiceStatusBadge status={invoice.status} />
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
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma fatura encontrada</h3>
              <p className="mt-2 text-sm text-muted-foreground">Você ainda não possui faturas emitidas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "issued":
      return <Badge variant="outline">Emitida</Badge>
    case "paid":
      return <Badge variant="success">Paga</Badge>
    case "canceled":
      return <Badge variant="destructive">Cancelada</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

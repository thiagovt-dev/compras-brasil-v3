import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, FileText, Plus } from "lucide-react"

export default async function SupplierProposalsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  // Check if user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.profile_type !== "supplier") {
    redirect("/dashboard")
  }

  // Get supplier proposals with only existing columns
  const { data: proposals, error } = await supabase
    .from("proposals")
    .select(`
      *,
      tenders!inner(
        id,
        title,
        status
      )
    `)
    .eq("supplier_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching proposals:", error)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" }
    > = {
      draft: { label: "Rascunho", variant: "outline" },
      submitted: { label: "Enviada", variant: "default" },
      under_analysis: { label: "Em Análise", variant: "secondary" },
      accepted: { label: "Aceita", variant: "default" },
      rejected: { label: "Rejeitada", variant: "destructive" },
      winner: { label: "Vencedora", variant: "default" },
    }

    const config = statusConfig[status] || { label: status, variant: "outline" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não definida"
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString))
    } catch (error) {
      return "Data inválida"
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minhas Propostas</h1>
          <p className="text-muted-foreground">Gerencie suas propostas para licitações</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/supplier/tenders">
            <Plus className="mr-2 h-4 w-4" />
            Nova Proposta
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals && proposals.length > 0 ? (
          proposals.map((proposal) => (
            <Card key={proposal.id} className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium line-clamp-2">
                    {proposal.tenders?.title || "Licitação sem título"}
                  </CardTitle>
                  {getStatusBadge(proposal.status)}
                </div>
                <CardDescription>
                  ID: {proposal.tenders?.id || "N/A"}
                  {proposal.lot_id && ` - Lote ${proposal.lot_id}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2 space-y-2 flex-grow">
                <div className="text-sm">
                  <span className="font-medium">Valor Total:</span> {formatCurrency(proposal.total_value || 0)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Enviada em:</span> {formatDate(proposal.created_at || "")}
                </div>
                {proposal.updated_at && proposal.updated_at !== proposal.created_at && (
                  <div className="text-sm">
                    <span className="font-medium">Atualizada em:</span> {formatDate(proposal.updated_at)}
                  </div>
                )}
                {proposal.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Observações:</span>
                    <p className="text-muted-foreground mt-1 line-clamp-2">{proposal.notes}</p>
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Status da Licitação:</span>
                  <Badge variant="outline" className="ml-2">
                    {proposal.tenders?.status || "N/A"}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/supplier/proposals/${proposal.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Detalhes
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-8 text-center border rounded-lg bg-muted">
            <p className="text-muted-foreground">Você ainda não enviou nenhuma proposta.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/supplier/tenders">Ver Licitações Disponíveis</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

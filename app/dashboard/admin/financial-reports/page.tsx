import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { BarChart, FileText, TrendingUp } from "lucide-react"
// import { FinancialReportsList } from "@/components/financial-reports-list"
// import { FinancialReportsSummary } from "@/components/financial-reports-summary"
// import { FinancialReportsChart } from "@/components/financial-reports-chart"

export default async function FinancialReportsPage() {
  const supabase = createServerComponentClient({ cookies })

  // Verificar se o usuário é administrador
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.profile_type !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  // Buscar relatórios financeiros
  const { data: reports } = await supabase
    .from("financial_reports")
    .select("*")
    .order("created_at", { ascending: false })

  // Calcular estatísticas
  const totalRevenue = reports?.reduce((sum, report) => sum + (report.total_revenue || 0), 0) || 0
  const totalTransactions = reports?.reduce((sum, report) => sum + (report.total_transactions || 0), 0) || 0
  const publishedReports = reports?.filter((report) => report.status === "published").length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
        <p className="text-muted-foreground">Visualize e gerencie os relatórios financeiros da plataforma</p>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{(totalRevenue * 0.05).toFixed(2)}% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              +{(totalTransactions * 0.02).toFixed(0)} em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Publicados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedReports}</div>
            <p className="text-xs text-muted-foreground">
              {reports?.length ? ((publishedReports / reports.length) * 100).toFixed(0) : 0}% do total de relatórios
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Relatórios</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
        </TabsList>
        {/* <TabsContent value="list" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Gerar Novo Relatório
            </Button>
          </div>
          <FinancialReportsList reports={reports || []} />
        </TabsContent>
        <TabsContent value="summary" className="space-y-4">
          <FinancialReportsSummary reports={reports || []} />
        </TabsContent>
        <TabsContent value="charts" className="space-y-4">
          <FinancialReportsChart reports={reports || []} />
        </TabsContent> */}
      </Tabs>
    </div>
  )
}

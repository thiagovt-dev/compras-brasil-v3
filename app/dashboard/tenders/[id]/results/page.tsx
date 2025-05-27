import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TenderResultsWinners } from "@/components/tender-results-winners"
import { TenderResultsStats } from "@/components/tender-results-stats"
import { TenderResultsSavings } from "@/components/tender-results-savings"
import { TenderNavigation } from "@/components/tender-navigation"
import { Separator } from "@/components/ui/separator"

export default async function TenderResultsPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch tender data
  const { data: tender, error } = await supabase
    .from("tenders")
    .select(`
      *,
      agency:agencies(*)
    `)
    .eq("id", params.id)
    .single()

  if (error || !tender) {
    notFound()
  }

  // Fetch tender results
  const { data: results } = await supabase.from("tender_results").select("*").eq("tender_id", params.id).single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resultados da Licitação</h1>
        <p className="text-muted-foreground">{tender.title}</p>
      </div>

      <TenderNavigation tenderId={params.id} activeItem="results" />

      <Separator />

      <Tabs defaultValue="winners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="winners">Vencedores</TabsTrigger>
          <TabsTrigger value="savings">Economia</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="winners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vencedores por Lote</CardTitle>
              <CardDescription>Visualize os fornecedores vencedores e os valores de cada lote</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Carregando vencedores...</div>}>
                <TenderResultsWinners tenderId={params.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Economia Gerada</CardTitle>
              <CardDescription>Detalhes dos valores economizados em relação ao valor estimado</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Carregando dados de economia...</div>}>
                <TenderResultsSavings tenderId={params.id} results={results} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas da Licitação</CardTitle>
              <CardDescription>Dados estatísticos sobre a participação e resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Carregando estatísticas...</div>}>
                <TenderResultsStats tenderId={params.id} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

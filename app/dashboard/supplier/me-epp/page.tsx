import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Info, AlertCircle, CheckCircle } from "lucide-react"

export default async function MeEppPage() {
  const supabase = createServerComponentClient({ cookies })

  // Get current user and profile
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    profile = data
  }

  const isMeEpp = profile?.company_type === "me" || profile?.company_type === "epp"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ME/EPP</h1>
        <p className="text-muted-foreground">Informações e benefícios para Microempresas e Empresas de Pequeno Porte</p>
      </div>

      <Separator />

      {profile && (
        <Alert variant={isMeEpp ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Status ME/EPP</AlertTitle>
          <AlertDescription>
            {isMeEpp
              ? "Sua empresa está registrada como ME/EPP e possui os benefícios da Lei Complementar 123/2006."
              : "Sua empresa não está registrada como ME/EPP. Entre em contato com o suporte para atualizar seu cadastro."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="benefits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="legislation">Legislação</TabsTrigger>
          <TabsTrigger value="tiebreaker">Desempate Ficto</TabsTrigger>
        </TabsList>

        <TabsContent value="benefits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios para ME/EPP</CardTitle>
              <CardDescription>Conheça os benefícios garantidos pela Lei Complementar 123/2006</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Desempate Ficto</h3>
                  <p className="text-sm text-muted-foreground">
                    Em caso de empate, a ME/EPP tem preferência na contratação, podendo apresentar nova proposta com
                    valor inferior.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Regularização Fiscal Tardia</h3>
                  <p className="text-sm text-muted-foreground">
                    Prazo de 5 dias úteis, prorrogáveis por igual período, para regularização fiscal em caso de
                    restrições.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Licitação Exclusiva</h3>
                  <p className="text-sm text-muted-foreground">
                    Licitações exclusivas para ME/EPP em contratações de até R$ 80.000,00.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Subcontratação</h3>
                  <p className="text-sm text-muted-foreground">
                    Possibilidade de exigência de subcontratação de ME/EPP em licitações de obras e serviços.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Cota Reservada</h3>
                  <p className="text-sm text-muted-foreground">
                    Cota de até 25% do objeto para contratação exclusiva de ME/EPP em aquisições de bens divisíveis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legislation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Legislação Aplicável</CardTitle>
              <CardDescription>
                Principais dispositivos legais que garantem tratamento diferenciado para ME/EPP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Lei Complementar nº 123/2006</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Institui o Estatuto Nacional da Microempresa e da Empresa de Pequeno Porte, estabelecendo normas
                  gerais relativas ao tratamento diferenciado e favorecido a ser dispensado às microempresas e empresas
                  de pequeno porte.
                </p>
                <div className="mt-2">
                  <Badge variant="outline">Artigos 42 a 49</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium">Lei nº 14.133/2021 (Nova Lei de Licitações)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Estabelece normas gerais de licitação e contratação para as Administrações Públicas diretas,
                  autárquicas e fundacionais da União, dos Estados, do Distrito Federal e dos Municípios.
                </p>
                <div className="mt-2">
                  <Badge variant="outline">Artigos 4º e 48</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium">Decreto nº 8.538/2015</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Regulamenta o tratamento favorecido, diferenciado e simplificado para microempresas, empresas de
                  pequeno porte, agricultores familiares, produtores rurais pessoa física, microempreendedores
                  individuais e sociedades cooperativas nas contratações públicas de bens, serviços e obras no âmbito da
                  administração pública federal.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiebreaker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempate Ficto</CardTitle>
              <CardDescription>
                Entenda como funciona o desempate ficto previsto na Lei Complementar 123/2006
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>O que é o Desempate Ficto?</AlertTitle>
                <AlertDescription>
                  É a preferência de contratação para as microempresas e empresas de pequeno porte em caso de empate
                  ficto, ou seja, quando as propostas apresentadas por ME/EPP sejam iguais ou até 10% superiores à
                  proposta mais bem classificada (5% na modalidade pregão).
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-medium">Como funciona?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    A ME/EPP mais bem classificada poderá apresentar proposta de preço inferior àquela considerada
                    vencedora do certame.
                  </li>
                  <li>
                    Não ocorrendo a contratação da ME/EPP, serão convocadas as remanescentes que porventura se enquadrem
                    na situação de empate, na ordem classificatória, para o exercício do mesmo direito.
                  </li>
                  <li>
                    No caso de equivalência dos valores apresentados pelas ME/EPP que se encontrem nos intervalos
                    estabelecidos, será realizado sorteio entre elas para que se identifique aquela que primeiro poderá
                    apresentar melhor oferta.
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Exemplo Prático</h3>
                <div className="rounded-md border p-4">
                  <p className="text-sm">
                    <strong>Cenário:</strong> Pregão Eletrônico para aquisição de materiais de escritório
                  </p>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm">
                      <strong>Empresa A (Grande Porte):</strong> R$ 10.000,00 (Melhor proposta)
                    </p>
                    <p className="text-sm">
                      <strong>Empresa B (ME/EPP):</strong> R$ 10.400,00 (4% acima da melhor proposta)
                    </p>
                    <p className="text-sm">
                      <strong>Empresa C (ME/EPP):</strong> R$ 10.500,00 (5% acima da melhor proposta)
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm">
                      <strong>Resultado:</strong> As Empresas B e C têm direito ao desempate ficto por estarem dentro do
                      limite de 5% (pregão). A Empresa B, por estar melhor classificada, terá a primeira oportunidade de
                      apresentar nova proposta com valor inferior a R$ 10.000,00.
                    </p>
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

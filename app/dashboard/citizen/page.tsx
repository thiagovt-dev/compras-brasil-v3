import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Landmark, Search, Calendar, DollarSign } from "lucide-react";
import { fetchRecentTenders } from "@/lib/actions/tenderAction";
import { formatCurrency } from "@/lib/utils";

function formatDate(dateString: string | null) {
  if (!dateString) return "Data não informada";
  
  const date = new Date(dateString);
  return `Publicado em ${date.toLocaleDateString("pt-BR")}`;
}

function formatTenderType(type: string) {
  const types = {
    "pregao_eletronico": "Pregão Eletrônico",
    "concorrencia": "Concorrência",
    "tomada_de_precos": "Tomada de Preços",
    "convite": "Convite",
    "leilao": "Leilão",
    "concurso": "Concurso"
  };
  return types[type as keyof typeof types] || type;
}

function formatStatus(status: string) {
  const statuses = {
    "draft": "Rascunho",
    "published": "Publicado",
    "in_progress": "Em Andamento",
    "under_review": "Em Análise",
    "completed": "Concluído",
    "cancelled": "Cancelado",
    "revoked": "Revogado",
    "failed": "Fracassado",
    "deserted": "Deserto"
  };
  return statuses[status as keyof typeof statuses] || status;
}

export default async function CitizenDashboard() {
  const tendersResult = await fetchRecentTenders(4);
  const recentTenders = tendersResult.success ? tendersResult.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel do Cidadão</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema Licitações Brasil. Aqui você pode pesquisar licitações e cadastrar
          fornecedores ou órgãos públicos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pesquisar Licitações</CardTitle>
            <CardDescription>
              Encontre licitações públicas em andamento ou concluídas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/citizen/search">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Search className="mr-2 h-4 w-4" />
                Pesquisar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cadastrar-se como Fornecedor</CardTitle>
            <CardDescription>Registre uma empresa para participar de licitações</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/citizen/register-supplier">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Building2 className="mr-2 h-4 w-4" />
                Cadastrar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cadastre-se como Órgão Público</CardTitle>
            <CardDescription>Registre um órgão público para gerenciar licitações</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/citizen/register-agency">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Landmark className="mr-2 h-4 w-4" />
                Cadastrar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Licitações Recentes</h2>
        
        {recentTenders && recentTenders.length > 0 ? (
          <div className="space-y-4">
            {recentTenders.map((tender: any) => (
              <div key={tender.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-lg">{tender.title}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                        {formatTenderType(tender.tender_type)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{tender.agency?.name || 'Órgão não informado'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(tender.publication_date)}</span>
                      </div>
                      
                      {tender.estimated_value && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Valor estimado: {formatCurrency(tender.estimated_value)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Edital:</span>
                        <span className="font-mono text-xs">{tender.tender_number}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Link href={`/dashboard/citizen/search/${tender.id}`}>
                      <Button variant="outline" size="sm">
                        Ver detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma licitação encontrada no momento.</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/dashboard/citizen/search">
            <Button variant="link" className="text-primary">
              Ver todas as licitações
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
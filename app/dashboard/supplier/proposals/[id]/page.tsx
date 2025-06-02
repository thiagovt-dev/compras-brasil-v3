import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Building, Calendar, Clock, Edit, FileText, Tag } from "lucide-react";

interface ProposalDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "supplier") {
    redirect("/dashboard");
  }

  // Get proposal details
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select(
      `
      *,
      tender:tenders(
        *,
        agency:agencies(id, name)
      ),
      lot:tender_lots(*),
      items:proposal_items(
        *,
        tender_item:tender_items(*)
      )
    `
    )
    .eq("id", params.id)
    .eq("supplier_id", profile.id)
    .single();

  if (error || !proposal) {
    redirect("/dashboard/supplier/proposals");
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }
    > = {
      draft: {
        label: "Rascunho",
        variant: "outline",
      },
      submitted: {
        label: "Enviada",
        variant: "default",
      },
      under_analysis: {
        label: "Em Análise",
        variant: "secondary",
      },
      accepted: {
        label: "Aceita",
        variant: "success",
      },
      rejected: {
        label: "Rejeitada",
        variant: "destructive",
      },
      winner: {
        label: "Vencedora",
        variant: "success",
      },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };

    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getModalityLabel = (modality: string) => {
    const modalityMap: Record<string, string> = {
      "pregao-eletronico": "Pregão Eletrônico",
      "concorrencia-eletronica": "Concorrência Eletrônica",
      "dispensa-eletronica": "Dispensa Eletrônica",
    };
    return modalityMap[modality] || modality;
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      "aquisicao-bens": "Aquisição de Bens",
      "servicos-comuns": "Serviços Comuns",
      "servicos-comuns-engenharia": "Serviços Comuns de Engenharia",
      "aquisicao-bens-especiais": "Aquisição de Bens Especiais",
      "servicos-especiais": "Serviços Especiais",
      obras: "Obras",
      "servicos-especiais-engenharia": "Serviços Especiais de Engenharia",
    };
    return categoryMap[category] || category;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não definida";
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Button variant="outline" asChild className="mb-2">
            <Link href="/dashboard/supplier/proposals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Propostas
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Detalhes da Proposta</h1>
          <p className="text-muted-foreground">Visualize os detalhes da sua proposta</p>
        </div>

        <div className="flex items-center gap-2">
          {proposal.status === "draft" && (
            <Button asChild>
              <Link href={`/dashboard/supplier/proposals/edit/${proposal.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Proposta
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>Informações da Proposta</CardTitle>
                {getStatusBadge(proposal.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-[1rem] font-medium text-muted-foreground">Valor Total</h3>
                  <p className="text-lg font-semibold">
                    {formatCurrency(proposal.total_value || 0)}
                  </p>
                </div>
                <div>
                  <h3 className="text-[1rem] font-medium text-muted-foreground">Lote</h3>
                  <p>
                    Lote {proposal.lot?.number}: {proposal.lot?.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-[1rem] font-medium text-muted-foreground">Data de Envio</h3>
                  <p>{formatDate(proposal.created_at || "")}</p>
                </div>
                <div>
                  <h3 className="text-[1rem] font-medium text-muted-foreground">
                    Última Atualização
                  </h3>
                  <p>{formatDate(proposal.updated_at || proposal.created_at || "")}</p>
                </div>
              </div>

              {proposal.notes && (
                <div>
                  <h3 className="text-[1rem] font-medium text-muted-foreground mb-1">
                    Observações
                  </h3>
                  <p className="whitespace-pre-line">{proposal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Itens da Proposta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposal.items &&
                  proposal.items.map((item) => (
                    <div key={item.id} className="border rounded-md p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium">
                            Item {item.tender_item?.number}: {item.tender_item?.description}
                          </h3>
                          <p className="text-[1rem] text-muted-foreground">
                            Quantidade: {item.tender_item?.quantity} {item.tender_item?.unit}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <h4 className="text-[1rem] font-medium text-muted-foreground">
                              Preço Unitário
                            </h4>
                            <p className="font-semibold">{formatCurrency(item.unit_price || 0)}</p>
                          </div>

                          <div>
                            <h4 className="text-[1rem] font-medium text-muted-foreground">
                              Valor Total
                            </h4>
                            <p className="font-semibold">{formatCurrency(item.total_price || 0)}</p>
                          </div>
                        </div>
                      </div>

                      {(item.brand || item.model || item.description) && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.brand && (
                            <div>
                              <h4 className="text-[1rem] font-medium text-muted-foreground">
                                Marca
                              </h4>
                              <p>{item.brand}</p>
                            </div>
                          )}

                          {item.model && (
                            <div>
                              <h4 className="text-[1rem] font-medium text-muted-foreground">
                                Modelo
                              </h4>
                              <p>{item.model}</p>
                            </div>
                          )}

                          {item.description && (
                            <div className="md:col-span-2">
                              <h4 className="text-[1rem] font-medium text-muted-foreground">
                                Descrição Detalhada
                              </h4>
                              <p className="whitespace-pre-line">{item.description}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Informações da Licitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{proposal.tender?.title}</h3>
                <p className="text-[1rem] text-muted-foreground">Nº {proposal.tender?.number}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[1rem]">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {getModalityLabel(proposal.tender?.modality || "")} -{" "}
                    {getCategoryLabel(proposal.tender?.category || "")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[1rem]">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{proposal.tender?.agency?.name}</span>
                </div>

                <div className="flex items-center gap-2 text-[1rem]">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Abertura: {formatDate(proposal.tender?.opening_date || "")}</span>
                </div>

                <div className="flex items-center gap-2 text-[1rem]">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Propostas até: {formatDate(proposal.tender?.proposal_deadline || "")}</span>
                </div>
              </div>

              <Button variant="outline" asChild className="w-full">
                <Link href={`/dashboard/tenders/${proposal.tender?.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Detalhes da Licitação
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

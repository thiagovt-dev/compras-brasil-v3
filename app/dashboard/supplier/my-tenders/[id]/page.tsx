import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  FileText,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TenderDocuments } from "@/components/tender-documents";
import { TenderLots } from "@/components/tender-lots";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function MyTenderDetailsPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies });

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile || profile.profile_type !== "supplier") {
    notFound();
  }

  // Fetch tender details
  const { data: tender, error } = await supabase
    .from("tenders")
    .select(
      `
      *,
      agency:agencies(name, city, state),
      lots:tender_lots(*),
      documents:tender_documents(*),
      proposals:proposals!inner(
        *,
        supplier:profiles!proposals_supplier_id_fkey(name)
      )
    `
    )
    .eq("id", params.id)
    .eq("proposals.supplier_id", user.id)
    .single();

  if (error || !tender) {
    notFound();
  }

  // Get my proposal for this tender
  const { data: myProposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("tender_id", params.id)
    .eq("supplier_id", user.id)
    .single();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Rascunho", variant: "secondary" as const },
      published: { label: "Publicada", variant: "default" as const },
      active: { label: "Ativa", variant: "default" as const },
      in_progress: { label: "Em Andamento", variant: "default" as const },
      finished: { label: "Finalizada", variant: "outline" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "secondary" as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getProposalStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Rascunho", variant: "secondary" as const },
      submitted: { label: "Enviada", variant: "default" as const },
      accepted: { label: "Aceita", variant: "default" as const },
      rejected: { label: "Rejeitada", variant: "destructive" as const },
      winner: { label: "Vencedora", variant: "default" as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: "secondary" as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/supplier/proposals">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Propostas
          </Link>
        </Button>
      </div>

      {/* Tender Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{tender.title}</CardTitle>
                  <CardDescription className="mt-2">{tender.description}</CardDescription>
                </div>
                {getStatusBadge(tender.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[1rem]">{tender.agency?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[1rem]">
                    {tender.agency?.city}, {tender.agency?.state}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[1rem]">Abertura: {formatDate(tender.opening_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[1rem]">
                    Encerramento: {formatDate(tender.closing_date)}
                  </span>
                </div>
              </div>

              {tender.estimated_value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[1rem]">
                    Valor Estimado: {formatCurrency(tender.estimated_value)}
                  </span>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Modalidade</h4>
                <p className="text-[1rem] text-muted-foreground">{tender.modality}</p>
              </div>

              {tender.object && (
                <div>
                  <h4 className="font-medium mb-2">Objeto</h4>
                  <p className="text-[1rem] text-muted-foreground">{tender.object}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lots */}
          {tender.lots && tender.lots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lotes</CardTitle>
              </CardHeader>
              <CardContent>
                <TenderLots lots={tender.lots} />
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {tender.documents && tender.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <TenderDocuments documents={tender.documents} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* My Proposal Status */}
          {myProposal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Minha Proposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[1rem] font-medium">Status:</span>
                  {getProposalStatusBadge(myProposal.status)}
                </div>

                {myProposal.total_value && (
                  <div className="flex items-center justify-between">
                    <span className="text-[1rem] font-medium">Valor Total:</span>
                    <span className="text-[1rem] font-mono">
                      {formatCurrency(myProposal.total_value)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[1rem] font-medium">Enviada em:</span>
                  <span className="text-[1rem]">{formatDate(myProposal.created_at)}</span>
                </div>

                {myProposal.updated_at !== myProposal.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-[1rem] font-medium">Atualizada em:</span>
                    <span className="text-[1rem]">{formatDate(myProposal.updated_at)}</span>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/supplier/proposals/${myProposal.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Proposta Completa
                    </Link>
                  </Button>

                  {myProposal.status === "draft" && (
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/dashboard/supplier/proposals/edit/${myProposal.id}`}>
                        Editar Proposta
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tender Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[1rem] font-medium">Propostas:</span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[1rem]">{tender.proposals?.length || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[1rem] font-medium">Lotes:</span>
                <span className="text-[1rem]">{tender.lots?.length || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[1rem] font-medium">Documentos:</span>
                <span className="text-[1rem]">{tender.documents?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" asChild className="w-full">
                <Link href={`/tenders/${tender.id}`}>Ver Licitação Pública</Link>
              </Button>

              {!myProposal && tender.status === "active" && (
                <Button asChild className="w-full">
                  <Link href={`/dashboard/supplier/proposals/create?tender=${tender.id}`}>
                    Criar Proposta
                  </Link>
                </Button>
              )}

              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/supplier/calendar">Ver na Agenda</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

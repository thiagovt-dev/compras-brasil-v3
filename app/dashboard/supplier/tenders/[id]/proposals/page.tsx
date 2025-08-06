import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchTenderById } from "@/lib/actions/tenderAction";
import { getSessionWithProfile } from "@/lib/actions/authAction";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SupplierProposalsClient from "@/components/supplier/supplier-proposals-client";

interface SupplierProposalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupplierProposalPage({ params }: SupplierProposalPageProps) {
  // Aguardar os params
  const resolvedParams = await params;
  const tenderId = resolvedParams.id;

  // Buscar dados em paralelo
  const [tenderResult, sessionData] = await Promise.all([
    fetchTenderById(tenderId),
    getSessionWithProfile(),
  ]);

  // Verificar se a licitação existe
  if (!tenderResult.success) {
    notFound();
  }

  const tender = tenderResult.data;

  // Verificar se o usuário está autenticado
  if (!sessionData?.user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para enviar propostas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se é um fornecedor
  if (sessionData.profile?.profile_type !== "supplier") {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Apenas fornecedores podem enviar propostas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se a licitação está publicada
  if (tender?.status !== "published") {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Esta licitação não está disponível para envio de propostas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6">
      <Suspense fallback={
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }>
        <SupplierProposalsClient
          tender={tender}
          userProfile={sessionData.profile}
          userId={sessionData.user.id}
        />
      </Suspense>
    </div>
  );
}
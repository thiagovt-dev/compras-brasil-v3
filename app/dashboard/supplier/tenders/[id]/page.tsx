import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  fetchTenderById,
  fetchTenderDocuments,
  fetchTenderParticipants,
  checkTenderFavorite,
} from "@/lib/actions/tenderAction";
import { fetchUserProposalsForTender, debugUserProposals } from "@/lib/actions/supplierAction";
import { getSessionWithProfile } from "@/lib/actions/authAction";
import TenderDetailClient from "@/components/tender-details-client-components/tender-detail-client";
import {
  transformSupabaseDocument,
  transformSupabaseParticipant,
} from "@/lib/utils/formats-supabase-data";

interface TenderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupplierTenderDetailPage({ params }: TenderDetailPageProps) {
  const resolvedParams = await params;
  const tenderId = resolvedParams.id;

  // Buscar dados em paralelo
  const [tenderResult, documentsResult, participantsResult, sessionData] = await Promise.all([
    fetchTenderById(tenderId),
    fetchTenderDocuments(tenderId),
    fetchTenderParticipants(tenderId),
    getSessionWithProfile(),
  ]);

  // Verificar se a licitação existe
  if (!tenderResult.success || !tenderResult.data) {
    notFound();
  }

  const tender: Tender = tenderResult.data;
  const documents: TenderDocument[] =
    documentsResult.success && documentsResult.data
      ? documentsResult.data.map(transformSupabaseDocument)
      : [];

  const participants: TenderParticipant[] =
    participantsResult.success && participantsResult.data
      ? participantsResult.data.map(transformSupabaseParticipant)
      : [];

  let isFavorite = false;
  if (sessionData?.user) {
    const favoriteResult = await checkTenderFavorite(tenderId, sessionData.user.id);
    isFavorite = favoriteResult.success ? (favoriteResult.data ?? false) : false;
  }

  // CORREÇÃO: Buscar propostas do usuário para esta licitação
  let userProposalsByLot: Record<string, any[]> = {};
  let userProposals: Record<string, any> = {};
  const isSupplier = sessionData?.profile?.profile_type === "supplier";

  console.log("🔍 Dados da sessão:", {
    userId: sessionData?.user?.id,
    profileType: sessionData?.profile?.profile_type,
    isSupplier,
    tenderLots: tender.tender_lots?.length || 0
  });

  if (isSupplier && sessionData?.user) {
    console.log("🔍 Fornecedor logado - buscando propostas para tender:", tenderId);
    
    try {
      // DEBUG: Executar função de debug primeiro
      const debugResult = await debugUserProposals(tenderId, sessionData.user.id);
      console.log("🐛 DEBUG COMPLETO:", debugResult);
      
      // Buscar propostas do usuário para esta licitação
      const proposalsResult = await fetchUserProposalsForTender(tenderId, sessionData.user.id);
      
      if (proposalsResult.success && proposalsResult.data) {
        userProposalsByLot = proposalsResult.data;
        console.log("✅ Propostas agrupadas por lote:", userProposalsByLot);
        
        // Transformar para o formato esperado pelo componente (primeira proposta de cada lote)
        Object.entries(userProposalsByLot).forEach(([lotId, proposals]) => {
          if (proposals && proposals.length > 0) {
            // Pegar a proposta mais recente do lote
            userProposals[lotId] = proposals[0];
            console.log(`📋 Lote ${lotId}: proposta encontrada (${proposals[0].id})`);
          }
        });
      } else {
        console.log("❌ Erro ao buscar propostas:", proposalsResult.error);
      }
    } catch (error) {
      console.error("💥 Erro fatal ao buscar propostas:", error);
    }
  } else {
    console.log("❌ Não é fornecedor ou não está logado:", {
      isSupplier,
      hasUser: !!sessionData?.user,
      profileType: sessionData?.profile?.profile_type
    });
  }

  console.log("📋 RESULTADO FINAL - User Proposals:", userProposals);
  console.log("📊 Resumo:", {
    totalLotes: tender.tender_lots?.length || 0,
    totalPropostasEncontradas: Object.keys(userProposals).length,
    lotesComProposta: Object.keys(userProposals)
  });

  // Verificar se houve erros críticos
  const hasErrors = !tenderResult.success;

  if (hasErrors) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar licitação</h2>
          <p className="text-gray-600 mb-4">
            Ocorreu um erro ao buscar os dados da licitação.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando detalhes...</p>
          </div>
        </div>
      }>
        <TenderDetailClient
          tender={tender}
          documents={documents}
          participants={participants}
          isFavorite={isFavorite}
          isAuthenticated={!!sessionData?.user}
          hasDocumentError={!documentsResult.success}
          hasParticipantError={!participantsResult.success}
          userProposals={userProposals}
          isSupplier={isSupplier}
          userId={sessionData?.user?.id}
        />
      </Suspense>
    </div>
  );
}
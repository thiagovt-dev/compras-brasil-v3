import { Suspense } from "react";
import { notFound } from "next/navigation";
import { 
  fetchTenderById, 
  fetchTenderDocuments, 
  fetchTenderParticipants,
  checkTenderFavorite 
} from "@/lib/actions/tenderAction";
import { getSessionWithProfile } from "@/lib/actions/authAction";
import TenderDetailClient from "@/components/tender-details-client-components/tender-detail-client";
import { transformSupabaseDocument, transformSupabaseParticipant } from "@/lib/utils/formats-supabase-data";

interface TenderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CitizenTenderDetailPage({ params }: TenderDetailPageProps) {
  const resolvedParams = await params;
  const tenderId = resolvedParams.id;

  // Buscar dados em paralelo
  const [
    tenderResult,
    documentsResult,
    participantsResult,
    sessionData
  ] = await Promise.all([
    fetchTenderById(tenderId),
    fetchTenderDocuments(tenderId),
    fetchTenderParticipants(tenderId),
    getSessionWithProfile()
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
        />
      </Suspense>
    </div>
  );
}
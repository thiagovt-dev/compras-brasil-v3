import { Suspense } from "react";
import { 
  fetchAgencies, 
  fetchAgencyTypes, 
  fetchAgencySpheres 
} from "@/lib/actions/agencyAction";
import { 
  searchTendersAdvanced, 
  fetchTenderCategories, 
  fetchTenderTypes, 
  fetchTenderStatuses 
} from "@/lib/actions/tenderAction";
import TenderSearchClient from "@/components/tender-search-client";

interface SearchPageProps {
  searchParams: Promise<{
    query?: string;
    agency_id?: string;
    tender_type?: string;
    status?: string;
    category?: string;
    opening_date_from?: string;
    opening_date_to?: string;
    page?: string;
    filter?: string;
  }>;
}

export default async function CitizenTenderSearchPage({ searchParams }: SearchPageProps) {
  // Aguardar os searchParams antes de usar
  const resolvedSearchParams = await searchParams;
  
  const page = parseInt(resolvedSearchParams.page || "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  // Buscar dados para os filtros em paralelo
  const [
    agenciesResult,
    categoriesResult,
    tenderTypesResult,
    statusesResult,
    agencyTypesResult,
    spheresResult
  ] = await Promise.all([
    fetchAgencies(),
    fetchTenderCategories(),
    fetchTenderTypes(),
    fetchTenderStatuses(),
    fetchAgencyTypes(),
    fetchAgencySpheres()
  ]);

  // Buscar licitações com base nos filtros
  const tendersResult = await searchTendersAdvanced({
    query: resolvedSearchParams.query,
    agency_id: resolvedSearchParams.agency_id,
    tender_type: resolvedSearchParams.tender_type,
    status: resolvedSearchParams.status,
    category: resolvedSearchParams.category,
    opening_date_from: resolvedSearchParams.opening_date_from,
    opening_date_to: resolvedSearchParams.opening_date_to,
  }, limit, offset);

  // Garantir que todos os dados sejam arrays, mesmo em caso de erro
  const agencies = agenciesResult.success ? (agenciesResult.data || []) : [];
  const categories = categoriesResult.success ? (categoriesResult.data || []) : [];
  const tenderTypes = tenderTypesResult.success ? (tenderTypesResult.data || []) : [];
  const statuses = statusesResult.success ? (statusesResult.data || []) : [];
  const agencyTypes = agencyTypesResult.success ? (agencyTypesResult.data || []) : [];
  const spheres = spheresResult.success ? (spheresResult.data || []) : [];
  const tenders = tendersResult.success ? (tendersResult.data || []) : [];

  // Verificar se houve erros críticos
  const hasErrors = !agenciesResult.success || !tenderTypesResult.success || !statusesResult.success;

  if (hasErrors) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-4">
            Ocorreu um erro ao buscar as informações necessárias para a pesquisa.
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
      {/* Header */}
      <div className=" border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Pesquisar Licitações</h1>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }>
        <TenderSearchClient
          initialTenders={tenders}
          agencies={agencies}
          categories={categories}
          tenderTypes={tenderTypes}
          statuses={statuses}
          agencyTypes={agencyTypes}
          spheres={spheres}
          searchParams={resolvedSearchParams}
          currentPage={page}
          hasSearchError={!tendersResult.success}
          searchErrorMessage={tendersResult.success ? undefined : tendersResult.error}
        />
      </Suspense>
    </div>
  );
}
"use server";

import { withErrorHandling, ServerActionError } from "./errorAction";
import { createClient } from "@supabase/supabase-js";
import { getSessionWithProfile } from "./authAction";
import { transformTenderFromDB, transformSupabaseDocument, transformSupabaseParticipant } from "@/lib/utils/formats-supabase-data";

interface SearchFilters {
  query?: string;
  agency_id?: string;
  tender_type?: string;
  status?: string;
  category?: string;
  opening_date_from?: string;
  opening_date_to?: string;
}

function createServerActionClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const supabase = createServerActionClient();

export async function fetchRecentTenders(limit: number = 4) {
  return withErrorHandling(async () => {
    const { data: tenders, error } = await supabase
      .from("tenders")
      .select(`
        *,
        agencies!inner (
          id,
          name,
          cnpj,
          agency_type,
          sphere,
          address,
          email,
          phone,
          website,
          status,
          created_at,
          updated_at
        )
      `)
      .eq("status", "published")
      .order("publication_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching tenders:", error);
      throw new ServerActionError(`Erro ao buscar licitações: ${error.message}`, 500);
    }

    // Transformar os dados para a interface Tender
    const transformedTenders: Tender[] = (tenders || []).map(transformTenderFromDB);
    return transformedTenders;
  });
}

export async function fetchTenderCategories() {
  return withErrorHandling(async () => {
    const { data: categories, error } = await supabase
      .from("tenders")
      .select("category")
      .not("category", "is", null);

    if (error) {
      console.error("Error fetching categories:", error);
      throw new ServerActionError(`Erro ao buscar categorias: ${error.message}`, 500);
    }

    const uniqueCategories = [...new Set(categories?.map((t) => t.category).filter(Boolean))];
    return uniqueCategories.sort();
  });
}

export async function fetchTenderTypes() {
  return withErrorHandling(async () => {
    const tenderTypes: TenderType[] = [
      { value: "pregao_eletronico", label: "Pregão Eletrônico" },
      { value: "concorrencia", label: "Concorrência" },
      { value: "tomada_de_precos", label: "Tomada de Preços" },
      { value: "convite", label: "Convite" },
      { value: "leilao", label: "Leilão" },
      { value: "concurso", label: "Concurso" },
    ];

    return tenderTypes;
  });
}

export async function fetchTenderStatuses() {
  return withErrorHandling(async () => {
    const statuses: TenderStatus[] = [
      { value: "draft", label: "Rascunho" },
      { value: "published", label: "Publicada" },
      { value: "in_progress", label: "Em Andamento" },
      { value: "under_review", label: "Em Análise" },
      { value: "completed", label: "Concluída" },
      { value: "cancelled", label: "Cancelada" },
      { value: "revoked", label: "Revogada" },
      { value: "failed", label: "Fracassada" },
      { value: "deserted", label: "Deserta" },
    ];

    return statuses;
  });
}

export async function searchTendersAdvanced(
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
) {
  return withErrorHandling(async () => {
    let queryBuilder = supabase.from("tenders").select(`
        *,
        agencies!inner (
          id,
          name,
          cnpj,
          agency_type,
          sphere,
          address,
          email,
          phone,
          website,
          status,
          created_at,
          updated_at
        )
      `);

    if (filters.query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,tender_number.ilike.%${filters.query}%`
      );
    }

    if (filters.agency_id && filters.agency_id !== "all") {
      queryBuilder = queryBuilder.eq("agency_id", filters.agency_id);
    }

    if (filters.tender_type && filters.tender_type !== "all") {
      queryBuilder = queryBuilder.eq("tender_type", filters.tender_type);
    }

    if (filters.status && filters.status !== "all") {
      queryBuilder = queryBuilder.eq("status", filters.status);
    }

    if (filters.category && filters.category !== "all") {
      queryBuilder = queryBuilder.eq("category", filters.category);
    }

    if (filters.opening_date_from) {
      queryBuilder = queryBuilder.gte("opening_date", filters.opening_date_from);
    }

    if (filters.opening_date_to) {
      queryBuilder = queryBuilder.lte("opening_date", filters.opening_date_to);
    }

    const { data: tenders, error } = await queryBuilder
      .order("publication_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error searching tenders:", error);
      throw new ServerActionError(`Erro ao pesquisar licitações: ${error.message}`, 500);
    }

    // Transformar os dados para a interface Tender
    const transformedTenders: Tender[] = (tenders || []).map(transformTenderFromDB);
    return transformedTenders;
  });
}

export async function fetchUserFavoriteTenders(limit: number = 20, offset: number = 0) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    const { data: favorites, error: favError } = await supabase
      .from("tender_favorites")
      .select(`
        tender_id,
        tenders!inner (
          *,
          agencies!inner (
            id,
            name,
            cnpj,
            agency_type,
            sphere,
            address,
            email,
            phone,
            website,
            status,
            created_at,
            updated_at
          )
        )
      `)
      .eq("user_id", sessionData.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (favError) {
      if (favError.code === "42P01") {
        return [];
      }
      console.error("Error fetching favorite tenders:", favError);
      throw new ServerActionError(`Erro ao buscar licitações favoritas: ${favError.message}`, 500);
    }

    // Transformar os dados para a interface Tender
    const transformedTenders: Tender[] = favorites?.map((fav) => transformTenderFromDB(fav.tenders)) || [];
    return transformedTenders;
  });
}

export async function toggleTenderFavorite(tenderId: string) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    const { data: existing, error: checkError } = await supabase
      .from("tender_favorites")
      .select("id")
      .eq("user_id", sessionData.user.id)
      .eq("tender_id", tenderId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      if (checkError.code === "42P01") {
        throw new ServerActionError("Sistema de favoritos não configurado", 500);
      } else {
        throw new ServerActionError(`Erro ao verificar favorito: ${checkError.message}`, 500);
      }
    }

    if (existing) {
      // Remover favorito
      const { error: deleteError } = await supabase
        .from("tender_favorites")
        .delete()
        .eq("user_id", sessionData.user.id)
        .eq("tender_id", tenderId);

      if (deleteError) {
        throw new ServerActionError(`Erro ao remover favorito: ${deleteError.message}`, 500);
      }

      return { isFavorite: false };
    } else {
      const { error: insertError } = await supabase.from("tender_favorites").insert({
        user_id: sessionData.user.id,
        tender_id: tenderId,
      });

      if (insertError) {
        throw new ServerActionError(`Erro ao adicionar favorito: ${insertError.message}`, 500);
      }

      return { isFavorite: true };
    }
  });
}

export async function fetchActiveTendersByAgency(agencyId: string, limit: number = 5) {
  return withErrorHandling(async () => {
    if (!agencyId) {
      throw new ServerActionError("Agency ID is required", 400);
    }

    const { data: tenders, error } = await supabase
      .from("tenders")
      .select(`
        id,
        title,
        tender_number,
        status,
        opening_date,
        closing_date,
        estimated_value,
        created_at
      `)
      .eq("agency_id", agencyId)
      .in("status", ["published", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching active tenders:", error);
      throw new ServerActionError(`Erro ao buscar licitações ativas: ${error.message}`, 500);
    }

    return tenders || [];
  });
}

export async function fetchRecentTendersByAgency(agencyId: string, limit: number = 5) {
  return withErrorHandling(async () => {
    if (!agencyId) {
      throw new ServerActionError("Agency ID is required", 400);
    }

    const { data: tenders, error } = await supabase
      .from("tenders")
      .select(`
        id,
        title,
        tender_number,
        status,
        closing_date,
        estimated_value,
        created_at
      `)
      .eq("agency_id", agencyId)
      .in("status", ["completed", "cancelled", "revoked", "failed", "deserted"])
      .order("closing_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent tenders:", error);
      throw new ServerActionError(`Erro ao buscar licitações recentes: ${error.message}`, 500);
    }

    return tenders || [];
  });
}

export async function fetchAgencyStats(agencyId: string) {
  return withErrorHandling(async () => {
    if (!agencyId) {
      throw new ServerActionError("Agency ID is required", 400);
    }

    const { data: statusCounts, error: statusError } = await supabase
      .from("tenders")
      .select("status")
      .eq("agency_id", agencyId);

    if (statusError) {
      console.error("Error fetching status counts:", statusError);
      throw new ServerActionError(`Erro ao buscar estatísticas: ${statusError.message}`, 500);
    }

    const { data: valueData, error: valueError } = await supabase
      .from("tenders")
      .select("estimated_value")
      .eq("agency_id", agencyId)
      .not("estimated_value", "is", null);

    if (valueError) {
      console.error("Error fetching value data:", valueError);
      throw new ServerActionError(`Erro ao buscar valores: ${valueError.message}`, 500);
    }

    const activeTenders =
      statusCounts?.filter((t) => ["published", "in_progress"].includes(t.status)).length || 0;

    const completedTenders =
      statusCounts?.filter((t) => ["completed"].includes(t.status)).length || 0;

    const totalValue =
      valueData?.reduce((sum, tender) => sum + (tender.estimated_value || 0), 0) || 0;

    return {
      activeTenders,
      completedTenders,
      totalValue,
      totalTenders: statusCounts?.length || 0,
    };
  });
}

export async function fetchTenderById(tenderId: string) {
  return withErrorHandling(async () => {
    if (!tenderId) {
      throw new ServerActionError("Tender ID is required", 400);
    }

    const { data: tender, error } = await supabase
      .from("tenders")
      .select(`
        *,
        agencies!inner (
          id,
          name,
          cnpj,
          agency_type,
          sphere,
          address,
          email,
          phone,
          website,
          status,
          created_at,
          updated_at
        ),
        profiles!tenders_created_by_fkey (
          id,
          name,
          email
        ),
        tender_lots (
          id,
          tender_id,
          number,
          description,
          type,
          require_brand,
          allow_description_change,
          status,
          appeal_start_date,
          created_at,
          updated_at,
          estimated_value,
          bid_interval,
          tender_items (
            id,
            tender_id,
            lot_id,
            item_number,
            description,
            quantity,
            unit,
            estimated_unit_price,
            benefit_type,
            created_at,
            updated_at
          )
        )
      `)
      .eq("id", tenderId)
      .single();

    if (error) {
      console.error("Error fetching tender:", error);

      if (error.code === "PGRST116") {
        throw new ServerActionError("Licitação não encontrada", 404);
      } else {
        throw new ServerActionError(`Erro ao buscar licitação: ${error.message}`, 500);
      }
    }

    return transformTenderFromDB(tender);
  });
}

export async function searchTenders(
  query?: string,
  status?: string,
  tenderType?: string,
  agencyId?: string,
  limit: number = 20,
  offset: number = 0
) {
  return searchTendersAdvanced(
    {
      query,
      status,
      tender_type: tenderType,
      agency_id: agencyId,
    },
    limit,
    offset
  );
}

export async function fetchTenderDocuments(tenderId: string) {
  return withErrorHandling(async () => {
    if (!tenderId) {
      throw new ServerActionError("Tender ID is required", 400);
    }

    const { data: documents, error } = await supabase
      .from("tender_documents")
      .select(`
        id,
        tender_id,
        user_id,
        name,
        file_path,
        file_type,
        file_size,
        created_at
      `)
      .eq("tender_id", tenderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tender documents:", error);
      throw new ServerActionError(`Erro ao buscar documentos: ${error.message}`, 500);
    }

    const transformedDocuments: TenderDocument[] = (documents || []).map(transformSupabaseDocument);
    return transformedDocuments;
  });
}

export async function checkTenderFavorite(tenderId: string, userId: string) {
  return withErrorHandling(async () => {
    if (!tenderId || !userId) {
      return false;
    }

    const { data: favorite, error } = await supabase
      .from("tender_favorites")
      .select("id")
      .eq("tender_id", tenderId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking favorite:", error);
      return false;
    }

    return !!favorite;
  });
}

export async function fetchTenderParticipants(tenderId: string) {
  return withErrorHandling(async () => {
    if (!tenderId) {
      throw new ServerActionError("Tender ID is required", 400);
    }

    const { data: participants, error } = await supabase
      .from("tender_participants")
      .select(`
        id,
        tender_id,
        supplier_id,
        user_id,
        status,
        justification,
        classified_by,
        classified_at,
        registered_at,
        created_at,
        updated_at,
        suppliers (
          id,
          name,
          cnpj
        )
      `)
      .eq("tender_id", tenderId)
      .eq("status", "approved")
      .order("registered_at", { ascending: true });

    if (error) {
      console.error("Error fetching participants:", error);
      throw new ServerActionError(`Erro ao buscar participantes: ${error.message}`, 500);
    }

    // Transformar os dados para a interface TenderParticipant
    const transformedParticipants: TenderParticipant[] = (participants || []).map(transformSupabaseParticipant);
    return transformedParticipants;
  });
}
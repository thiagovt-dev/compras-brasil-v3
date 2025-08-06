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

export async function withdrawTenderProposal(proposalId: string) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    if (!proposalId) {
      throw new ServerActionError("ID da proposta é obrigatório", 400);
    }

    // CORREÇÃO: Verificar a proposta e buscar tender separadamente
    const { data: proposal, error: checkError } = await supabase
      .from("tender_proposals")
      .select(`
        id,
        tender_id,
        supplier_id,
        user_id,
        status
      `)
      .eq("id", proposalId)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        throw new ServerActionError("Proposta não encontrada", 404);
      }
      throw new ServerActionError(`Erro ao verificar proposta: ${checkError.message}`, 500);
    }

    // Verificar se o usuário pode representar este fornecedor
    const { data: profile } = await supabase
      .from("profiles")
      .select("supplier_id")
      .eq("id", sessionData.user.id)
      .single();

    if (!profile || profile.supplier_id !== proposal.supplier_id) {
      throw new ServerActionError("Você não tem permissão para retirar esta proposta", 403);
    }

    if (proposal.status === "withdrawn") {
      throw new ServerActionError("Esta proposta já foi retirada", 400);
    }

    // CORREÇÃO: Buscar tender separadamente
    const { data: tender, error: tenderError } = await supabase
      .from("tenders")
      .select("id, status, closing_date")
      .eq("id", proposal.tender_id)
      .single();

    if (tenderError) {
      throw new ServerActionError(`Erro ao verificar licitação: ${tenderError.message}`, 500);
    }

    // Verificar se ainda é possível retirar
    if (!["published", "in_progress"].includes(tender.status)) {
      throw new ServerActionError("Não é possível retirar proposta de licitação que não está em andamento", 400);
    }

    if (tender.closing_date && new Date(tender.closing_date) <= new Date()) {
      throw new ServerActionError("Não é possível retirar proposta após o prazo de fechamento", 400);
    }

    // Atualizar status da proposta para "withdrawn"
    const { error: updateError } = await supabase
      .from("tender_proposals")
      .update({
        status: "withdrawn",
        user_id: sessionData.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) {
      throw new ServerActionError(`Erro ao retirar proposta: ${updateError.message}`, 500);
    }

    return {
      success: true,
      message: "Proposta retirada com sucesso",
      withdrawnAt: new Date().toISOString(),
    };
  });
}


export async function getTenderProposalStats(tenderId: string) {
  return withErrorHandling(async () => {
    if (!tenderId) {
      throw new ServerActionError("ID da licitação é obrigatório", 400);
    }

    // CORREÇÃO: Query mais simples usando tender_lots_id diretamente
    const { data: stats, error } = await supabase
      .from("tender_proposals")
      .select(`
        status,
        supplier_ir,
        tender_lots_id
      `)
      .eq("tender_id", tenderId);

    if (error) {
      console.error("Error fetching proposal stats:", error);
      throw new ServerActionError(`Erro ao buscar estatísticas: ${error.message}`, 500);
    }

    const totalProposals = stats?.length || 0;
    const activeProposals = stats?.filter(p => p.status === "active").length || 0;
    const withdrawnProposals = stats?.filter(p => p.status === "withdrawn").length || 0;
    const uniqueSuppliers = new Set(stats?.map(p => p.supplier_ir).filter(Boolean)).size || 0;

    // Agrupar por lote - agora usando tender_lots_id diretamente
    const lotStats: Record<string, number> = {};
    stats?.forEach(proposal => {
      const lotId = proposal.tender_lots_id;
      if (lotId) {
        lotStats[lotId] = (lotStats[lotId] || 0) + 1;
      }
    });

    return {
      totalProposals,
      activeProposals,
      withdrawnProposals,
      uniqueSuppliers,
      lotStats,
    };
  });
}

export async function submitTenderProposal(
  tenderId: string,
  proposalData: {
    type: "lot" | "item";
    lotId: string;
    supplierId: string;
    items: Array<{
      itemId: string;
      unitPrice: number; 
      brand?: string;
      model?: string;
    }>;
    notes?: string;
  }
) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    if (!tenderId || !proposalData.lotId || !proposalData.supplierId || !proposalData.items.length) {
      throw new ServerActionError("Dados da proposta são obrigatórios", 400);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("supplier_id")
      .eq("id", sessionData.user.id)
      .single();

    if (!profile || profile.supplier_id !== proposalData.supplierId) {
      throw new ServerActionError("Você não tem permissão para representar este fornecedor", 403);
    }

    // Verificar se a licitação existe e está aberta
    const { data: tender, error: tenderError } = await supabase
      .from("tenders")
      .select("id, status, closing_date")
      .eq("id", tenderId)
      .single();

    if (tenderError) {
      if (tenderError.code === "PGRST116") {
        throw new ServerActionError("Licitação não encontrada", 404);
      }
      throw new ServerActionError(`Erro ao verificar licitação: ${tenderError.message}`, 500);
    }

    // Verificar se a licitação está aberta
    if (!["published", "in_progress"].includes(tender.status)) {
      throw new ServerActionError("Esta licitação não está aberta para propostas", 400);
    }

    // Verificar prazo de fechamento
    if (tender.closing_date && new Date(tender.closing_date) <= new Date()) {
      throw new ServerActionError("O prazo para envio de propostas já expirou", 400);
    }

    // Buscar o lote e seus itens separadamente
    const { data: lot, error: lotError } = await supabase
      .from("tender_lots")
      .select(`
        id,
        number,
        description,
        tender_items (
          id,
          item_number,
          description,
          quantity,
          unit,
          estimated_unit_price,
          benefit_type
        )
      `)
      .eq("id", proposalData.lotId)
      .eq("tender_id", tenderId)
      .single();

    if (lotError) {
      if (lotError.code === "PGRST116") {
        throw new ServerActionError("Lote não encontrado", 404);
      }
      throw new ServerActionError(`Erro ao verificar lote: ${lotError.message}`, 500);
    }

    // Preparar dados das propostas
    const proposalsToInsert = [];

    for (const item of proposalData.items) {
      // Verificar se o item existe no lote
      const tenderItem = lot.tender_items?.find((ti: any) => ti.id === item.itemId);
      if (!tenderItem) {
        throw new ServerActionError(`Item ${item.itemId} não encontrado no lote`, 400);
      }

      // Validar preço unitário
      if (!item.unitPrice || item.unitPrice <= 0) {
        throw new ServerActionError("Preço unitário deve ser maior que zero", 400);
      }

      // Converter centavos para reais (a tabela espera numeric)
      const unitPriceInReais = item.unitPrice / 100;

      // CORREÇÃO: Incluir supplier_ir e tender_lots_id
      proposalsToInsert.push({
        tender_id: tenderId,
        tender_item_id: item.itemId,
        supplier_ir: proposalData.supplierId,  // MUDANÇA: usar supplier_ir
        tender_lots_id: proposalData.lotId,    // NOVO: incluir tender_lots_id
        user_id: sessionData.user.id,
        value: unitPriceInReais,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Verificar se já existem propostas do fornecedor para estes itens
    const existingItemIds = proposalData.items.map(item => item.itemId);
    const { data: existingProposals, error: checkError } = await supabase
      .from("tender_proposals")
      .select("tender_item_id")
      .eq("supplier_ir", proposalData.supplierId)  // MUDANÇA: usar supplier_ir
      .in("tender_item_id", existingItemIds);

    if (checkError) {
      throw new ServerActionError(`Erro ao verificar propostas existentes: ${checkError.message}`, 500);
    }

    if (existingProposals && existingProposals.length > 0) {
      // Atualizar propostas existentes
      const updatePromises = proposalsToInsert.map(async (proposal) => {
        const existingProposal = existingProposals.find(
          ep => ep.tender_item_id === proposal.tender_item_id
        );

        if (existingProposal) {
          // Atualizar proposta existente
          const { error: updateError } = await supabase
            .from("tender_proposals")
            .update({
              value: proposal.value,
              status: "active",
              user_id: sessionData.user.id,
              updated_at: new Date().toISOString(),
            })
            .eq("tender_item_id", proposal.tender_item_id)
            .eq("supplier_ir", proposalData.supplierId);  // MUDANÇA: usar supplier_ir

          if (updateError) {
            throw new ServerActionError(`Erro ao atualizar proposta: ${updateError.message}`, 500);
          }
        } else {
          // Inserir nova proposta
          const { error: insertError } = await supabase
            .from("tender_proposals")
            .insert([proposal]);

          if (insertError) {
            throw new ServerActionError(`Erro ao inserir proposta: ${insertError.message}`, 500);
          }
        }
      });

      await Promise.all(updatePromises);
    } else {
      // Inserir todas as propostas como novas
      const { error: insertError } = await supabase
        .from("tender_proposals")
        .insert(proposalsToInsert);

      if (insertError) {
        if (insertError.code === "23505") { // Unique violation
          throw new ServerActionError("Você já possui propostas para alguns destes itens", 409);
        }
        throw new ServerActionError(`Erro ao inserir propostas: ${insertError.message}`, 500);
      }
    }

    // Buscar as propostas inseridas/atualizadas para retorno
    const { data: submittedProposals, error: fetchError } = await supabase
      .from("tender_proposals")
      .select(`
        id,
        tender_id,
        tender_item_id,
        supplier_ir,
        user_id,
        value,
        status,
        created_at,
        updated_at
      `)
      .eq("supplier_ir", proposalData.supplierId)  // MUDANÇA: usar supplier_ir
      .in("tender_item_id", existingItemIds);

    if (fetchError) {
      console.error("Error fetching submitted proposals:", fetchError);
    }

    return {
      success: true,
      message: `${proposalData.items.length} proposta(s) enviada(s) com sucesso`,
      proposals: submittedProposals || [],
      submittedAt: new Date().toISOString(),
    };
  });
}

export async function getUserTenderProposals(tenderId: string, supplierId?: string) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    if (!tenderId) {
      throw new ServerActionError("ID da licitação é obrigatório", 400);
    }

    // Se supplierId não for fornecido, pegar do profile do usuário
    let targetSupplierId = supplierId;
    if (!targetSupplierId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("supplier_id")
        .eq("id", sessionData.user.id)
        .single();

      if (!profile?.supplier_id) {
        throw new ServerActionError("Usuário não está vinculado a um fornecedor", 400);
      }
      targetSupplierId = profile.supplier_id;
    }

    const { data: proposals, error } = await supabase
      .from("tender_proposals")
      .select(`
        id,
        tender_id,
        tender_item_id,
        supplier_ir,
        user_id,
        value,
        status,
        disqualification_reason,
        created_at,
        updated_at,
        suppliers!tender_proposals_supplier_ir_fkey (
          id,
          name,
          cnpj
        ),
        tender_items!inner (
          id,
          item_number,
          description,
          quantity,
          unit,
          estimated_unit_price,
          benefit_type,
          tender_lots!inner (
            id,
            number,
            description
          )
        ),
        profiles!tender_proposals_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq("tender_id", tenderId)
      .eq("supplier_ir", targetSupplierId)  // MUDANÇA: usar supplier_ir
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching proposals:", error);
      throw new ServerActionError(`Erro ao buscar propostas: ${error.message}`, 500);
    }

    return proposals || [];
  });
}


export async function getSupplierTenderProposals(supplierId: string, tenderId?: string) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    if (!supplierId) {
      throw new ServerActionError("ID do fornecedor é obrigatório", 400);
    }

    // Verificar se o usuário pode acessar dados deste fornecedor
    const { data: profile } = await supabase
      .from("profiles")
      .select("supplier_id")
      .eq("id", sessionData.user.id)
      .single();

    if (!profile || profile.supplier_id !== supplierId) {
      throw new ServerActionError("Você não tem permissão para acessar dados deste fornecedor", 403);
    }

    let query = supabase
      .from("tender_proposals")
      .select(`
        id,
        tender_id,
        tender_item_id,
        supplier_id,
        user_id,
        value,
        status,
        disqualification_reason,
        created_at,
        updated_at,
        tenders!inner (
          id,
          title,
          tender_number,
          status,
          closing_date
        ),
        tender_items!inner (
          id,
          item_number,
          description,
          quantity,
          unit,
          estimated_unit_price,
          benefit_type,
          tender_lots!inner (
            id,
            number,
            description
          )
        ),
        profiles!tender_proposals_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq("supplier_id", supplierId);

    if (tenderId) {
      query = query.eq("tender_id", tenderId);
    }

    const { data: proposals, error } = await query
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching supplier proposals:", error);
      throw new ServerActionError(`Erro ao buscar propostas: ${error.message}`, 500);
    }

    return proposals || [];
  });
}

export async function checkSupplierCanPropose(tenderId: string, supplierId: string) {
  return withErrorHandling(async () => {
    if (!tenderId || !supplierId) {
      throw new ServerActionError("IDs da licitação e fornecedor são obrigatórios", 400);
    }

    // Verificar se o fornecedor está habilitado para participar
    const { data: participant, error: participantError } = await supabase
      .from("tender_participants")
      .select("status")
      .eq("tender_id", tenderId)
      .eq("supplier_id", supplierId)
      .single();

    if (participantError && participantError.code !== "PGRST116") {
      throw new ServerActionError(`Erro ao verificar participação: ${participantError.message}`, 500);
    }

    const canParticipate = participant?.status === "approved";

    // Verificar se a licitação está aberta
    const { data: tender, error: tenderError } = await supabase
      .from("tenders")
      .select("status, closing_date")
      .eq("id", tenderId)
      .single();

    if (tenderError) {
      throw new ServerActionError(`Erro ao verificar licitação: ${tenderError.message}`, 500);
    }

    const isOpen = ["published", "in_progress"].includes(tender.status);
    const notExpired = !tender.closing_date || new Date(tender.closing_date) > new Date();

    return {
      canPropose: canParticipate && isOpen && notExpired,
      reasons: {
        notApproved: !canParticipate,
        tenderClosed: !isOpen,
        expired: !notExpired,
      }
    };
  });
}

export async function fetchSupplierProposals(limit: number = 20, offset: number = 0) {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    // Verificar se é um fornecedor
    if (sessionData.profile?.profile_type !== "supplier") {
      throw new ServerActionError("Acesso negado: usuário não é fornecedor", 403);
    }

    // Buscar o supplier_id do perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("supplier_id")
      .eq("id", sessionData.user.id)
      .single();

    if (profileError || !profile?.supplier_id) {
      throw new ServerActionError("Fornecedor não encontrado no perfil", 404);
    }

    // Buscar propostas do fornecedor
    const { data: proposals, error } = await supabase
      .from("tender_proposals")
      .select(`
        id,
        tender_id,
        tender_item_id,
        supplier_ir,
        tender_lots_id,
        user_id,
        value,
        status,
        disqualification_reason,
        created_at,
        updated_at,
        tenders!inner (
          id,
          title,
          tender_number,
          status,
          tender_type,
          estimated_value,
          opening_date,
          closing_date,
          agencies!inner (
            id,
            name,
            cnpj,
            address
          )
        ),
        tender_lots!tender_proposals_tender_lots_id_fkey (
          id,
          number,
          description
        ),
        tender_items!inner (
          id,
          item_number,
          description,
          quantity,
          unit,
          estimated_unit_price
        ),
        suppliers!tender_proposals_supplier_ir_fkey (
          id,
          name,
          cnpj
        ),
        profiles!tender_proposals_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq("supplier_ir", profile.supplier_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching supplier proposals:", error);
      throw new ServerActionError(`Erro ao buscar propostas: ${error.message}`, 500);
    }

    // Transformar e agrupar propostas por licitação e lote
    const groupedProposals = (proposals || []).reduce((acc: any, proposal: any) => {
      const tenderKey = proposal.tender_id;
      const lotKey = proposal.tender_lots_id || 'no-lot';
      
      if (!acc[tenderKey]) {
        acc[tenderKey] = {
          tender: proposal.tenders,
          lots: {},
          summary: {
            totalItems: 0,
            totalValue: 0,
            status: proposal.status,
            lastUpdated: proposal.updated_at,
          }
        };
      }
      
      if (!acc[tenderKey].lots[lotKey]) {
        acc[tenderKey].lots[lotKey] = {
          lot: proposal.tender_lots,
          items: [],
          totalValue: 0,
        };
      }
      
      // Converter valor de reais para centavos para consistência
      const valueInCentavos = Math.round((proposal.value || 0) * 100);
      const itemTotal = valueInCentavos * (proposal.tender_items?.quantity || 1);
      
      acc[tenderKey].lots[lotKey].items.push({
        ...proposal,
        valueInCentavos,
        itemTotal,
      });
      
      acc[tenderKey].lots[lotKey].totalValue += itemTotal;
      acc[tenderKey].summary.totalItems += 1;
      acc[tenderKey].summary.totalValue += itemTotal;
      
      // Usar a data mais recente
      if (proposal.updated_at > acc[tenderKey].summary.lastUpdated) {
        acc[tenderKey].summary.lastUpdated = proposal.updated_at;
      }
      
      return acc;
    }, {});

    // Converter para array
    const proposalsList = Object.entries(groupedProposals).map(([tenderId, data]: [string, any]) => ({
      tender_id: tenderId,
      ...data,
    }));

    return proposalsList;
  });
}

export async function fetchSupplierProposalStats() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("supplier_id")
      .eq("id", sessionData.user.id)
      .single();

    if (!profile?.supplier_id) {
      return {
        totalProposals: 0,
        activeProposals: 0,
        wonProposals: 0,
        totalValue: 0,
      };
    }

    const { data: stats, error } = await supabase
      .from("tender_proposals")
      .select("status, value")
      .eq("supplier_ir", profile.supplier_id);

    if (error) {
      console.error("Error fetching proposal stats:", error);
      return {
        totalProposals: 0,
        activeProposals: 0,
        wonProposals: 0,
        totalValue: 0,
      };
    }

    const totalProposals = stats?.length || 0;
    const activeProposals = stats?.filter(p => p.status === "active").length || 0;
    const wonProposals = stats?.filter(p => p.status === "winner").length || 0;
    const totalValue = stats?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;

    return {
      totalProposals,
      activeProposals,
      wonProposals,
      totalValue: Math.round(totalValue * 100), // Converter para centavos
    };
  });
}

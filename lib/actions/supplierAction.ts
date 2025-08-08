"use server";

import { withErrorHandling, ServerActionError } from "./errorAction";
import { createClient } from "@supabase/supabase-js";
import { getSessionWithProfile, signUpAction } from "./authAction";
import { createProfile, fetchProfileByEmail, updateProfile } from "./profileAction";

function createServerActionClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const supabase = createServerActionClient();

async function registerRepresentative(
  rep: { name: string; email: string; cpf: string },
  supplierId: string
) {
  const existingUser = await fetchProfileByEmail(rep.email);
console.log("Existing user:", existingUser);
  const password = rep.cpf.replace(/\D/g, "");
  const userData = {
    email: rep.email,
    password,
    name: rep.name,
    profile_type: "supplier_representative",
    cpf: rep.cpf,
  };
  let userResult;
  if (!existingUser.data) {
    const result = await signUpAction(userData);
    userResult = result.data;
    console.log("Resultado do signUpAction:", result);

    if (!result.success || !result.data?.user?.id) {
      throw new ServerActionError(result.error || "Erro ao criar representante", 500);
    }
  } else {
    const res = await updateProfile(existingUser.data.id, {
      profile_type: "supplier_representative",
      supplier_id: supplierId,
    });
    if (!res.success) {
      throw new ServerActionError(res.error || "Erro ao atualizar perfil do representante", 500);
    }
    userResult = res.data;
  }
console.log("User result:", userResult);
  const { error: repError } = await supabase.from("supplier_representatives").insert({
    supplier_id: supplierId,
    user_id: userResult.id,
    is_admin: false,
  });

  if (repError) {
    throw new ServerActionError(`Erro ao vincular representante: ${repError.message}`, 500);
  }

  return userResult.id;
}

export async function registerSupplier({
  userId,
  supplierData,
  supplyLines,
  representatives,
  documents,
}: {
  userId: string;
  supplierData: Omit<Supplier, "id" | "created_at" | "updated_at" | "status">;
  supplyLines: string[]; // nomes dos segmentos
  representatives: { name: string; email: string; cpf: string }[];
  documents: { name: string; file_path: string; file_type?: string; file_size?: number }[];
}) {
  return withErrorHandling(async () => {
    try {
      const segmentIds: string[] = [];
      for (const name of supplyLines) {
        // Buscar segmento pelo nome
        let { data: segmento, error: segmentoError } = await supabase
          .from("supply_segments")
          .select("id")
          .eq("name", name)
          .single();

        // Se erro diferente de "not found", lança
        if (segmentoError && segmentoError.code !== "PGRST116") {
          throw new ServerActionError(`Erro ao buscar segmento: ${segmentoError.message}`, 500);
        }

        if (!segmento) {
          // Se não existe, cria
          const { data: novoSegmento, error: novoSegmentoError } = await supabase
            .from("supply_segments")
            .insert({ name })
            .select("id")
            .single();
          if (novoSegmentoError) {
            throw new ServerActionError(
              `Erro ao criar segmento: ${novoSegmentoError.message}`,
              500
            );
          }
          segmentIds.push(novoSegmento.id);
        } else {
          segmentIds.push(segmento.id);
        }
      }

      // Criação do supplier (usando os UUIDs dos segmentos)
      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert({
          ...supplierData,
          supply_lines: segmentIds,
          status: "pending",
        })
        .select()
        .single();

      if (supplierError) {
        throw new ServerActionError(`Erro ao criar fornecedor: ${supplierError.message}`, 500);
      }

      // Inserir na tabela de relacionamento supplier_segments
      for (const segment_id of segmentIds) {
        const { error: segmentError } = await supabase.from("supplier_segments").insert({
          supplier_id: supplier.id,
          segment_id,
        });
        if (segmentError) {
          throw new ServerActionError(`Erro ao inserir segmento: ${segmentError.message}`, 500);
        }
      }

      // Inserir representantes
      for (const rep of representatives) {
        try {
          await registerRepresentative(rep, supplier.id);
        } catch (err) {
          throw err;
        }
      }

      // Inserir documentos
      for (const doc of documents) {
        const { error: docError } = await supabase.from("supplier_documents").insert({
          supplier_id: supplier.id,
          user_id: userId,
          ...doc,
        });
        if (docError) {
          throw new ServerActionError(`Erro ao inserir documento: ${docError.message}`, 500);
        }
      }

      return supplier as Supplier;
    } catch (error) {
      throw error;
    }
  });
}

export async function fetchAllSuppliers() {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from("suppliers").select("*");
    if (error) {
      throw new ServerActionError(`Erro ao buscar fornecedores: ${error.message}`, 500);
    }
    return data;
  });
}

export async function fetchSupplierById(supplierId: string) {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", supplierId)
      .single();
    if (error) {
      throw new ServerActionError(`Erro ao buscar fornecedor: ${error.message}`, 500);
    }
    return data;
  });
}

export async function updateSupplierStatus(supplierId: string, status: string) {
  return withErrorHandling(async () => {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("supplier_id", supplierId)
      .single();
    const { data, error } = await supabase
      .from("suppliers")
      .update({ status, email: profileData?.email })
      .eq("id", supplierId)
      .select()
      .single();

    if (profileData && status === "active") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_type: "supplier" })
        .eq("id", profileData.id);

      if (updateError) {
        throw new ServerActionError(`Erro ao atualizar perfil: ${updateError.message}`, 500);
      }
    }

    if (error) {
      throw new ServerActionError(`Erro ao aprovar fornecedor: ${error.message}`, 500);
    }
    return data;
  });
}

export async function fetchSupplierDocuments(supplierId: string) {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from("supplier_documents")
      .select("*")
      .eq("supplier_id", supplierId);

    if (error) {
      throw new ServerActionError(`Erro ao buscar documentos do fornecedor: ${error.message}`, 500);
    }
    return data;
  });
}

export async function getSignedUrl(filePath: string) {

  const { data, error } = await supabase.storage
    .from("compras-brasil-storage")
    .createSignedUrl(filePath, 60 * 60); 
  if (error) throw error;
  return data.signedUrl;
}

export async function fetchSupplySegments() {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from("supply_segments").select("*");
    if (error) {
      throw new ServerActionError(`Erro ao buscar segmentos: ${error.message}`, 500);
    }
    return data;
  });
}

export async function fetchUserProposals(userId?: string) {
  return withErrorHandling(async () => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const sessionData = await getSessionWithProfile();
      if (!sessionData?.user) {
        throw new ServerActionError("Usuário não autenticado", 401);
      }
      targetUserId = sessionData.user.id;
    }

    const { data: proposals, error } = await supabase
      .from("tender_proposals")
      .select(`
        id,
        tender_id,
        tender_item_id,
        supplier_id,
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
          description,
          status,
          tender_type,
          estimated_value,
          opening_date,
          closing_date,
          agencies!inner (
            id,
            name,
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
        )
      `)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user proposals:", error);
      throw new ServerActionError(`Erro ao buscar propostas: ${error.message}`, 500);
    }

    const transformedProposals = (proposals || []).map((proposal: any) => {
      // Determinar tipo baseado nos dados
      const type = proposal.tender_lots_id ? "lot" : "item";
      
      // Converter valor de reais para o formato do componente
      const totalValue = (proposal.value || 0);
      
      // Extrair cidade e estado do endereço (se disponível)
      const address = proposal.tenders.agencies.address || "";
      const addressParts = address.split(",").map((part: string) => part.trim());
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 2] : "N/A";
      const state = addressParts.length > 0 ? addressParts[addressParts.length - 1] : "N/A";
      
      return {
        id: proposal.id,
        tender_id: proposal.tender_id,
        lot_id: proposal.tender_lots_id,
        item_id: type === "item" ? proposal.tender_item_id : null,
        type: type,
        total_value: totalValue,
        status: proposal.status,
        created_at: proposal.created_at,
        updated_at: proposal.updated_at,
        notes: null, // Campo notes não existe na estrutura atual
        tenders: {
          id: proposal.tenders.id,
          title: proposal.tenders.title,
          description: proposal.tenders.description,
          status: proposal.tenders.status,
          modality: proposal.tenders.tender_type,
          estimated_value: proposal.tenders.estimated_value,
          opening_date: proposal.tenders.opening_date,
          closing_date: proposal.tenders.closing_date,
          agency: {
            id: proposal.tenders.agencies.id,
            name: proposal.tenders.agencies.name,
            city: city,
            state: state,
          }
        }
      };
    });

    return transformedProposals;
  });
}

export async function fetchSupplierDashboardStats() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();
console.log("-------Session data:--------", sessionData);
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

    // Buscar licitações ativas (publicadas e em andamento)
    const { data: activeTenders, error: tendersError } = await supabase
      .from("tenders")
      .select("id, status")
      .in("status", ["published", "in_progress"])
      .order("created_at", { ascending: false });

    if (tendersError) {
      console.error("Erro ao buscar licitações ativas:", tendersError);
    }

    const activeTendersCount = activeTenders?.length || 0;

    // Buscar propostas do fornecedor
    const { data: proposals, error: proposalsError } = await supabase
      .from("tender_proposals")
      .select("id, status, value, created_at")
      .eq("user_id", sessionData.user.id)
      .order("created_at", { ascending: false });

    if (proposalsError) {
      console.error("Erro ao buscar propostas:", proposalsError);
    }

    const totalProposals = proposals?.length || 0;
    const activeProposals = proposals?.filter(p => p.status === "active").length || 0;
    const totalValue = proposals?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;

    // Buscar próximas sessões (licitações com opening_date próxima)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: upcomingSessions, error: sessionsError } = await supabase
      .from("tenders")
      .select("id, title, opening_date")
      .in("status", ["published", "in_progress"])
      .gte("opening_date", new Date().toISOString())
      .lte("opening_date", nextWeek.toISOString())
      .order("opening_date", { ascending: true });

    if (sessionsError) {
      console.error("Erro ao buscar próximas sessões:", sessionsError);
    }

    const upcomingSessionsCount = upcomingSessions?.length || 0;

    // Calcular tendências (comparar com período anterior)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: recentProposals } = await supabase
      .from("tender_proposals")
      .select("id")
      .eq("user_id", sessionData.user.id)
      .gte("created_at", oneWeekAgo.toISOString());

    const recentProposalsCount = recentProposals?.length || 0;

    return {
      activeTenders: activeTendersCount,
      totalProposals,
      activeProposals,
      upcomingSessions: upcomingSessionsCount,
      totalValue: Math.round(totalValue * 100), // Converter para centavos
      trends: {
        newProposalsThisWeek: recentProposalsCount,
        newTendersToday: 2, // Placeholder - pode ser calculado se necessário
      }
    };
  });
}

export async function fetchSupplierRecentActivities() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    // Buscar atividades recentes do fornecedor
    const activities: any[] = [];

    // 1. Propostas enviadas recentemente
    const { data: recentProposals, error: proposalsError } = await supabase
      .from("tender_proposals")
      .select(`
        id,
        created_at,
        status,
        tenders!inner (
          id,
          title,
          tender_number
        )
      `)
      .eq("user_id", sessionData.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!proposalsError && recentProposals) {
      recentProposals.forEach(proposal => {
        // CORREÇÃO: proposal.tenders é um objeto único, não array
        const tender = proposal.tenders as any; // Como é !inner, retorna objeto único
        
        activities.push({
          id: `proposal-${proposal.id}`,
          type: "proposal_sent",
          title: "Proposta enviada",
          description: `Licitação ${tender.tender_number || 'N/A'} - ${tender.title || 'Sem título'}`,
          timestamp: proposal.created_at,
          status: proposal.status,
        });
      });
    }

    // 2. Novas licitações relevantes (publicadas recentemente)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: newTenders, error: tendersError } = await supabase
      .from("tenders")
      .select("id, title, tender_number, publication_date, category")
      .eq("status", "published")
      .gte("publication_date", threeDaysAgo.toISOString())
      .order("publication_date", { ascending: false })
      .limit(3);

    if (!tendersError && newTenders) {
      newTenders.forEach(tender => {
        activities.push({
          id: `tender-${tender.id}`,
          type: "new_tender",
          title: "Nova licitação encontrada",
          description: `${tender.title || 'Sem título'} - ${tender.category || 'Categoria não definida'}`,
          timestamp: tender.publication_date,
          tenderId: tender.id,
        });
      });
    }

    // 3. Próximas sessões agendadas
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: upcomingSessions, error: sessionsError } = await supabase
      .from("tenders")
      .select("id, title, opening_date")
      .in("status", ["published", "in_progress"])
      .gte("opening_date", new Date().toISOString())
      .lte("opening_date", nextWeek.toISOString())
      .order("opening_date", { ascending: true })
      .limit(3);

    if (!sessionsError && upcomingSessions) {
      upcomingSessions.forEach(session => {
        activities.push({
          id: `session-${session.id}`,
          type: "upcoming_session",
          title: "Sessão agendada",
          description: session.title || 'Sem título',
          timestamp: session.opening_date,
          tenderId: session.id,
        });
      });
    }

    // Ordenar atividades por timestamp (mais recente primeiro)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Retornar apenas as 6 mais recentes
    return activities.slice(0, 6);
  });
}

export async function fetchUserProposalForLot(tenderId: string, lotId: string, userId?: string) {
  return withErrorHandling(async () => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const sessionData = await getSessionWithProfile();
      if (!sessionData?.user) {
        throw new ServerActionError("Usuário não autenticado", 401);
      }
      targetUserId = sessionData.user.id;
    }

    // CORREÇÃO: Buscar proposta através do item que pertence ao lote
    const { data: proposal, error } = await supabase
      .from("tender_proposals")
      .select(`
        id,
        tender_id,
        tender_item_id,
        tender_lots_id,
        user_id,
        value,
        status,
        created_at,
        updated_at,
        disqualification_reason,
        supplier_id,
        tender_items!inner (
          id,
          item_number,
          description,
          quantity,
          unit,
          estimated_unit_price,
          lot_id,
          tender_lots!inner (
            id,
            number,
            description,
            type,
            estimated_value
          )
        )
      `)
      .eq("tender_id", tenderId)
      .eq("user_id", targetUserId)
      .eq("tender_items.lot_id", lotId) // Filtrar pelo lote através do item
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar proposta:", error);
      throw new ServerActionError(`Erro ao buscar proposta: ${error.message}`, 500);
    }

    return proposal; // Retorna null se não encontrar
  });
}

export async function fetchUserProposalsForTender(tenderId: string, userId?: string) {
  return withErrorHandling(async () => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const sessionData = await getSessionWithProfile();
      if (!sessionData?.user) {
        throw new ServerActionError("Usuário não autenticado", 401);
      }
      targetUserId = sessionData.user.id;
    }

    console.log("🔍 Buscando propostas para:", { tenderId, targetUserId });

    // CORREÇÃO: Primeiro buscar propostas do usuário para esta licitação
    const { data: proposals, error } = await supabase
      .from("tender_proposals")
      .select(`
        id,
        tender_id,
        tender_item_id,
        tender_lots_id,
        user_id,
        value,
        status,
        created_at,
        updated_at,
        disqualification_reason,
        supplier_id
      `)
      .eq("tender_id", tenderId)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erro ao buscar propostas:", error);
      throw new ServerActionError(`Erro ao buscar propostas: ${error.message}`, 500);
    }

    console.log("📋 Propostas encontradas:", proposals);

    if (!proposals || proposals.length === 0) {
      console.log("⚠️ Nenhuma proposta encontrada");
      return {};
    }

    // CORREÇÃO: Buscar informações dos itens e lotes separadamente
    const itemIds = proposals.map(p => p.tender_item_id);
    const lotIds = proposals.map(p => p.tender_lots_id).filter(Boolean);

    console.log("🔗 IDs para buscar:", { itemIds, lotIds });

    // Buscar informações dos itens
    const { data: items, error: itemsError } = await supabase
      .from("tender_items")
      .select(`
        id,
        item_number,
        description,
        quantity,
        unit,
        estimated_unit_price,
        lot_id
      `)
      .in("id", itemIds);

    if (itemsError) {
      console.error("❌ Erro ao buscar itens:", itemsError);
    }

    // Buscar informações dos lotes
    const { data: lots, error: lotsError } = await supabase
      .from("tender_lots")
      .select(`
        id,
        number,
        description,
        type,
        estimated_value
      `)
      .in("id", lotIds);

    if (lotsError) {
      console.error("❌ Erro ao buscar lotes:", lotsError);
    }

    console.log("📊 Dados auxiliares:", { items, lots });

    // Criar mapas para facilitar a busca
    const itemsMap = new Map(items?.map(item => [item.id, item]) || []);
    const lotsMap = new Map(lots?.map(lot => [lot.id, lot]) || []);

    // CORREÇÃO: Agrupar propostas por lote usando tender_lots_id OU item.lot_id
    const proposalsByLot: Record<string, any[]> = {};
    
    proposals.forEach(proposal => {
      let lotId = null;

      // Primeiro tentar usar tender_lots_id diretamente
      if (proposal.tender_lots_id) {
        lotId = proposal.tender_lots_id;
      } 
      // Se não tiver, buscar pelo item
      else if (proposal.tender_item_id) {
        const item = itemsMap.get(proposal.tender_item_id);
        if (item && item.lot_id) {
          lotId = item.lot_id;
        }
      }

      if (lotId) {
        if (!proposalsByLot[lotId]) {
          proposalsByLot[lotId] = [];
        }
        
        // Enriquecer proposta com dados do item e lote
        const item = itemsMap.get(proposal.tender_item_id);
        const lot = lotsMap.get(lotId);
        
        const enrichedProposal = {
          ...proposal,
          tender_items: item,
          tender_lots: lot
        };
        
        proposalsByLot[lotId].push(enrichedProposal);
      }
    });

    console.log("📊 Propostas agrupadas por lote:", proposalsByLot);
    
    return proposalsByLot;
  });
}

export async function debugUserProposals(tenderId: string, userId?: string) {
  return withErrorHandling(async () => {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const sessionData = await getSessionWithProfile();
      if (!sessionData?.user) {
        throw new ServerActionError("Usuário não autenticado", 401);
      }
      targetUserId = sessionData.user.id;
    }

    console.log("🔍 DEBUG - Parâmetros:", { tenderId, targetUserId });

    const { data: allProposals, error: allError } = await supabase
      .from("tender_proposals")
      .select("*")
      .eq("user_id", targetUserId);

    console.log("📋 TODAS as propostas do usuário:", allProposals);

    const { data: tenderProposals, error: tenderError } = await supabase
      .from("tender_proposals")
      .select("*")
      .eq("tender_id", tenderId);

    console.log("📋 TODAS as propostas deste tender:", tenderProposals);

    const { data: userTenderProposals, error: userTenderError } = await supabase
      .from("tender_proposals")
      .select("*")
      .eq("tender_id", tenderId)
      .eq("user_id", targetUserId);

    console.log("📋 Propostas do usuário para este tender:", userTenderProposals);

    const { data: tenderLots, error: lotsError } = await supabase
      .from("tender_lots")
      .select("*")
      .eq("tender_id", tenderId);

    console.log("🏷️ Lotes deste tender:", tenderLots);

    const { data: tenderItems, error: itemsError } = await supabase
      .from("tender_items")
      .select("*")
      .eq("tender_id", tenderId);

    console.log("📦 Itens deste tender:", tenderItems);

    return {
      allProposals,
      tenderProposals,
      userTenderProposals,
      tenderLots,
      tenderItems,
      debug: {
        tenderId,
        targetUserId,
        hasAllProposals: !!allProposals?.length,
        hasTenderProposals: !!tenderProposals?.length,
        hasUserTenderProposals: !!userTenderProposals?.length,
      }
    };
  });
}


export async function fetchSupplierTenderSchedule() {
  return withErrorHandling(async () => {
    const sessionData = await getSessionWithProfile();

    if (!sessionData?.user) {
      throw new ServerActionError("Usuário não autenticado", 401);
    }

    if (sessionData.profile?.profile_type !== "supplier") {
      throw new ServerActionError("Acesso negado: usuário não é fornecedor", 403);
    }

    console.log("📅 Buscando agenda para usuário:", sessionData.user.id);

    try {
      // Buscar propostas reais do usuário
      const { data: proposals, error: proposalsError } = await supabase
        .from("tender_proposals")
        .select(`
          id,
          tender_id,
          tender_item_id,
          value,
          status,
          created_at,
          tenders!inner (
            id,
            title,
            tender_number,
            status,
            estimated_value,
            publication_date,
            opening_date,
            closing_date,
            agencies!inner (
              id,
              name,
              address
            )
          )
        `)
        .eq("user_id", sessionData.user.id)  // CORREÇÃO: usar user_id ao invés de supplier_id
        .order("created_at", { ascending: false });

      console.log("📋 Propostas encontradas:", proposals);

      if (proposalsError) {
        console.error("❌ Erro ao buscar propostas:", proposalsError);
        throw new ServerActionError(`Erro ao buscar propostas: ${proposalsError.message}`, 500);
      }

      console.log("📋 Propostas encontradas:", proposals?.length || 0);

      // Se não houver propostas, retornar array vazio
      if (!proposals || proposals.length === 0) {
        console.log("⚠️ Nenhuma proposta encontrada - calendário ficará vazio");
        return [];
      }

      // Processar eventos para todas as datas (passadas e futuras)
      const events: any[] = [];
      const now = new Date();
      const processedTenders = new Set(); // Para evitar duplicatas

      proposals.forEach((proposal: any) => {
        const tender = proposal.tenders;
        
        // Evitar processar a mesma licitação múltiplas vezes
        if (processedTenders.has(tender.id)) {
          return;
        }
        processedTenders.add(tender.id);

        // Extrair cidade do endereço da agência
        const address = tender.agencies?.address || "";
        const city = address.split(",").pop()?.trim() || tender.agencies?.name || "Local não informado";

        // Calcular dias restantes para cada data (pode ser negativo se já passou)
        const calculateDaysRemaining = (dateStr: string) => {
          if (!dateStr) return undefined;
          const eventDate = new Date(dateStr);
          const diffTime = eventDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays; // Pode ser negativo se já passou
        };

        // Encontrar todas as propostas do usuário para esta licitação
        const userProposalsForTender = proposals.filter(p => p.tender_id === tender.id);
        const totalProposalValue = userProposalsForTender.reduce((sum, p) => sum + (p.value || 0), 0);
        const proposalStatus = userProposalsForTender[0]?.status;

        // 1. ABERTURA - SEMPRE adicionar se existir (mesmo se já passou)
        if (tender.opening_date) {
          const openingDate = new Date(tender.opening_date);
          events.push({
            id: `${tender.id}-opening`,
            tender_id: tender.id,
            title: tender.title || 'Licitação sem título',
            tender_number: tender.tender_number || 'N/A',
            date: tender.opening_date.split('T')[0],
            time: openingDate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            agency: city,
            status: tender.status,
            type: "opening_date",
            estimated_value: tender.estimated_value ? Math.round(tender.estimated_value * 100) : 0,
            proposal_value: totalProposalValue ? Math.round(totalProposalValue * 100) : 0,
            proposal_status: proposalStatus,
            days_remaining: calculateDaysRemaining(tender.opening_date),
            is_past: openingDate < now, // Indicar se já passou
          });
        }

        // 2. FECHAMENTO - SEMPRE adicionar se existir (mesmo se já passou)
        if (tender.closing_date) {
          const closingDate = new Date(tender.closing_date);
          events.push({
            id: `${tender.id}-closing`,
            tender_id: tender.id,
            title: tender.title || 'Licitação sem título',
            tender_number: tender.tender_number || 'N/A',
            date: tender.closing_date.split('T')[0],
            time: closingDate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            agency: city,
            status: tender.status,
            type: "closing_date",
            estimated_value: tender.estimated_value ? Math.round(tender.estimated_value * 100) : 0,
            proposal_value: totalProposalValue ? Math.round(totalProposalValue * 100) : 0,
            proposal_status: proposalStatus,
            days_remaining: calculateDaysRemaining(tender.closing_date),
            is_past: closingDate < now, // Indicar se já passou
          });
        }

        // 3. PUBLICAÇÃO - SEMPRE adicionar se existir
        if (tender.publication_date) {
          const publicationDate = new Date(tender.publication_date);
          events.push({
            id: `${tender.id}-publication`,
            tender_id: tender.id,
            title: tender.title || 'Licitação sem título',
            tender_number: tender.tender_number || 'N/A',
            date: tender.publication_date.split('T')[0],
            time: publicationDate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            agency: city,
            status: tender.status,
            type: "opening_date", // Usar como tipo genérico
            estimated_value: tender.estimated_value ? Math.round(tender.estimated_value * 100) : 0,
            proposal_value: totalProposalValue ? Math.round(totalProposalValue * 100) : 0,
            proposal_status: proposalStatus,
            days_remaining: calculateDaysRemaining(tender.publication_date),
            is_past: publicationDate < now,
          });
        }

        // 4. PRAZO DE ENVIO - Simular baseado na abertura (2 horas antes)
        if (tender.opening_date) {
          const openingDate = new Date(tender.opening_date);
          const proposalDeadline = new Date(openingDate.getTime() - (2 * 60 * 60 * 1000)); // 2 horas antes
          
          events.push({
            id: `${tender.id}-proposal-deadline`,
            tender_id: tender.id,
            title: tender.title || 'Licitação sem título',
            tender_number: tender.tender_number || 'N/A',
            date: proposalDeadline.toISOString().split('T')[0],
            time: proposalDeadline.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            agency: city,
            status: tender.status,
            type: "submission_deadline",
            estimated_value: tender.estimated_value ? Math.round(tender.estimated_value * 100) : 0,
            proposal_value: totalProposalValue ? Math.round(totalProposalValue * 100) : 0,
            proposal_status: proposalStatus,
            days_remaining: calculateDaysRemaining(proposalDeadline.toISOString()),
            is_past: proposalDeadline < now,
          });
        }
      });

      // Ordenar eventos por data (mais antigo primeiro)
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Log final com estatísticas
      const eventsByType = events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {});

      const futureEvents = events.filter(e => !e.is_past);
      const pastEvents = events.filter(e => e.is_past);

      console.log("📅 Eventos processados:", {
        total: events.length,
        future: futureEvents.length,
        past: pastEvents.length,
        tenders: processedTenders.size,
        byType: eventsByType,
        dateRange: events.length > 0 ? {
          from: events[0]?.date,
          to: events[events.length - 1]?.date
        } : null,
        sampleEvents: events.slice(0, 3).map(e => ({
          id: e.id,
          date: e.date,
          type: e.type,
          title: e.title.substring(0, 30),
          is_past: e.is_past
        }))
      });
      
      return events; // Retorna TODOS os eventos (passados e futuros)

    } catch (error) {
      console.error("💥 Erro inesperado:", error);
      throw new ServerActionError("Erro inesperado ao processar agenda", 500);
    }
  });
}

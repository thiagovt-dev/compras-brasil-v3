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

    // CORREÇÃO: Buscar propostas do usuário/fornecedor com campos corretos
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

    // Transformar dados para o formato esperado pelo componente atual
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

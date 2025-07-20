"use server";

import { withErrorHandling, ServerActionError } from "./errorAction";
import { createClient } from "@supabase/supabase-js";

function createServerActionClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const supabase = createServerActionClient();

export async function fetchAgencies() {
  return withErrorHandling(async () => {
    const { data: agencies, error } = await supabase
      .from("agencies")
      .select("id, name, agency_type, sphere, created_at, cnpj, address, email, phone, website, status, updated_at")
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error fetching agencies:", error);
      throw new ServerActionError(`Erro ao buscar órgãos: ${error.message}`, 500);
    }

    return agencies as Agency[] || [];
  });
}

export async function fetchAllAgencies() {
  return withErrorHandling(async () => {
    const { data: agencies, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error fetching all agencies:", error);
      throw new ServerActionError(`Erro ao buscar órgãos: ${error.message}`, 500);
    }

    return agencies as Agency[] || [];
  });
}

export async function fetchAgencyById(agencyId: string) {
  return withErrorHandling(async () => {
    if (!agencyId) {
      throw new ServerActionError("Agency ID is required", 400);
    }

    const { data: agency, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", agencyId)
      .single();

    if (error) {
      console.error("Error fetching agency:", error);

      if (error.code === "PGRST116") {
        throw new ServerActionError("Órgão não encontrado", 404);
      } else {
        throw new ServerActionError(`Erro ao buscar órgão: ${error.message}`, 500);
      }
    }

    return agency as Agency;
  });
}

export async function fetchAgenciesByType(agencyType: string) {
  return withErrorHandling(async () => {
    if (!agencyType) {
      throw new ServerActionError("Agency type is required", 400);
    }

    const { data: agencies, error } = await supabase
      .from("agencies")
      .select("id, name, agency_type, sphere")
      .eq("agency_type", agencyType)
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error fetching agencies by type:", error);
      throw new ServerActionError(`Erro ao buscar órgãos por tipo: ${error.message}`, 500);
    }

    return agencies as Partial<Agency>[] || [];
  });
}

export async function fetchAgenciesBySphere(sphere: string) {
  return withErrorHandling(async () => {
    if (!sphere) {
      throw new ServerActionError("Sphere is required", 400);
    }

    const { data: agencies, error } = await supabase
      .from("agencies")
      .select("id, name, agency_type, sphere")
      .eq("sphere", sphere)
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error fetching agencies by sphere:", error);
      throw new ServerActionError(`Erro ao buscar órgãos por esfera: ${error.message}`, 500);
    }

    return agencies as Partial<Agency>[] || [];
  });
}

export async function searchAgencies(query: string) {
  return withErrorHandling(async () => {
    if (!query) {
      throw new ServerActionError("Search query is required", 400);
    }

    const { data: agencies, error } = await supabase
      .from("agencies")
      .select("id, name, agency_type, sphere")
      .eq("status", "active")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(20);

    if (error) {
      console.error("Error searching agencies:", error);
      throw new ServerActionError(`Erro ao pesquisar órgãos: ${error.message}`, 500);
    }

    return agencies as Partial<Agency>[] || [];
  });
}

export async function createAgency(agencyData: Omit<Agency, "id" | "created_at" | "updated_at">) {
  return withErrorHandling(async () => {
    if (!agencyData.name) {
      throw new ServerActionError("Nome do órgão é obrigatório", 400);
    }

    const { data: agency, error } = await supabase
      .from("agencies")
      .insert({
        ...agencyData,
        status: agencyData.status || "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating agency:", error);

      if (error.code === "23505") {
        throw new ServerActionError("Já existe um órgão com este CNPJ", 409);
      } else {
        throw new ServerActionError(`Erro ao criar órgão: ${error.message}`, 500);
      }
    }

    return agency as Agency;
  });
}

export async function updateAgency(agencyId: string, updateData: Partial<Agency>) {
  return withErrorHandling(async () => {
    if (!agencyId) {
      throw new ServerActionError("Agency ID is required", 400);
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new ServerActionError("Update data is required", 400);
    }

    const { data: agency, error } = await supabase
      .from("agencies")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId)
      .select()
      .single();

    if (error) {
      console.error("Error updating agency:", error);
      throw new ServerActionError(`Erro ao atualizar órgão: ${error.message}`, 500);
    }

    return agency as Agency;
  });
}

export async function deleteAgency(agencyId: string) {
  return withErrorHandling(async () => {
    if (!agencyId) {
      throw new ServerActionError("Agency ID is required", 400);
    }

    // Soft delete - marcar como inativo
    const { data: agency, error } = await supabase
      .from("agencies")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", agencyId)
      .select()
      .single();

    if (error) {
      console.error("Error deleting agency:", error);
      throw new ServerActionError(`Erro ao deletar órgão: ${error.message}`, 500);
    }

    return agency as Agency;
  });
}

export async function getAgencyStats(agencyId: string) {
  return withErrorHandling(async () => {
    if (!agencyId) {
      throw new ServerActionError("Agency ID is required", 400);
    }

    // Buscar estatísticas básicas
    const { data: tenderStats, error: statsError } = await supabase
      .from("tenders")
      .select("status, estimated_value")
      .eq("agency_id", agencyId);

    if (statsError) {
      console.error("Error fetching agency stats:", statsError);
      throw new ServerActionError(`Erro ao buscar estatísticas: ${statsError.message}`, 500);
    }

    const activeTenders = tenderStats?.filter(t => ["published", "in_progress"].includes(t.status)).length || 0;
    const completedTenders = tenderStats?.filter(t => t.status === "completed").length || 0;
    const totalTenders = tenderStats?.length || 0;
    const totalValue = tenderStats?.reduce((sum, t) => sum + (t.estimated_value || 0), 0) || 0;

    return {
      totalTenders,
      activeTenders,
      completedTenders,
      totalValue,
    };
  });
}

export async function fetchAgencyTypes() {
  return withErrorHandling(async () => {
    const agencyTypes: { value: string; label: string }[] = [
      { value: "ministerio", label: "Ministério" },
      { value: "secretaria", label: "Secretaria" },
      { value: "autarquia", label: "Autarquia" },
      { value: "fundacao", label: "Fundação" },
      { value: "empresa_publica", label: "Empresa Pública" },
      { value: "sociedade_economia_mista", label: "Sociedade de Economia Mista" },
      { value: "agencia_reguladora", label: "Agência Reguladora" },
      { value: "tribunal", label: "Tribunal" },
      { value: "prefeitura", label: "Prefeitura" },
      { value: "camara_municipal", label: "Câmara Municipal" },
      { value: "assembleia_legislativa", label: "Assembleia Legislativa" },
      { value: "outro", label: "Outro" },
    ];

    return agencyTypes;
  });
}

export async function fetchAgencySpheres() {
  return withErrorHandling(async () => {
    const spheres: { value: string; label: string }[] = [
      { value: "federal", label: "Federal" },
      { value: "estadual", label: "Estadual" },
      { value: "municipal", label: "Municipal" },
      { value: "distrital", label: "Distrital" },
    ];

    return spheres;
  });
}

export async function validateAgencyData(agencyData: Partial<Agency>) {
  return withErrorHandling(async () => {
    const errors: string[] = [];

    if (!agencyData.name) {
      errors.push("Nome é obrigatório");
    }

    if (agencyData.cnpj) {
      const cnpjDigits = agencyData.cnpj.replace(/\D/g, '');
      if (cnpjDigits.length !== 14) {
        errors.push("CNPJ deve ter 14 dígitos");
      }

      const { data: existingAgency, error } = await supabase
        .from("agencies")
        .select("id")
        .eq("cnpj", agencyData.cnpj)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new ServerActionError(`Erro ao validar CNPJ: ${error.message}`, 500);
      }

      if (existingAgency) {
        errors.push("Já existe um órgão com este CNPJ");
      }
    }

    if (agencyData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(agencyData.email)) {
        errors.push("Email deve ter um formato válido");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  });
}

export async function fetchRecentAgencies(limit: number = 10) {
  return withErrorHandling(async () => {
    const { data: agencies, error } = await supabase
      .from("agencies")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent agencies:", error);
      throw new ServerActionError(`Erro ao buscar órgãos recentes: ${error.message}`, 500);
    }

    return agencies as Agency[] || [];
  });
}
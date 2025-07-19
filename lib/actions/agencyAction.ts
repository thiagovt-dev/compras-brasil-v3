"use server";

import { withErrorHandling, ServerActionError } from "./errorAction";
import { createClient } from "@supabase/supabase-js";

interface Agency {
  id: string;
  name: string;
  cnpj?: string;
  agency_type?: string;
  sphere?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

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
      .select("id, name, agency_type, sphere")
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error fetching agencies:", error);
      throw new ServerActionError(`Erro ao buscar órgãos: ${error.message}`, 500);
    }

    return agencies || [];
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

    return agency;
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

    return agencies || [];
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

    return agencies || [];
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

    return agencies || [];
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

    return agency;
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

    return agency;
  });
}

export async function fetchAgencyTypes() {
  return withErrorHandling(async () => {
    const agencyTypes = [
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
    const spheres = [
      { value: "federal", label: "Federal" },
      { value: "estadual", label: "Estadual" },
      { value: "municipal", label: "Municipal" },
      { value: "distrital", label: "Distrital" },
    ];

    return spheres;
  });
}

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function checkDuplicateDocuments() {
  const supabase = createClientComponentClient()

  try {
    console.log("🔍 Verificando documentos duplicados...")

    // Buscar todos os perfis
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, email, cpf, cnpj")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Erro ao buscar perfis:", error)
      return
    }

    console.log(`📊 Total de perfis: ${profiles.length}`)

    // Verificar CPFs duplicados
    const cpfMap = new Map()
    const cnpjMap = new Map()

    profiles.forEach((profile) => {
      if (profile.cpf) {
        const cleanCPF = profile.cpf.replace(/\D/g, "")
        if (cpfMap.has(cleanCPF)) {
          cpfMap.get(cleanCPF).push(profile)
        } else {
          cpfMap.set(cleanCPF, [profile])
        }
      }

      if (profile.cnpj) {
        const cleanCNPJ = profile.cnpj.replace(/\D/g, "")
        if (cnpjMap.has(cleanCNPJ)) {
          cnpjMap.get(cleanCNPJ).push(profile)
        } else {
          cnpjMap.set(cleanCNPJ, [profile])
        }
      }
    })

    // Mostrar duplicados
    console.log("\n📋 CPFs duplicados:")
    for (const [cpf, profileList] of cpfMap.entries()) {
      if (profileList.length > 1) {
        console.log(`CPF ${cpf}:`)
        profileList.forEach((p) => console.log(`  - ${p.name} (${p.email})`))
      }
    }

    console.log("\n📋 CNPJs duplicados:")
    for (const [cnpj, profileList] of cnpjMap.entries()) {
      if (profileList.length > 1) {
        console.log(`CNPJ ${cnpj}:`)
        profileList.forEach((p) => console.log(`  - ${p.name} (${p.email})`))
      }
    }
  } catch (error) {
    console.error("Erro na verificação:", error)
  }
}

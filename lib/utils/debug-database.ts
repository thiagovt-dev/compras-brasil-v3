import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function debugProfilesTable() {
  const supabase = createClientComponentClient()

  console.log("🔍 Verificando dados na tabela profiles...")

  const { data: profiles, error } = await supabase.from("profiles").select("id, name, email, cpf, cnpj").limit(10)

  if (error) {
    console.error("❌ Erro ao buscar profiles:", error)
    return
  }

  console.log("📊 Primeiros 10 perfis na tabela:")
  profiles?.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.name}`)
    console.log(`   Email: ${profile.email}`)
    console.log(`   CPF: ${profile.cpf}`)
    console.log(`   CNPJ: ${profile.cnpj}`)
    console.log("---")
  })

  // Buscar especificamente pelo CPF do exemplo
  const { data: specificProfile, error: specificError } = await supabase
    .from("profiles")
    .select("*")
    .eq("cpf", "059.517.363-23")

  console.log("🎯 Busca específica por CPF '059.517.363-23':")
  console.log("Resultado:", specificProfile)
  console.log("Erro:", specificError)
}

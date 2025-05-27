import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const certificate = formData.get("certificate") as File
    const password = formData.get("password") as string
    const type = formData.get("type") as string

    if (!certificate) {
      return NextResponse.json({ error: "Certificado não fornecido" }, { status: 400 })
    }

    // Simular extração de informações do certificado
    // Em um ambiente de produção, você usaria uma biblioteca como node-forge ou openssl
    const certificateInfo = {
      subject: {
        commonName: "Nome do Titular",
        name: "Nome Completo do Titular",
        organizationName: "Organização do Titular",
      },
      issuer: {
        commonName: "Autoridade Certificadora",
        organizationName: "Nome da AC",
      },
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano a partir de agora
      serialNumber: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      thumbprint: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    }

    return NextResponse.json(certificateInfo)
  } catch (error: any) {
    console.error("Erro ao extrair informações do certificado:", error)
    return NextResponse.json({ error: "Erro ao processar certificado", message: error.message }, { status: 500 })
  }
}

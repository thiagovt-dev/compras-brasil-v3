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

    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: "ID do documento não fornecido" }, { status: 400 })
    }

    // Buscar informações do documento assinado
    const { data: signedDoc, error } = await supabase
      .from("signed_documents")
      .select("*, digital_certificates(*)")
      .eq("id", documentId)
      .single()

    if (error) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 })
    }

    // Simular verificação da assinatura
    // Em um ambiente de produção, você usaria uma biblioteca para verificar a assinatura
    const verificationResult = {
      valid: true,
      document: {
        name: signedDoc.signed_name,
        signedAt: signedDoc.signature_date,
      },
      signer: {
        name: signedDoc.digital_certificates.subject_name,
        certificate: {
          issuer: signedDoc.digital_certificates.issuer,
          validFrom: signedDoc.digital_certificates.valid_from,
          validTo: signedDoc.digital_certificates.valid_to,
          serialNumber: signedDoc.digital_certificates.serial_number,
        },
      },
      signature: {
        algorithm: "SHA256withRSA",
        timestamp: signedDoc.signature_date,
        reason: signedDoc.reason,
        location: signedDoc.location,
      },
    }

    return NextResponse.json(verificationResult)
  } catch (error: any) {
    console.error("Erro ao verificar assinatura:", error)
    return NextResponse.json({ error: "Erro ao verificar assinatura", message: error.message }, { status: 500 })
  }
}

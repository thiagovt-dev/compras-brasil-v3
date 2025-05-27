import { createXai } from "@ai-sdk/xai"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
})

export async function POST(request: NextRequest) {
  console.log("=== API ASSISTANT CHAMADA ===")

  try {
    console.log("1. Lendo body...")
    const body = await request.json()
    console.log("2. Body recebido:", body)

    const { messages } = body
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log("3. Mensagens inválidas, usando resposta padrão")
      return NextResponse.json({
        content: "Olá! Como posso ajudar com suas dúvidas sobre licitações?",
        success: true,
      })
    }

    const lastMessage = messages[messages.length - 1]?.content || ""
    console.log("3. Última mensagem:", lastMessage)

    // Tentar usar o Grok com modelo correto
    console.log("4. Chamando Grok...")
    const { text } = await generateText({
      model: xai("grok-2-1212"), // Modelo correto
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em licitações públicas brasileiras. 
          Responda de forma clara e objetiva em português sobre:
          - Procedimentos licitatórios
          - Lei 14.133/2021
          - Documentação necessária
          - Modalidades de licitação
          - ME/EPP
          - Certificação digital
          
          Seja prático e útil.`,
        },
        { role: "user", content: lastMessage },
      ],
      temperature: 0.7,
      maxTokens: 500,
    })

    console.log("5. Resposta do Grok recebida:", text?.substring(0, 100) + "...")

    if (!text) {
      throw new Error("Resposta vazia do Grok")
    }

    console.log("6. Enviando resposta de sucesso")
    return NextResponse.json({
      content: text,
      success: true,
    })
  } catch (error) {
    console.error("=== ERRO NA API ===", error)

    // Fallback para resposta manual se Grok falhar
    const fallbackResponse =
      "Desculpe, estou com dificuldades técnicas no momento. Posso ajudar com informações básicas sobre licitações públicas. Qual sua dúvida específica?"

    return NextResponse.json({
      content: fallbackResponse,
      success: true,
      fallback: true,
    })
  }
}

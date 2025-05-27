import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const ASSISTANT_PROMPT = `
Você é um assistente especializado em licitações públicas brasileiras, integrado ao sistema Central de Compras Brasil.

Suas principais funções:
1. Auxiliar na análise de editais de licitação
2. Explicar procedimentos licitatórios conforme a Lei 14.133/2021 (Nova Lei de Licitações)
3. Orientar sobre documentação necessária
4. Esclarecer dúvidas sobre modalidades licitatórias
5. Ajudar na elaboração de propostas
6. Explicar recursos e impugnações
7. Orientar sobre certificação digital e ME/EPP

Sempre responda em português brasileiro, seja preciso e cite a legislação quando relevante.
Mantenha um tom profissional mas acessível.
`

export async function generateAssistantResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  context?: string,
) {
  try {
    const systemMessage = {
      role: "system" as const,
      content: ASSISTANT_PROMPT + (context ? `\n\nContexto adicional: ${context}` : ""),
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Usando modelo mais estável
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return response.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta."
  } catch (error) {
    console.error("Error generating assistant response:", error)
    throw new Error("Erro ao gerar resposta do assistente")
  }
}

export async function analyzeTenderDocument(documentText: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em análise de editais de licitação brasileiros. 
          Analise o documento fornecido e extraia as informações principais:
          - Modalidade licitatória
          - Objeto da licitação
          - Valor estimado
          - Prazos importantes
          - Documentação exigida
          - Critérios de julgamento
          - Pontos de atenção ou riscos`,
        },
        {
          role: "user",
          content: `Analise este edital de licitação: ${documentText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    return response.choices[0]?.message?.content || "Não foi possível analisar o documento."
  } catch (error) {
    console.error("Error analyzing tender document:", error)
    throw new Error("Erro ao analisar documento")
  }
}

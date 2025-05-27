import { describe, it, expect, vi, beforeEach } from "vitest"
import { licitationAssistant } from "@/lib/openai/client"

// Mock OpenAI
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "Resposta do assistente de teste",
              },
            },
          ],
        }),
      },
    },
  })),
}))

describe("Licitation Assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should analyze tender correctly", async () => {
    const mockTender = {
      title: "Aquisição de Equipamentos",
      description: "Compra de computadores para órgão público",
      estimated_value: 100000,
      tender_type: "pregao-eletronico",
      agency: { name: "Ministério da Educação" },
      opening_date: "2024-01-15",
    }

    const analysis = await licitationAssistant.analyzetender(mockTender)

    expect(analysis).toBeDefined()
    expect(analysis.summary).toBeTruthy()
    expect(analysis.recommendations).toBeInstanceOf(Array)
    expect(analysis.riskFactors).toBeInstanceOf(Array)
    expect(analysis.opportunities).toBeInstanceOf(Array)
    expect(analysis.estimatedValue).toBe(100000)
    expect(["low", "medium", "high"]).toContain(analysis.competitionLevel)
  })

  it("should handle chat messages", async () => {
    const messages = [
      {
        role: "user" as const,
        content: "Como funciona o pregão eletrônico?",
        timestamp: new Date(),
      },
    ]

    const response = await licitationAssistant.chatWithAssistant(messages)

    expect(response).toBeTruthy()
    expect(typeof response).toBe("string")
  })

  it("should generate document summary", async () => {
    const documentText = `
      EDITAL DE PREGÃO ELETRÔNICO Nº 001/2024
      
      OBJETO: Aquisição de equipamentos de informática
      
      CRITÉRIO DE JULGAMENTO: Menor preço por item
      
      PRAZO DE ENTREGA: 30 dias
    `

    const summary = await licitationAssistant.generateDocumentSummary(documentText)

    expect(summary).toBeTruthy()
    expect(typeof summary).toBe("string")
  })

  it("should handle errors gracefully", async () => {
    // Mock OpenAI to throw an error
    const mockOpenAI = await import("openai")
    vi.mocked(mockOpenAI.default).mockImplementationOnce(() => {
      throw new Error("API Error")
    })

    await expect(licitationAssistant.chatWithAssistant([])).rejects.toThrow("Falha na comunicação com o assistente")
  })
})

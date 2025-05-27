import { describe, it, expect, beforeEach, vi } from "vitest"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { detectDocumentType, validateCPF, validateCNPJ } from "@/lib/utils/document-utils"

// Mock do Supabase
vi.mock("@supabase/auth-helpers-nextjs", () => ({
  createClientComponentClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    auth: {
      signInWithPassword: vi.fn(),
    },
  })),
}))

describe("Document Authentication Utils", () => {
  describe("detectDocumentType", () => {
    it("should detect email correctly", () => {
      expect(detectDocumentType("user@example.com")).toBe("email")
      expect(detectDocumentType("test.email+tag@domain.co.uk")).toBe("email")
    })

    it("should detect CPF correctly", () => {
      expect(detectDocumentType("123.456.789-09")).toBe("cpf")
      expect(detectDocumentType("12345678909")).toBe("cpf")
    })

    it("should detect CNPJ correctly", () => {
      expect(detectDocumentType("11.222.333/0001-81")).toBe("cnpj")
      expect(detectDocumentType("11222333000181")).toBe("cnpj")
    })

    it("should detect invalid input", () => {
      expect(detectDocumentType("123")).toBe("invalid")
      expect(detectDocumentType("invalid-input")).toBe("invalid")
    })
  })

  describe("validateCPF", () => {
    it("should validate correct CPF", () => {
      expect(validateCPF("123.456.789-09")).toBe(true)
      expect(validateCPF("12345678909")).toBe(true)
    })

    it("should reject invalid CPF", () => {
      expect(validateCPF("123.456.789-00")).toBe(false)
      expect(validateCPF("111.111.111-11")).toBe(false)
      expect(validateCPF("123")).toBe(false)
    })
  })

  describe("validateCNPJ", () => {
    it("should validate correct CNPJ", () => {
      expect(validateCNPJ("11.222.333/0001-81")).toBe(true)
      expect(validateCNPJ("11222333000181")).toBe(true)
    })

    it("should reject invalid CNPJ", () => {
      expect(validateCNPJ("11.222.333/0001-00")).toBe(false)
      expect(validateCNPJ("11.111.111/1111-11")).toBe(false)
      expect(validateCNPJ("123")).toBe(false)
    })
  })
})

describe("Document Login Flow", () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createClientComponentClient()
  })

  it("should find email by CPF", async () => {
    const mockProfile = { email: "user@example.com" }
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    // Simular busca por CPF
    const result = await mockSupabase.from("profiles").select("email").eq("cpf", "12345678909").single()

    expect(result.data).toEqual(mockProfile)
  })

  it("should find email by CNPJ", async () => {
    const mockProfile = { email: "company@example.com" }
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    // Simular busca por CNPJ
    const result = await mockSupabase.from("profiles").select("email").eq("cnpj", "11222333000181").single()

    expect(result.data).toEqual(mockProfile)
  })

  it("should handle document not found", async () => {
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: null,
        error: { message: "No rows returned" },
      })

    const result = await mockSupabase.from("profiles").select("email").eq("cpf", "99999999999").single()

    expect(result.error).toBeTruthy()
  })
})

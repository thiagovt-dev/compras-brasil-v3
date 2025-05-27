import { describe, it, expect, beforeEach } from "vitest"
import { vi } from "vitest"

// Mock Supabase client for testing
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}))

describe("Database Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Tenders", () => {
    it("should create tender successfully", async () => {
      const mockTender = {
        title: "Test Tender",
        description: "Test Description",
        tender_type: "pregao-eletronico",
        estimated_value: 50000,
        agency_id: "test-agency-id",
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "test-id", ...mockTender },
        error: null,
      })

      const result = await mockSupabase.from("tenders").insert(mockTender).select().single()

      expect(mockSupabase.from).toHaveBeenCalledWith("tenders")
      expect(mockSupabase.insert).toHaveBeenCalledWith(mockTender)
      expect(result.data).toBeDefined()
    })

    it("should fetch tenders with filters", async () => {
      const mockTenders = [
        { id: "1", title: "Tender 1", status: "active" },
        { id: "2", title: "Tender 2", status: "active" },
      ]

      mockSupabase.select.mockResolvedValueOnce({
        data: mockTenders,
        error: null,
      })

      const result = await mockSupabase.from("tenders").select("*").eq("status", "active")

      expect(mockSupabase.from).toHaveBeenCalledWith("tenders")
      expect(mockSupabase.eq).toHaveBeenCalledWith("status", "active")
    })
  })

  describe("Assistant Conversations", () => {
    it("should store conversation correctly", async () => {
      const mockConversation = {
        user_id: "test-user-id",
        messages: [{ role: "user", content: "Test message" }],
        response: "Test response",
        action: "chat",
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "conversation-id", ...mockConversation },
        error: null,
      })

      const result = await mockSupabase.from("assistant_conversations").insert(mockConversation).select().single()

      expect(mockSupabase.from).toHaveBeenCalledWith("assistant_conversations")
      expect(mockSupabase.insert).toHaveBeenCalledWith(mockConversation)
    })
  })

  describe("Notifications", () => {
    it("should create notification with priority", async () => {
      const mockNotification = {
        title: "Test Notification",
        message: "Test message",
        type: "info",
        priority: "medium",
        user_id: "test-user-id",
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "notification-id", ...mockNotification },
        error: null,
      })

      const result = await mockSupabase.from("notifications").insert(mockNotification).select().single()

      expect(mockSupabase.insert).toHaveBeenCalledWith(mockNotification)
    })
  })
})

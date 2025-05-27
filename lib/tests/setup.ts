import type React from "react"
import { expect, afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import * as matchers from "@testing-library/jest-dom/matchers"

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables
vi.mock("process", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    OPENAI_API_KEY: "test-openai-key",
  },
}))

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/test-path",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase auth
vi.mock("@/lib/supabase/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "test-user-id",
      email: "test@example.com",
    },
    profile: {
      id: "test-user-id",
      name: "Test User",
      profile_type: "supplier",
    },
    loading: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

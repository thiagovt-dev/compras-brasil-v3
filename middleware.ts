import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip middleware for static files and API routes
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.includes(".")
  ) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register"
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")

    // Redirect authenticated users away from auth pages
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard/supplier", req.url))
    }

    // Redirect unauthenticated users to login
    if (!session && isDashboardPage) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Redirect base dashboard to supplier dashboard
    if (session && req.nextUrl.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard/supplier", req.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    return res
  }
}

export const config = {
  matcher: [],
}

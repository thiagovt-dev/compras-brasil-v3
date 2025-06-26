import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Temporarily disabled to prevent conflicts with client-side auth routing
  // All auth logic is handled by AuthProvider and AuthGuard
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

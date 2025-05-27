import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { userId, userData } = await request.json()

  if (!userId || !userData) {
    return new NextResponse("Missing user ID or user data", { status: 400 })
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: userData.email, // Adicionar esta linha
        name: userData.name,
        profile_type: userData.profile_type,
        cpf: userData.cpf || null,
        cnpj: userData.cnpj || null,
        phone: userData.phone || null,
        address: userData.address || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error("Error creating profile:", profileError)
      return new NextResponse("Failed to create profile", { status: 500 })
    }

    return NextResponse.json({ message: "Profile created successfully", data: profile }, { status: 201 })
  } catch (error) {
    console.error("Error during profile creation:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

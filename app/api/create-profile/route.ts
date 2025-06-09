import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  console.log("🔄 Creating profile...")
  
  try {
    const body = await request.json()
    const { userId, userData } = body

    console.log("📝 Dados recebidos:", { userId, userData })

    if (!userId || !userData) {
      console.error("❌ Missing user ID or user data")
      return NextResponse.json(
        { success: false, error: "Missing user ID or user data" }, 
        { status: 400 }
      )
    }

    // Usar service role key para criar o profile
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Precisa dessa chave
    )

    console.log("📊 Inserindo profile...")

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: userData.email,
        name: userData.name,
        profile_type: userData.profile_type,
        cpf: userData.cpf || null,
        cnpj: userData.cnpj || null,
        phone: userData.phone || null,
        address: userData.address || null,
        agency_id: userData.agency_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error("❌ Error creating profile:", profileError)
      return NextResponse.json(
        { success: false, error: `Failed to create profile: ${profileError.message}` }, 
        { status: 500 }
      )
    }

    console.log("✅ Profile created successfully:", profile)

    return NextResponse.json(
      { success: true, message: "Profile created successfully", data: profile }, 
      { status: 201 }
    )

  } catch (error: any) {
    console.error("💥 Error during profile creation:", error)
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error.message}` }, 
      { status: 500 }
    )
  }
}
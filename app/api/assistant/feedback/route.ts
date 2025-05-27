import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createServerClient()

  // Verificar autenticação
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { messageId, query, response, rating, comment } = await req.json()

  // Registrar feedback no banco de dados
  const { data, error } = await supabase.from("assistant_feedback").insert({
    user_id: session.user.id,
    message_id: messageId,
    query,
    response,
    rating,
    comment,
  })

  if (error) {
    console.error("Error saving feedback:", error)
    return new Response(JSON.stringify({ error: "Failed to save feedback" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

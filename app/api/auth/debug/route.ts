import { createServerClientWithAuth } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClientWithAuth();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    return Response.json({
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      error: sessionError?.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

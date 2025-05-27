export const supabaseConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "supabase.auth.token",
    cookieOptions: {
      name: "sb-auth-token",
      lifetime: 60 * 60 * 24 * 7, // 7 dias
      domain: process.env.NODE_ENV === "production" ? "seu-dominio.com" : "",
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
};

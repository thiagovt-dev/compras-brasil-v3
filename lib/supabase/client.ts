import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// ✅ CORREÇÃO: Configurar para salvar em cookies também
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          const localValue = localStorage.getItem(key);
          if (localValue) return localValue;
          
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === key) {
              return decodeURIComponent(value);
            }
          }
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
          
          try {
            const parsed = JSON.parse(value);
            const expires = parsed.expires_at 
              ? new Date(parsed.expires_at * 1000).toUTCString()
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString(); // 7 dias
            
            document.cookie = `${key}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
          } catch (error) {
            console.error('Erro ao salvar cookie:', error);
          }
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      }
    }
  }
});

export function createClientSupabaseClient() {
  return supabase
}
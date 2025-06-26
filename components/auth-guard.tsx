"use client";

import type React from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading, user } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasChecked(true);
      if (!session || !user) {
        console.log("No session/user in AuthGuard, redirecting to login");
        router.push("/login");
      }
    }
  }, [session, isLoading, router, user]);

  // Se ainda está carregando ou não checou ainda, mostrar loading
  if (isLoading || !hasChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não tem sessão após carregar, não renderizar nada (redirecionamento em andamento)
  if (!session || !user) {
    return null;
  }

  return <>{children}</>;
}

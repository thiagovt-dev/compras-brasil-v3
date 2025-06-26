"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, isLoading, user, session } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Se ainda está carregando ou já redirecionou, não fazer nada
    if (isLoading || hasRedirected) return;

    // Se não tem usuário logado, redirecionar para login
    if (!user || !session) {
      console.log("No user/session, redirecting to login");
      router.replace("/login");
      return;
    }

    // Se tem usuário mas não tem profile ainda, aguardar um pouco mais
    if (!profile) {
      console.log("User exists but no profile yet, waiting...");
      return;
    }

    console.log("Redirecting based on profile:", profile.profile_type);

    const dashboardRoutes = {
      citizen: "/dashboard/citizen",
      supplier: "/dashboard/supplier",
      agency: "/dashboard/agency",
      admin: "/dashboard/admin",
      support: "/dashboard/support",
      registration: "/dashboard/registration",
    };

    // Determinar rota baseado em agency_id/supplier_id primeiro, depois profile_type
    let route = "/dashboard/citizen";

    if (profile.agency_id) {
      route = "/dashboard/agency";
    } else if (profile.supplier_id) {
      route = "/dashboard/supplier";
    } else {
      route =
        dashboardRoutes[profile.profile_type as keyof typeof dashboardRoutes] ||
        "/dashboard/citizen";
    }

    setHasRedirected(true);
    router.replace(route);
  }, [profile, isLoading, router, user, session, hasRedirected]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">
          {!user || !session
            ? "Verificando autenticação..."
            : !profile
            ? "Carregando perfil do usuário..."
            : "Redirecionando para seu dashboard..."}
        </p>
      </div>
    </div>
  );
}

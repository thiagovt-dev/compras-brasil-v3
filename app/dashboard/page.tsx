"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchAgencyById } from "@/lib/actions/agencyAction";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, isLoading, user, session } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      if (isLoading || hasRedirected) return;

      if (!user || !session) {
        console.log("No user/session, redirecting to login");
        router.replace("/login");
        return;
      }

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

      const agency = await fetchAgencyById(profile.agency_id);
      let route = "/dashboard/citizen";

      if (profile?.agency_id && agency.data.status === "active") {
        route = "/dashboard/agency";
      } else if (profile.supplier_id && profile.profile_type === "supplier") {
        route = "/dashboard/supplier";
      } else {
        route = "/dashboard/citizen";
      }

      setHasRedirected(true);
      router.replace(route);
    };

    handleRedirect();
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

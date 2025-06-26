"use client";

import { useAuth } from "@/lib/supabase/auth-context";
import { useEffect } from "react";

export function useAuthDebug() {
  const authState = useAuth();

  useEffect(() => {
    console.log("🔍 Auth Debug State:", {
      isLoading: authState.isLoading,
      hasUser: !!authState.user,
      hasSession: !!authState.session,
      hasProfile: !!authState.profile,
      profileType: authState.profile?.profile_type,
      agencyId: authState.profile?.agency_id,
      supplierId: authState.profile?.supplier_id,
      timestamp: new Date().toISOString(),
    });
  }, [authState]);

  return authState;
}

"use client";

import type React from "react";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { UserNav } from "@/components/user-nav";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/supabase/auth-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isLoading } = useAuth();

  // Se ainda está carregando o perfil, mostrar loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Determine user role based on agency_id/supplier_id first, then profile_type
  const getUserRole = () => {
    if (profile?.agency_id && profile?.profile_type === "agency") return "agency";
    if (profile?.supplier_id && profile?.profile_type === "supplier") return "supplier";
    return profile?.profile_type || "citizen";
  };
  const userRole = getUserRole();

  const userData = {
    name: profile?.name || "Usuário",
    email: profile?.email || "",
    role: getUserRoleLabel(profile?.profile_type),
    image: "",
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <DashboardSidebar userRole={userRole} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 py-8">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto px-8">
              <UserNav user={userData} notificationCount={0} onLogout={handleLogout} />
            </div>
          </header>
          <main className="flex-1 space-y-4 p-8 pt-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

function getUserRoleLabel(profileType?: string): string {
  switch (profileType) {
    case "citizen":
      return "Cidadão";
    case "supplier":
      return "Fornecedor";
    case "agency":
      return "Órgão Público";
    case "admin":
      return "Administrador";
    case "support":
      return "Suporte";
    case "registration":
      return "Cadastro";
    case "agency_support":
      return "Suporte do Órgão";
    default:
      return "Usuário";
  }
}

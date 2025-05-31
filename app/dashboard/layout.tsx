"use client"

import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { UserNav } from "@/components/user-nav"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/supabase/auth-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, signOut } = useAuth()

  const userData = {
    name: profile?.name || "Usuário",
    email: profile?.email || "",
    role: getUserRoleLabel(profile?.profile_type),
    image: "",
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/login"
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <DashboardSidebar userRole={profile?.profile_type || "citizen"} />
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
  )
}

function getUserRoleLabel(profileType?: string): string {
  switch (profileType) {
    case "citizen":
      return "Cidadão"
    case "supplier":
      return "Fornecedor"
    case "agency":
      return "Órgão Público"
    case "admin":
      return "Administrador"
    case "support":
      return "Suporte"
    case "registration":
      return "Cadastro"
    default:
      return "Usuário"
  }
}

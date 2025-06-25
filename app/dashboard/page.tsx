"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/supabase/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { profile, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && profile) {
      const dashboardRoutes = {
        citizen: "/dashboard/citizen",
        supplier: "/dashboard/supplier",
        agency: "/dashboard/agency",
        admin: "/dashboard/admin",
        support: "/dashboard/support",
        registration: "/dashboard/registration",
      }

      const route = dashboardRoutes[profile.profile_type as keyof typeof dashboardRoutes] || "/dashboard/citizen"
      router.replace(route)
    }
  }, [profile, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Carregando seu dashboard..</p>
      </div>
    </div>
  )
}

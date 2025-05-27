"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Settings, BarChart2, Calendar, Bell } from "lucide-react"

interface BrasilIntegrationClientProps {
  children: React.ReactNode
}

export default function BrasilIntegrationClient({ children }: BrasilIntegrationClientProps) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(getActiveTab(pathname))

  function getActiveTab(path: string) {
    if (path.includes("/dashboard/integrations/brasil/dashboard")) return "dashboard"
    if (path.includes("/dashboard/integrations/brasil/config")) return "config"
    if (path.includes("/dashboard/integrations/brasil/schedule")) return "schedule"
    if (path.includes("/dashboard/integrations/brasil/notifications")) return "notifications"
    return "overview"
  }

  return (
    <div className="space-y-6">
      <div className="border-b">
        <div className="container flex h-16 items-center px-4">
          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" asChild>
                <Link
                  href="/dashboard/integrations/brasil"
                  className={cn(
                    "flex items-center justify-center gap-2",
                    activeTab === "overview" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">Visão Geral</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="dashboard" asChild>
                <Link
                  href="/dashboard/integrations/brasil/dashboard"
                  className={cn(
                    "flex items-center justify-center gap-2",
                    activeTab === "dashboard" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="schedule" asChild>
                <Link
                  href="/dashboard/integrations/brasil/schedule"
                  className={cn(
                    "flex items-center justify-center gap-2",
                    activeTab === "schedule" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Agendamento</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="notifications" asChild>
                <Link
                  href="/dashboard/integrations/brasil/notifications"
                  className={cn(
                    "flex items-center justify-center gap-2",
                    activeTab === "notifications" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notificações</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="config" asChild>
                <Link
                  href="/dashboard/integrations/brasil/config"
                  className={cn(
                    "flex items-center justify-center gap-2",
                    activeTab === "config" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Configurações</span>
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="container px-4">{children}</div>
    </div>
  )
}

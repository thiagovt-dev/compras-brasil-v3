"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  Search,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  Bell,
  Clock,
  Activity,
  Bot,
  Globe,
  Shield,
  PenTool,
  User,
  Building2,
  FileCheck,
  Award,
  HelpCircle,
  Ticket,
} from "lucide-react"
import { Logo } from "@/components/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

interface SidebarNavProps {
  userRole?: string
}

export function DashboardSidebar({ userRole = "citizen" }: SidebarNavProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="py-6 px-4 border-b border-gray-100">
        <div className="flex items-center">
          <Link href={`/dashboard/${userRole}`} className="flex items-center space-x-2">
            <Logo disableLink />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup className="py-6">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(`/dashboard/${userRole}`)}
                  className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                >
                  <Link href={`/dashboard/${userRole}`}>
                    <Home className="h-6 w-6" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Citizen Navigation */}
              {userRole === "citizen" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/citizen/search")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/citizen/search">
                        <Search className="h-6 w-6" />
                        <span className="font-medium">Buscar Licitações</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {/* Supplier Navigation */}
              {userRole === "supplier" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/supplier/tenders")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/supplier/tenders">
                        <Search className="h-6 w-6" />
                        <span className="font-medium">Buscar Licitações</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/supplier/my-tenders")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/supplier/my-tenders">
                        <Clock className="h-6 w-6" />
                        <span className="font-medium">Minhas Licitações</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/supplier/proposals")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/supplier/proposals">
                        <FileText className="h-6 w-6" />
                        <span className="font-medium">Minhas Propostas</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/supplier/calendar")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/supplier/calendar">
                        <Calendar className="h-6 w-6" />
                        <span className="font-medium">Agenda</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {/* Agency Navigation */}
              {userRole === "agency" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/agency/create-tender")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/agency/create-tender">
                        <FileText className="h-6 w-6" />
                        <span className="font-medium">Criar Licitação</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/agency/active-tenders")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/agency/active-tenders">
                        <Clock className="h-6 w-6" />
                        <span className="font-medium">Em Andamento</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/agency/statistics")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/agency/statistics">
                        <BarChart3 className="h-6 w-6" />
                        <span className="font-medium">Estatísticas</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {/* Admin Navigation */}
              {userRole === "admin" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/admin/analytics")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/admin/analytics">
                        <BarChart3 className="h-6 w-6" />
                        <span className="font-medium">Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/admin/manage-users")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/admin/manage-users">
                        <Users className="h-6 w-6" />
                        <span className="font-medium">Usuários</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/admin/monitoring")}
                      className="h-12 px-4 rounded-lg hover:bg-blue-50 hover:text-blue-700 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/admin/monitoring">
                        <Activity className="h-6 w-6" />
                        <span className="font-medium">Monitoramento</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* Registration Section - Only for Citizens */}
        {userRole === "citizen" && (
          <>
            <SidebarGroup className="py-6">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Cadastros
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/citizen/register-supplier")}
                      className="h-12 px-4 rounded-lg hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/citizen/register-supplier">
                        <ShoppingBag className="h-6 w-6" />
                        <span className="font-medium">Cadastrar Fornecedor</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/citizen/register-agency")}
                      className="h-12 px-4 rounded-lg hover:bg-green-50 hover:text-green-700 data-[active=true]:bg-green-100 data-[active=true]:text-green-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/citizen/register-agency">
                        <Building2 className="h-6 w-6" />
                        <span className="font-medium">Cadastrar Órgão</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="my-2" />
          </>
        )}

        {/* Financial Section - Only for Suppliers */}
        {userRole === "supplier" && (
          <>
            <SidebarGroup className="py-6">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Financeiro
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/supplier/financial")}
                      className="h-12 px-4 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/supplier/financial">
                        <Wallet className="h-6 w-6" />
                        <span className="font-medium">Posição Financeira</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/supplier/me-epp")}
                      className="h-12 px-4 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/supplier/me-epp">
                        <Award className="h-6 w-6" />
                        <span className="font-medium">ME/EPP</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/supplier/documents")}
                      className="h-12 px-4 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/supplier/documents">
                        <FileCheck className="h-6 w-6" />
                        <span className="font-medium">Documentos</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="my-2" />
          </>
        )}

        {/* Tools Section */}
        <SidebarGroup className="py-6">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Ferramentas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/assistant")}
                  className="h-12 px-4 rounded-lg hover:bg-purple-50 hover:text-purple-700 data-[active=true]:bg-purple-100 data-[active=true]:text-purple-700 data-[active=true]:font-medium gap-3"
                >
                  <Link href="/dashboard/assistant">
                    <Bot className="h-6 w-6" />
                    <span className="font-medium">Assistente IA</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/notifications")}
                  className="h-12 px-4 rounded-lg hover:bg-purple-50 hover:text-purple-700 data-[active=true]:bg-purple-100 data-[active=true]:text-purple-700 data-[active=true]:font-medium gap-3"
                >
                  <Link href="/dashboard/notifications">
                    <Bell className="h-6 w-6" />
                    <span className="font-medium">Notificações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/certificates")}
                  className="h-12 px-4 rounded-lg hover:bg-purple-50 hover:text-purple-700 data-[active=true]:bg-purple-100 data-[active=true]:text-purple-700 data-[active=true]:font-medium gap-3"
                >
                  <Link href="/dashboard/certificates">
                    <Shield className="h-6 w-6" />
                    <span className="font-medium">Certificados Digitais</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/sign-document")}
                  className="h-12 px-4 rounded-lg hover:bg-purple-50 hover:text-purple-700 data-[active=true]:bg-purple-100 data-[active=true]:text-purple-700 data-[active=true]:font-medium gap-3"
                >
                  <Link href="/dashboard/sign-document">
                    <PenTool className="h-6 w-6" />
                    <span className="font-medium">Assinar Documentos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/integrations/brasil")}
                  className="h-12 px-4 rounded-lg hover:bg-purple-50 hover:text-purple-700 data-[active=true]:bg-purple-100 data-[active=true]:text-purple-700 data-[active=true]:font-medium gap-3"
                >
                  <Link href="/dashboard/integrations/brasil">
                    <Globe className="h-6 w-6" />
                    <span className="font-medium">Integração +Brasil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* Support Section */}
        {(userRole === "support" || userRole === "admin") && (
          <>
            <SidebarGroup className="py-6">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Suporte
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/support/manage")}
                      className="h-12 px-4 rounded-lg hover:bg-orange-50 hover:text-orange-700 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/support/manage">
                        <HelpCircle className="h-6 w-6" />
                        <span className="font-medium">Gerenciar Chamados</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/support/tickets")}
                      className="h-12 px-4 rounded-lg hover:bg-orange-50 hover:text-orange-700 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-700 data-[active=true]:font-medium gap-3"
                    >
                      <Link href="/dashboard/support/tickets">
                        <Ticket className="h-6 w-6" />
                        <span className="font-medium">Tickets</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="my-2" />
          </>
        )}

        {/* Settings Section */}
        <SidebarGroup className="py-6">
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/profile")}
                  className="h-12 px-4 rounded-lg hover:bg-gray-50 hover:text-gray-700 data-[active=true]:bg-gray-100 data-[active=true]:text-gray-700 data-[active=true]:font-medium gap-3"
                >
                  <Link href="/dashboard/profile">
                    <User className="h-6 w-6" />
                    <span className="font-medium">Perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/settings")}
                  className="h-12 px-4 rounded-lg hover:bg-gray-50 hover:text-gray-700 data-[active=true]:bg-gray-100 data-[active=true]:text-gray-700 data-[active=true]:font-medium gap-3"
                >
                  <Link href="/dashboard/settings">
                    <Settings className="h-6 w-6" />
                    <span className="font-medium">Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="py-4 px-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">© 2023 Central de Compras Brasil</div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

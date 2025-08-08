"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Building2 } from "lucide-react";
import Fuse from "fuse.js";

interface Agency {
  id: string;
  name: string;
  cnpj?: string;
  agency_type?: string;
  sphere?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const statusLabels: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  blocked: "Bloqueado",
  inactive: "Inativo",
};

const sphereLabels: Record<string, string> = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  distrital: "Distrital",
};

const agencyTypeLabels: Record<string, string> = {
  ministerio: "Ministério",
  secretaria: "Secretaria",
  autarquia: "Autarquia",
  fundacao: "Fundação",
  empresa_publica: "Empresa Pública",
  sociedade_economia_mista: "Sociedade de Economia Mista",
  agencia_reguladora: "Agência Reguladora",
  tribunal: "Tribunal",
  prefeitura: "Prefeitura",
  camara_municipal: "Câmara Municipal",
  assembleia_legislativa: "Assembleia Legislativa",
  outro: "Outro",
};

function getBadgeVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "pending":
      return "secondary";
    case "blocked":
      return "destructive";
    case "inactive":
      return "outline";
    default:
      return "outline";
  }
}

export function AgencyTable({ agencies }: { agencies: Agency[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const fuse = useMemo(
    () =>
      new Fuse(agencies, {
        keys: ["name", "cnpj", "email", "sphere", "agency_type"],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [agencies]
  );

  const searchFilteredAgencies = useMemo(() => {
    if (!searchTerm.trim()) return agencies;
    return fuse.search(searchTerm).map((result) => result.item);
  }, [fuse, agencies, searchTerm]);

  const getFilteredAgencies = (tab: string) => {
    if (tab === "all") return searchFilteredAgencies;
    return searchFilteredAgencies.filter((agency) => (agency.status || "pending") === tab);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, CNPJ, e-mail ou esfera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/dashboard/admin/agency/register-agency">
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <Building2 className="mr-2 h-4 w-4" />
            Cadastrar Órgão
          </button>
        </Link>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={(value) => setSelectedTab(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="blocked">Bloqueados</TabsTrigger>
          <TabsTrigger value="inactive">Inativos</TabsTrigger>
        </TabsList>

        {["all", "active", "pending", "blocked", "inactive"].map((tab) => {
          const filteredAgencies = getFilteredAgencies(tab);

          return (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Órgãos Públicos</CardTitle>
                  <CardDescription>
                    {filteredAgencies.length} órgão{filteredAgencies.length !== 1 ? "s" : ""} encontrado
                    {filteredAgencies.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-sm font-medium">
                      <div className="col-span-3">Nome</div>
                      <div className="col-span-2">CNPJ</div>
                      <div className="col-span-2">Tipo</div>
                      <div className="col-span-1">Esfera</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2 text-right">Ações</div>
                    </div>
                    <div className="divide-y">
                      {filteredAgencies.length > 0 ? (
                        filteredAgencies.map((agency) => (
                          <div
                            key={agency.id}
                            className="grid grid-cols-12 items-center px-4 py-3 hover:bg-gray-50/50"
                          >
                            <div className="col-span-3">
                              <div className="font-medium">{agency.name}</div>
                              {agency.email && (
                                <div className="text-sm text-muted-foreground">{agency.email}</div>
                              )}
                            </div>
                            <div className="col-span-2 text-sm">
                              {agency.cnpj ? (
                                // Formatar CNPJ
                                agency.cnpj.replace(
                                  /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                  "$1.$2.$3/$4-$5"
                                )
                              ) : (
                                "-"
                              )}
                            </div>
                            <div className="col-span-2 text-sm">
                              {agencyTypeLabels[agency.agency_type || ""] || agency.agency_type || "-"}
                            </div>
                            <div className="col-span-1 text-sm">
                              {sphereLabels[agency.sphere || ""] || agency.sphere || "-"}
                            </div>
                            <div className="col-span-2">
                              <Badge variant={getBadgeVariant(agency.status)}>
                                {statusLabels[agency.status || "pending"] || agency.status || "Pendente"}
                              </Badge>
                            </div>
                            <div className="col-span-2 text-right">
                              <Link
                                href={`/dashboard/admin/agencies/${agency.id}`}
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Ver detalhes
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum órgão encontrado
                          </h3>
                          <p>Nenhum órgão foi encontrado com os filtros selecionados.</p>
                          {tab === "all" && searchTerm === "" && (
                            <Link href="/dashboard/admin/agency/register-agency">
                              <button className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                <Building2 className="mr-2 h-4 w-4" />
                                Cadastrar primeiro órgão
                              </button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
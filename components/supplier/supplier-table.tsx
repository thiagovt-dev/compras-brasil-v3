"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";
import Fuse from "fuse.js";


const statusLabels: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  blocked: "Bloqueado",
};

export function SupplierTable({ suppliers }: { suppliers: Supplier[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const fuse = useMemo(
    () =>
      new Fuse(suppliers, {
        keys: ["name", "cnpj"],
        threshold: 0.3, 
        ignoreLocation: true,
      }),
    [suppliers]
  );
  const searchFilteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    return fuse.search(searchTerm).map((result) => result.item);
  }, [fuse, suppliers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={(value) => setSelectedTab(value)}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="blocked">Bloqueados</TabsTrigger>
        </TabsList>
        {["all", "active", "pending", "blocked"].map((tab) => {
          const filteredSuppliers =
            tab === "all"
              ? searchFilteredSuppliers
              : searchFilteredSuppliers.filter(
                  (supplier) => (supplier.status || "pending") === tab
                );

          return (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Fornecedores</CardTitle>
                  <CardDescription>
                    {filteredSuppliers.length} fornecedor
                    {filteredSuppliers.length !== 1 ? "es" : ""} encontrado
                    {filteredSuppliers.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 border-b bg-gray-50 px-4 py-3 text-[1rem] font-medium">
                      <div className="col-span-4">Nome</div>
                      <div className="col-span-3">CNPJ</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-3 text-right">Ações</div>
                    </div>
                    <div className="divide-y">
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((supplier) => (
                          <div
                            key={supplier.id}
                            className="grid grid-cols-12 items-center px-4 py-3">
                            <div className="col-span-4 font-medium">{supplier.name}</div>
                            <div className="col-span-3 text-[1rem]">{supplier.cnpj || "-"}</div>
                            <div className="col-span-2">
                              <Badge variant="default">
                                {statusLabels[supplier.status || "pending"] ||
                                  supplier.status ||
                                  "-"}
                              </Badge>
                            </div>
                            <div className="col-span-3 text-right">
                              <Link
                                href={`/dashboard/admin/suppliers/${supplier.id}`}
                                className="text-blue-600 hover:underline">
                                Ver detalhes
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          Nenhum fornecedor encontrado com os filtros selecionados.
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
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, FileText, Building, RefreshCw } from "lucide-react";
import Link from "next/link";

// Mock data for tenders
const tenders = [
  {
    id: "1",
    title: "Prefeitura Municipal do Jaboatão dos Guararapes - Unidade Única",
    description:
      "TERMO DE RATIFICAÇÃO RECONHEÇO E RATIFICO, em todos os seus termos, o PROCESSO ADMINISTRATIVO nº. 085.2025.INEX.052.EPC-SME. OBJETO: Aquisição, através de Inexigibilidade de Licitação, de 10 (dez)...",
    number: "ID 60743 | 085/2025",
    date: "052/2025",
    type: "Inexigibilidade",
    status: "Contrato",
    statusColor: "blue",
    agency: "Prefeitura Municipal do Jaboatão dos Guararapes",
    category: "Aquisição de bens",
  },
  {
    id: "2",
    title: "Instituto de Previdência dos Servidores Públicos Municipais de Paraopeba",
    description:
      "Contratação direta por inexigibilidade de pessoa jurídica especializada na prestação de serviços relacionados à gestão dos recursos financeiros e elaboração de estudos de ALM do RPPS do município de Paraopeba, MG.",
    number: "ID 53962 | 002 | 13/12/2025 (em 6 meses)",
    date: "002",
    type: "Inexigibilidade",
    status: "Contrato",
    statusColor: "blue",
    agency: "Instituto de Previdência dos Servidores Públicos",
    category: "Serviços comuns",
  },
  {
    id: "3",
    title: "PREFEITURA MUNICIPAL DE CHAPADA GAÚCHA - Unidade Única",
    description:
      "REGISTRO DE PREÇOS PARA FUTURA E EVENTUAL CONTRATAÇÃO DE EMPRESA PARA O FORNECIMENTO DE MATERIAL DE INFORMÁTICA, SUPRIMENTOS DE INFORMÁTICA, IMPRESSORAS E COMPUTADORES E...",
    number: "ID 66498 | 071/2025 | 02/07/2025 (em 16 dias)",
    date: "0016/2025",
    type: "Pregão",
    status: "Recebendo propostas",
    statusColor: "green",
    agency: "Prefeitura Municipal de Chapada Gaúcha",
    category: "Aquisição de bens",
  },
  {
    id: "4",
    title: "PREFEITURA MUNICIPAL DE CHAPADA GAÚCHA - Unidade Única",
    description:
      "REGISTRO DE PREÇO PARA FUTURA E EVENTUAL CONTRATAÇÃO DE EMPRESA PARA AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS/ PRODUTOS DE PADARIA, PARA ALIMENTAÇÃO DOS ESTUDANTES DAS ESCOLA...",
    number: "ID 66491 | 0069/2025 | 01/07/2025 (em 15 dias)",
    date: "0015/2025",
    type: "Pregão",
    status: "Recebendo propostas",
    statusColor: "green",
    agency: "Prefeitura Municipal de Chapada Gaúcha",
    category: "Aquisição de bens",
  },
  {
    id: "5",
    title: "Prefeitura Municipal de Campo Azul - Unidade Única",
    description:
      "REGISTRO DE PREÇOS PARA FUTURA E EVENTUAL AQUISIÇÃO DE LEITES ESPECIAIS E SUPLEMENTOS ALIMENTARES DIVERSOS,DESTINADOS AO ATENDIMENTO DE PACIENTES COM NECESSIDADES...",
    number: "ID 66835 | 16/2025 | 30/06/2025 (em 14 dias)",
    date: "12/2025",
    type: "Pregão",
    status: "Recebendo propostas",
    statusColor: "green",
    agency: "Prefeitura Municipal de Campo Azul",
    category: "Aquisição de bens",
  },
];

const quickFilters = [
  { id: "suspended", label: "Apenas suspensos", count: 13, color: "orange" },
  { id: "proposals", label: "Apenas propostas", count: 40, color: "blue" },
  { id: "favorites", label: "Apenas favoritos", count: 0, color: "blue" },
];

const tenderTypes = [
  "Todos",
  "Pregão",
  "Leilão",
  "Dispensa",
  "Credenciamento",
  "Marketplace",
  "Concorrência",
  "Inexigibilidade",
  "Diálogo Competitivo",
  "Concurso",
  "Concorrência Presencial",
  "Pregão Presencial",
  "Manifestação de Interesse",
  "Pré-Qualificação",
  "Leilão Presencial",
  "Inaplicabilidade da Licitação",
];

const tenderStages = ["Todos", "Disputa", "Decisão", "Contrato", "Recebendo propostas"];

const supplyLines = [
  "Todas",
  "Agrícola",
  "Álcool",
  "Ambiente",
  "Análise, Avaliação e Revisão de Recolhimentos",
  "Ar Condicionado",
  "Ar e Ventilação",
  "Artes Cênicas",
  "Artesanato",
  "Artigos de Iluminação",
];

const states = [
  "Todos",
  "Acre",
  "Alagoas",
  "Amapá",
  "Amazonas",
  "Bahia",
  "Ceará",
  "Distrito Federal",
  "Espírito Santo",
  "Goiás",
  "Maranhão",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Minas Gerais",
  "Pará",
  "Paraíba",
  "Paraná",
  "Pernambuco",
  "Piauí",
  "Rio de Janeiro",
  "Rio Grande do Norte",
  "Rio Grande do Sul",
  "Rondônia",
  "Roraima",
  "Santa Catarina",
  "São Paulo",
  "Sergipe",
  "Tocantins",
];

export default function TenderSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("Todos");
  const [selectedType, setSelectedType] = useState("Todos");
  const [selectedStage, setSelectedStage] = useState("Todos");
  const [selectedSupplyLine, setSelectedSupplyLine] = useState("Todas");

  const toggleQuickFilter = (filterId: string) => {
    setActiveQuickFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setActiveQuickFilters([]);
    setSelectedState("Todos");
    setSelectedType("Todos");
    setSelectedStage("Todos");
    setSelectedSupplyLine("Todas");
    setSearchTerm("");
  };

  const getStatusBadge = (status: string, color: string) => {
    const colorClasses = {
      blue: "bg-blue-600 text-white",
      green: "bg-green-600 text-white",
      orange: "bg-orange-600 text-white",
      red: "bg-red-600 text-white",
    };

    return (
      <Badge className={`${colorClasses[color as keyof typeof colorClasses]} px-3 py-1`}>
        {status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Pregão":
        return "⚖️";
      case "Inexigibilidade":
        return "📋";
      case "Dispensa":
        return "📄";
      default:
        return "📋";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Pesquisa</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              21
            </span>
            <Building className="h-4 w-4" />
            <span>CARLETTO GESTÃO DE SERVI...</span>
            <span className="text-gray-400">Fornecedor</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r min-h-screen p-6">
          <div className="space-y-6">
            {/* Advanced Filters Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Filtros avançados</h2>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="space-y-3">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeQuickFilters.includes(filter.id) ? "default" : "outline"}
                  className={`w-full justify-start gap-2 ${
                    filter.color === "orange"
                      ? activeQuickFilters.includes(filter.id)
                        ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                        : "border-orange-500 text-orange-600 hover:bg-orange-50"
                      : activeQuickFilters.includes(filter.id)
                      ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                      : "border-blue-500 text-blue-600 hover:bg-blue-50"
                  }`}
                  onClick={() => toggleQuickFilter(filter.id)}>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      filter.color === "orange" ? "bg-orange-500" : "bg-blue-500"
                    }`}
                  />
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tenderTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {type !== "Todos" && (
                            <span className="text-gray-500">{getTypeIcon(type)}</span>
                          )}
                          {type}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etapa</label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tenderStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        <div className="flex items-center gap-2">
                          {stage === "Disputa" && (
                            <span className="w-2 h-2 bg-gray-600 rounded-full" />
                          )}
                          {stage === "Decisão" && (
                            <span className="w-2 h-2 bg-gray-600 rounded-full" />
                          )}
                          {stage === "Contrato" && (
                            <span className="w-2 h-2 bg-gray-600 rounded-full" />
                          )}
                          {stage === "Recebendo propostas" && (
                            <span className="w-2 h-2 bg-gray-600 rounded-full" />
                          )}
                          {stage}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Linha de suprimento
                </label>
                <Select value={selectedSupplyLine} onValueChange={setSelectedSupplyLine}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supplyLines.map((line) => (
                      <SelectItem key={line} value={line}>
                        {line}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Search Bar */}
          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-blue-600" />
              <div className="flex-1 relative">
                <Input
                  placeholder="Pesquisar processos"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Quick Filter Tags */}
          {activeQuickFilters.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                Filtros rápidos:
              </div>
              <div className="flex flex-wrap gap-2">
                {activeQuickFilters.map((filterId) => {
                  const filter = quickFilters.find((f) => f.id === filterId);
                  if (!filter) return null;

                  return (
                    <Badge
                      key={filterId}
                      variant="secondary"
                      className={`${
                        filter.color === "orange"
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      } px-3 py-1`}>
                      {filter.label} {filter.count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {tenders.map((tender) => (
              <Link key={tender.id} href={`/dashboard/tenders/${tender.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Left Date Section */}
                      <div className="bg-blue-600 text-white p-4 flex flex-col items-center justify-center min-w-[120px]">
                        <div className="text-xs font-medium">{tender.date}</div>
                        <div className="mt-2 p-2 bg-white/20 rounded">
                          <span className="text-2xl">{getTypeIcon(tender.type)}</span>
                        </div>
                        <div className="text-xs mt-2 text-center">{tender.type}</div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Building className="h-4 w-4 text-blue-600" />
                              <h3 className="font-medium text-gray-900">{tender.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {tender.description}
                            </p>
                            <div className="text-xs text-gray-500">{tender.number}</div>
                          </div>

                          {/* Status */}
                          <div className="ml-4 flex flex-col items-end gap-2">
                            {getStatusBadge(tender.status, tender.statusColor)}
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="bg-blue-600 p-4 flex items-center justify-center min-w-[80px]">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                          <FileText className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

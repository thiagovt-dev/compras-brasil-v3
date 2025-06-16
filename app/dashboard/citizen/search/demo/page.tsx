"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, FileText, Building, RefreshCw } from "lucide-react"

// Mock data for tenders
const tenders = [
  {
    id: "1",
    title: "Aquisição de equipamentos de informática",
    description:
      "Processo para aquisição de equipamentos de informática para modernização do parque tecnológico da administração pública municipal.",
    number: "Pregão Eletrônico nº 001/2025",
    date: "001/2025",
    type: "Pregão",
    status: "Publicada",
    statusColor: "green",
    agency: "Ministério da Educação",
    category: "Aquisição de bens",
    openingDate: "10/06/2025 às 10:00",
    exclusiveMeEpp: true,
  },
  {
    id: "2",
    title: "Contratação de serviços de limpeza",
    description: "Contratação de empresa especializada para prestação de serviços de limpeza e conservação predial.",
    number: "Pregão Eletrônico nº 002/2025",
    date: "002/2025",
    type: "Pregão",
    status: "Aguardando abertura",
    statusColor: "blue",
    agency: "Prefeitura Municipal de São Paulo",
    category: "Serviços comuns",
    openingDate: "15/06/2025 às 14:00",
    exclusiveMeEpp: false,
  },
  {
    id: "3",
    title: "Reforma de prédio público",
    description: "Execução de obras de reforma e modernização do prédio sede do Tribunal Regional Federal.",
    number: "Concorrência nº 001/2025",
    date: "001/2025",
    type: "Concorrência",
    status: "Em disputa",
    statusColor: "orange",
    agency: "Tribunal Regional Federal",
    category: "Obras",
    openingDate: "03/06/2025 às 09:00",
    exclusiveMeEpp: false,
  },
]

const quickFilters = [
  { id: "suspended", label: "Apenas suspensos", count: 0, color: "orange" },
  { id: "proposals", label: "Apenas propostas", count: 3, color: "blue" },
  { id: "favorites", label: "Apenas favoritos", count: 0, color: "blue" },
]

const tenderTypes = ["Todos", "Pregão Eletrônico", "Concorrência Eletrônica", "Dispensa Eletrônica", "Inexigibilidade"]

const tenderStages = [
  "Todos",
  "Publicada",
  "Aguardando abertura",
  "Em disputa",
  "Em andamento",
  "Homologada",
  "Revogada",
  "Anulada",
]

const categories = ["Todas", "Aquisição de bens", "Serviços comuns", "Serviços comuns de engenharia", "Obras"]

const agencies = [
  "Todos",
  "Ministério da Educação",
  "Prefeitura Municipal de São Paulo",
  "Tribunal Regional Federal",
  "Secretaria de Saúde",
]

export default function CitizenTenderSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([])
  const [selectedAgency, setSelectedAgency] = useState("Todos")
  const [selectedType, setSelectedType] = useState("Todos")
  const [selectedStage, setSelectedStage] = useState("Todos")
  const [selectedCategory, setSelectedCategory] = useState("Todas")

  const toggleQuickFilter = (filterId: string) => {
    setActiveQuickFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId],
    )
  }

  const clearFilters = () => {
    setActiveQuickFilters([])
    setSelectedAgency("Todos")
    setSelectedType("Todos")
    setSelectedStage("Todos")
    setSelectedCategory("Todas")
    setSearchTerm("")
  }

  const getStatusBadge = (status: string, color: string) => {
    const colorClasses = {
      blue: "bg-blue-600 text-white",
      green: "bg-green-600 text-white",
      orange: "bg-orange-600 text-white",
      red: "bg-red-600 text-white",
    }

    return <Badge className={`${colorClasses[color as keyof typeof colorClasses]} px-3 py-1`}>{status}</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Pregão":
        return "⚖️"
      case "Concorrência":
        return "🏛️"
      case "Dispensa":
        return "📄"
      case "Inexigibilidade":
        return "📋"
      default:
        return "📋"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Pesquisar Licitações</h1>
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
                  onClick={() => toggleQuickFilter(filter.id)}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${filter.color === "orange" ? "bg-orange-500" : "bg-blue-500"}`}
                  />
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Órgão</label>
                <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency} value={agency}>
                        {agency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modalidade</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tenderTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tenderStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
                  placeholder="Pesquisar licitações"
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
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">Filtros rápidos:</div>
              <div className="flex flex-wrap gap-2">
                {activeQuickFilters.map((filterId) => {
                  const filter = quickFilters.find((f) => f.id === filterId)
                  if (!filter) return null

                  return (
                    <Badge
                      key={filterId}
                      variant="secondary"
                      className={`${
                        filter.color === "orange"
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      } px-3 py-1`}
                    >
                      {filter.label} {filter.count}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {tenders.map((tender) => (
              <Link key={tender.id} href={`/dashboard/citizen/search/${tender.id}`}>
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
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tender.description}</p>
                            <div className="text-xs text-gray-500 mb-2">
                              {tender.number} • {tender.agency}
                            </div>
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Abertura:</span> {tender.openingDate}
                            </div>
                          </div>

                          {/* Status */}
                          <div className="ml-4 flex flex-col items-end gap-2">
                            {getStatusBadge(tender.status, tender.statusColor)}
                            {tender.exclusiveMeEpp && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                Exclusivo ME/EPP
                              </Badge>
                            )}
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

          {/* No Results */}
          {tenders.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma licitação encontrada</h3>
              <p className="text-gray-600">Tente ajustar os filtros ou realizar uma nova pesquisa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

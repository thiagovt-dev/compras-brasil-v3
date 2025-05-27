"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Search, Filter, CalendarIcon, Building2, Landmark, FileText, Clock, Download } from "lucide-react"
import Link from "next/link"

// Mock data for tenders
const tenders = [
  {
    id: "1",
    title: "Aquisição de equipamentos de informática",
    number: "Pregão Eletrônico nº 001/2025",
    agency: "Ministério da Educação",
    agency_type: "federal",
    modality: "pregao-eletronico",
    category: "aquisicao-bens",
    status: "Publicada",
    publication_date: "2025-06-05",
    opening_date: "2025-06-20",
    value: "R$ 1.500.000,00",
    location: "Brasília/DF",
  },
  {
    id: "2",
    title: "Contratação de serviços de limpeza",
    number: "Pregão Eletrônico nº 002/2025",
    agency: "Prefeitura Municipal de São Paulo",
    agency_type: "municipal",
    modality: "pregao-eletronico",
    category: "servicos-comuns",
    status: "Aguardando abertura",
    publication_date: "2025-06-04",
    opening_date: "2025-06-18",
    value: "R$ 800.000,00",
    location: "São Paulo/SP",
  },
  {
    id: "3",
    title: "Reforma de prédio público",
    number: "Concorrência Eletrônica nº 001/2025",
    agency: "Tribunal Regional Federal",
    agency_type: "federal",
    modality: "concorrencia-eletronica",
    category: "obras",
    status: "Em disputa",
    publication_date: "2025-06-03",
    opening_date: "2025-06-15",
    value: "R$ 3.200.000,00",
    location: "Rio de Janeiro/RJ",
  },
  {
    id: "4",
    title: "Fornecimento de material de escritório",
    number: "Pregão Eletrônico nº 003/2025",
    agency: "Secretaria de Saúde",
    agency_type: "estadual",
    modality: "pregao-eletronico",
    category: "aquisicao-bens",
    status: "Em andamento",
    publication_date: "2025-06-02",
    opening_date: "2025-06-10",
    value: "R$ 250.000,00",
    location: "Belo Horizonte/MG",
  },
  {
    id: "5",
    title: "Aquisição de veículos",
    number: "Pregão Eletrônico nº 004/2024",
    agency: "Ministério da Justiça",
    agency_type: "federal",
    modality: "pregao-eletronico",
    category: "aquisicao-bens",
    status: "Homologada",
    publication_date: "2024-12-10",
    opening_date: "2024-12-20",
    value: "R$ 2.100.000,00",
    location: "Brasília/DF",
  },
  {
    id: "6",
    title: "Serviços de consultoria",
    number: "Pregão Eletrônico nº 005/2024",
    agency: "Governo do Estado de São Paulo",
    agency_type: "estadual",
    modality: "pregao-eletronico",
    category: "servicos-comuns",
    status: "Fracassada",
    publication_date: "2024-11-15",
    opening_date: "2024-11-30",
    value: "R$ 500.000,00",
    location: "São Paulo/SP",
  },
  {
    id: "7",
    title: "Aquisição de medicamentos",
    number: "Dispensa Eletrônica nº 001/2025",
    agency: "Secretaria Municipal de Saúde",
    agency_type: "municipal",
    modality: "dispensa-eletronica",
    category: "aquisicao-bens",
    status: "Publicada",
    publication_date: "2025-06-01",
    opening_date: "2025-06-08",
    value: "R$ 120.000,00",
    location: "Fortaleza/CE",
  },
]

export default function TenderSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    modality: [],
    category: [],
    agency_type: [],
    status: [],
    publication_date_start: undefined as Date | undefined,
    publication_date_end: undefined as Date | undefined,
    opening_date_start: undefined as Date | undefined,
    opening_date_end: undefined as Date | undefined,
  })

  // Filter tenders based on search term and filters
  const filteredTenders = tenders.filter((tender) => {
    // Search term filter
    const matchesSearch =
      searchTerm === "" ||
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.agency.toLowerCase().includes(searchTerm.toLowerCase())

    // Tab filter
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" &&
        ["Publicada", "Aguardando abertura", "Em disputa", "Em andamento"].includes(tender.status)) ||
      (activeTab === "completed" &&
        ["Homologada", "Fracassada", "Deserta", "Revogada", "Anulada"].includes(tender.status))

    // Advanced filters
    const matchesModality = filters.modality.length === 0 || filters.modality.includes(tender.modality)

    const matchesCategory = filters.category.length === 0 || filters.category.includes(tender.category)

    const matchesAgencyType = filters.agency_type.length === 0 || filters.agency_type.includes(tender.agency_type)

    const matchesStatus = filters.status.length === 0 || filters.status.includes(tender.status)

    const matchesPublicationDate =
      (!filters.publication_date_start || new Date(tender.publication_date) >= filters.publication_date_start) &&
      (!filters.publication_date_end || new Date(tender.publication_date) <= filters.publication_date_end)

    const matchesOpeningDate =
      (!filters.opening_date_start || new Date(tender.opening_date) >= filters.opening_date_start) &&
      (!filters.opening_date_end || new Date(tender.opening_date) <= filters.opening_date_end)

    return (
      matchesSearch &&
      matchesTab &&
      matchesModality &&
      matchesCategory &&
      matchesAgencyType &&
      matchesStatus &&
      matchesPublicationDate &&
      matchesOpeningDate
    )
  })

  const toggleFilter = (filterType: string, value: string) => {
    setFilters((prev) => {
      const currentFilters = [...prev[filterType as keyof typeof prev]] as string[]

      if (currentFilters.includes(value)) {
        return {
          ...prev,
          [filterType]: currentFilters.filter((item) => item !== value),
        }
      } else {
        return {
          ...prev,
          [filterType]: [...currentFilters, value],
        }
      }
    })
  }

  const clearFilters = () => {
    setFilters({
      modality: [],
      category: [],
      agency_type: [],
      status: [],
      publication_date_start: undefined,
      publication_date_end: undefined,
      opening_date_start: undefined,
      opening_date_end: undefined,
    })
    setSearchTerm("")
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Publicada":
        return "secondary"
      case "Aguardando abertura":
        return "default"
      case "Em disputa":
        return "warning"
      case "Em andamento":
        return "default"
      case "Homologada":
        return "success"
      case "Fracassada":
        return "destructive"
      case "Deserta":
        return "destructive"
      case "Revogada":
        return "destructive"
      case "Anulada":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pesquisar Licitações</h1>
        <p className="text-muted-foreground">Encontre licitações públicas em andamento ou concluídas</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título, número ou órgão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
            {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
          </Button>
        </div>

        {showFilters && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filtros Avançados</CardTitle>
              <CardDescription>Refine sua pesquisa utilizando os filtros abaixo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Modalidade</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="modality-pregao"
                        checked={filters.modality.includes("pregao-eletronico")}
                        onCheckedChange={() => toggleFilter("modality", "pregao-eletronico")}
                      />
                      <Label htmlFor="modality-pregao">Pregão Eletrônico</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="modality-concorrencia"
                        checked={filters.modality.includes("concorrencia-eletronica")}
                        onCheckedChange={() => toggleFilter("modality", "concorrencia-eletronica")}
                      />
                      <Label htmlFor="modality-concorrencia">Concorrência Eletrônica</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="modality-dispensa"
                        checked={filters.modality.includes("dispensa-eletronica")}
                        onCheckedChange={() => toggleFilter("modality", "dispensa-eletronica")}
                      />
                      <Label htmlFor="modality-dispensa">Dispensa Eletrônica</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Categoria</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="category-bens"
                        checked={filters.category.includes("aquisicao-bens")}
                        onCheckedChange={() => toggleFilter("category", "aquisicao-bens")}
                      />
                      <Label htmlFor="category-bens">Aquisição de Bens</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="category-servicos"
                        checked={filters.category.includes("servicos-comuns")}
                        onCheckedChange={() => toggleFilter("category", "servicos-comuns")}
                      />
                      <Label htmlFor="category-servicos">Serviços Comuns</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="category-obras"
                        checked={filters.category.includes("obras")}
                        onCheckedChange={() => toggleFilter("category", "obras")}
                      />
                      <Label htmlFor="category-obras">Obras</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Esfera</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agency-federal"
                        checked={filters.agency_type.includes("federal")}
                        onCheckedChange={() => toggleFilter("agency_type", "federal")}
                      />
                      <Label htmlFor="agency-federal">Federal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agency-estadual"
                        checked={filters.agency_type.includes("estadual")}
                        onCheckedChange={() => toggleFilter("agency_type", "estadual")}
                      />
                      <Label htmlFor="agency-estadual">Estadual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="agency-municipal"
                        checked={filters.agency_type.includes("municipal")}
                        onCheckedChange={() => toggleFilter("agency_type", "municipal")}
                      />
                      <Label htmlFor="agency-municipal">Municipal</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Status</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-publicada"
                        checked={filters.status.includes("Publicada")}
                        onCheckedChange={() => toggleFilter("status", "Publicada")}
                      />
                      <Label htmlFor="status-publicada">Publicada</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-aguardando"
                        checked={filters.status.includes("Aguardando abertura")}
                        onCheckedChange={() => toggleFilter("status", "Aguardando abertura")}
                      />
                      <Label htmlFor="status-aguardando">Aguardando abertura</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-disputa"
                        checked={filters.status.includes("Em disputa")}
                        onCheckedChange={() => toggleFilter("status", "Em disputa")}
                      />
                      <Label htmlFor="status-disputa">Em disputa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-andamento"
                        checked={filters.status.includes("Em andamento")}
                        onCheckedChange={() => toggleFilter("status", "Em andamento")}
                      />
                      <Label htmlFor="status-andamento">Em andamento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-homologada"
                        checked={filters.status.includes("Homologada")}
                        onCheckedChange={() => toggleFilter("status", "Homologada")}
                      />
                      <Label htmlFor="status-homologada">Homologada</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Data de Publicação</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="publication-start" className="text-xs">
                        De
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.publication_date_start ? (
                              format(filters.publication_date_start, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecionar</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.publication_date_start}
                            onSelect={(date) => setFilters((prev) => ({ ...prev, publication_date_start: date }))}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="publication-end" className="text-xs">
                        Até
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.publication_date_end ? (
                              format(filters.publication_date_end, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecionar</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.publication_date_end}
                            onSelect={(date) => setFilters((prev) => ({ ...prev, publication_date_end: date }))}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Data de Abertura</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="opening-start" className="text-xs">
                        De
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.opening_date_start ? (
                              format(filters.opening_date_start, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecionar</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.opening_date_start}
                            onSelect={(date) => setFilters((prev) => ({ ...prev, opening_date_start: date }))}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="opening-end" className="text-xs">
                        Até
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.opening_date_end ? (
                              format(filters.opening_date_end, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecionar</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.opening_date_end}
                            onSelect={(date) => setFilters((prev) => ({ ...prev, opening_date_end: date }))}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={clearFilters} className="mr-2">
                  Limpar Filtros
                </Button>
                <Button onClick={() => setShowFilters(false)}>Aplicar Filtros</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="active">Em Andamento</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Licitações</CardTitle>
              <CardDescription>{filteredTenders.length} licitação(ões) encontrada(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTenders.length > 0 ? (
                <div className="space-y-4">
                  {filteredTenders.map((tender) => (
                    <div
                      key={tender.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="font-medium">{tender.title}</h3>
                          <Badge variant={getStatusBadgeVariant(tender.status)} className="mt-1 sm:mt-0">
                            {tender.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tender.number}</p>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center">
                          <div className="flex items-center gap-1">
                            {tender.agency_type === "federal" ? (
                              <Landmark className="h-3.5 w-3.5" />
                            ) : (
                              <Building2 className="h-3.5 w-3.5" />
                            )}
                            <span>{tender.agency}</span>
                          </div>
                          <div className="hidden sm:block">•</div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>Publicação: {new Date(tender.publication_date).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="hidden sm:block">•</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Abertura: {new Date(tender.opening_date).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-medium">Valor Estimado:</span>
                          <span>{tender.value}</span>
                        </div>
                      </div>
                      <div className="flex flex-row gap-2 sm:flex-col">
                        <Link href={`/dashboard/search/${tender.id}`} className="flex-1">
                          <Button variant="default" className="w-full">
                            Ver Detalhes
                          </Button>
                        </Link>
                        <Button variant="outline" className="flex-1 gap-1">
                          <Download className="h-4 w-4" />
                          <span>Edital</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Nenhuma licitação encontrada</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tente ajustar os filtros ou realizar uma nova pesquisa.
                  </p>
                  <Button className="mt-4" variant="outline" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

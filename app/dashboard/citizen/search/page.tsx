"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Search, Filter, FileText, Star, StarOff } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function TenderSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedModality, setSelectedModality] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedAgency, setSelectedAgency] = useState<string>("")

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id))
    } else {
      setFavorites([...favorites, id])
    }
  }

  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch =
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus ? tender.status === selectedStatus : true
    const matchesModality = selectedModality ? tender.modality === selectedModality : true
    const matchesCategory = selectedCategory ? tender.category === selectedCategory : true
    const matchesAgency = selectedAgency ? tender.agency === selectedAgency : true

    return matchesSearch && matchesStatus && matchesModality && matchesCategory && matchesAgency
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pesquisar Licitações</h1>
        <p className="text-muted-foreground">Encontre licitações públicas em andamento ou concluídas</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título, órgão ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecionar data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus locale={ptBR} />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="Publicada">Publicada</SelectItem>
                      <SelectItem value="Aguardando abertura">Aguardando abertura</SelectItem>
                      <SelectItem value="Em disputa">Em disputa</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Homologada">Homologada</SelectItem>
                      <SelectItem value="Revogada">Revogada</SelectItem>
                      <SelectItem value="Anulada">Anulada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modality">Modalidade</Label>
                  <Select value={selectedModality} onValueChange={setSelectedModality}>
                    <SelectTrigger id="modality">
                      <SelectValue placeholder="Todas as modalidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as modalidades</SelectItem>
                      <SelectItem value="Pregão Eletrônico">Pregão Eletrônico</SelectItem>
                      <SelectItem value="Concorrência Eletrônica">Concorrência Eletrônica</SelectItem>
                      <SelectItem value="Dispensa Eletrônica">Dispensa Eletrônica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      <SelectItem value="Aquisição de bens">Aquisição de bens</SelectItem>
                      <SelectItem value="Serviços comuns">Serviços comuns</SelectItem>
                      <SelectItem value="Serviços comuns de engenharia">Serviços comuns de engenharia</SelectItem>
                      <SelectItem value="Obras">Obras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency">Órgão</Label>
                  <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                    <SelectTrigger id="agency">
                      <SelectValue placeholder="Todos os órgãos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os órgãos</SelectItem>
                      <SelectItem value="Ministério da Educação">Ministério da Educação</SelectItem>
                      <SelectItem value="Prefeitura Municipal de São Paulo">
                        Prefeitura Municipal de São Paulo
                      </SelectItem>
                      <SelectItem value="Tribunal Regional Federal">Tribunal Regional Federal</SelectItem>
                      <SelectItem value="Secretaria de Saúde">Secretaria de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Checkbox id="exclusive-me-epp" />
                <Label htmlFor="exclusive-me-epp">Exclusivo para ME/EPP</Label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="rounded-md border">
        <div className="p-4 font-medium">{filteredTenders.length} licitações encontradas</div>
        <div className="divide-y">
          {filteredTenders.map((tender) => (
            <div key={tender.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{tender.title}</h3>
                    <Badge variant={getStatusBadgeVariant(tender.status)}>{tender.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tender.number} • {tender.agency}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{tender.modality}</Badge>
                    <Badge variant="outline">{tender.category}</Badge>
                    {tender.exclusiveMeEpp && (
                      <Badge variant="outline" className="bg-blue-50">
                        Exclusivo ME/EPP
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Abertura:</span> {tender.openingDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(tender.id)}
                    className="text-yellow-500"
                  >
                    {favorites.includes(tender.id) ? (
                      <Star className="h-5 w-5 fill-yellow-500" />
                    ) : (
                      <StarOff className="h-5 w-5" />
                    )}
                  </Button>
                  <Link href={`/dashboard/citizen/search/${tender.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Detalhes
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {filteredTenders.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma licitação encontrada com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function for badges
function getStatusBadgeVariant(status: string) {
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
    case "Revogada":
      return "destructive"
    case "Anulada":
      return "destructive"
    default:
      return "outline"
  }
}

// Mock data for tenders
const tenders = [
  {
    id: "1",
    title: "Aquisição de equipamentos de informática",
    number: "Pregão Eletrônico nº 001/2025",
    agency: "Ministério da Educação",
    status: "Publicada",
    modality: "Pregão Eletrônico",
    category: "Aquisição de bens",
    openingDate: "10/06/2025 às 10:00",
    exclusiveMeEpp: true,
  },
  {
    id: "2",
    title: "Contratação de serviços de limpeza",
    number: "Pregão Eletrônico nº 002/2025",
    agency: "Prefeitura Municipal de São Paulo",
    status: "Aguardando abertura",
    modality: "Pregão Eletrônico",
    category: "Serviços comuns",
    openingDate: "15/06/2025 às 14:00",
    exclusiveMeEpp: false,
  },
  {
    id: "3",
    title: "Reforma de prédio público",
    number: "Concorrência nº 001/2025",
    agency: "Tribunal Regional Federal",
    status: "Em disputa",
    modality: "Concorrência Eletrônica",
    category: "Obras",
    openingDate: "03/06/2025 às 09:00",
    exclusiveMeEpp: false,
  },
  {
    id: "4",
    title: "Fornecimento de material de escritório",
    number: "Pregão Eletrônico nº 003/2025",
    agency: "Secretaria de Saúde",
    status: "Em andamento",
    modality: "Pregão Eletrônico",
    category: "Aquisição de bens",
    openingDate: "01/06/2025 às 11:00",
    exclusiveMeEpp: true,
  },
  {
    id: "5",
    title: "Aquisição de veículos",
    number: "Pregão Eletrônico nº 004/2024",
    agency: "Ministério da Educação",
    status: "Homologada",
    modality: "Pregão Eletrônico",
    category: "Aquisição de bens",
    openingDate: "15/05/2025 às 10:00",
    exclusiveMeEpp: false,
  },
  {
    id: "6",
    title: "Serviços de consultoria",
    number: "Pregão Eletrônico nº 005/2024",
    agency: "Prefeitura Municipal de São Paulo",
    status: "Revogada",
    modality: "Pregão Eletrônico",
    category: "Serviços comuns",
    openingDate: "10/05/2025 às 14:00",
    exclusiveMeEpp: true,
  },
]

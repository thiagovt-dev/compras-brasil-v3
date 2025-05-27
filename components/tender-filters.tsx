"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, Search, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface TenderFiltersProps {
  onFilterChange: (filters: any) => void
  agencies: any[]
}

export function TenderFilters({ onFilterChange, agencies }: TenderFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    modality: "all", // Updated default value
    category: "all", // Updated default value
    agency_id: "all", // Updated default value
    status: "all", // Updated default value
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    onlyOpen: true,
  })

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const defaultFilters = {
      search: "",
      modality: "all", // Updated default value
      category: "all", // Updated default value
      agency_id: "all", // Updated default value
      status: "all", // Updated default value
      startDate: undefined,
      endDate: undefined,
      onlyOpen: true,
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título, número ou descrição..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 sm:w-96">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Filtros</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onlyOpen"
                    checked={filters.onlyOpen}
                    onCheckedChange={(checked) => handleFilterChange("onlyOpen", checked)}
                  />
                  <Label htmlFor="onlyOpen">Mostrar apenas licitações abertas</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modality">Modalidade</Label>
                  <Select value={filters.modality} onValueChange={(value) => handleFilterChange("modality", value)}>
                    <SelectTrigger id="modality">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="pregao-eletronico">Pregão Eletrônico</SelectItem>
                      <SelectItem value="concorrencia-eletronica">Concorrência Eletrônica</SelectItem>
                      <SelectItem value="dispensa-eletronica">Dispensa Eletrônica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="aquisicao-bens">Aquisição de Bens</SelectItem>
                      <SelectItem value="servicos-comuns">Serviços Comuns</SelectItem>
                      <SelectItem value="servicos-comuns-engenharia">Serviços Comuns de Engenharia</SelectItem>
                      <SelectItem value="obras">Obras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency">Órgão</Label>
                <Select value={filters.agency_id} onValueChange={(value) => handleFilterChange("agency_id", value)}>
                  <SelectTrigger id="agency">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? (
                          format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecionar</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => handleFilterChange("startDate", date)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? (
                          format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecionar</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => handleFilterChange("endDate", date)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Aberta</SelectItem>
                    <SelectItem value="closed">Encerrada</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                    <SelectItem value="suspended">Suspensa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

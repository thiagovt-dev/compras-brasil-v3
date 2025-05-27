"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BasicInfoProps {
  formData: any
  setFormData: (data: any) => void
  onNext: () => void
}

export default function BasicInfo({ formData, setFormData, onNext }: BasicInfoProps) {
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const validateForm = () => {
    // Required fields
    const requiredFields = [
      "modality",
      "category",
      "editalNumber",
      "processNumber",
      "judgmentCriteria",
      "disputeMode",
      "impugnationDate",
      "proposalDate",
      "openingDate",
      "object",
    ]

    const missingFields = requiredFields.filter((field) => !formData[field])

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="modality">
            Modalidade <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.modality} onValueChange={(value) => handleChange("modality", value)}>
            <SelectTrigger id="modality">
              <SelectValue placeholder="Selecione a modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pregao-eletronico">Pregão Eletrônico</SelectItem>
              <SelectItem value="concorrencia-eletronica">Concorrência Eletrônica</SelectItem>
              <SelectItem value="dispensa-eletronica">Dispensa Eletrônica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">
            Categoria <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {formData.modality === "pregao-eletronico" && (
                <>
                  <SelectItem value="aquisicao-bens">Aquisição de bens</SelectItem>
                  <SelectItem value="servicos-comuns">Serviços comuns</SelectItem>
                  <SelectItem value="servicos-comuns-engenharia">Serviços comuns de engenharia</SelectItem>
                </>
              )}
              {formData.modality === "concorrencia-eletronica" && (
                <>
                  <SelectItem value="aquisicao-bens-especiais">Aquisição de bens especiais</SelectItem>
                  <SelectItem value="servicos-especiais">Serviços especiais</SelectItem>
                  <SelectItem value="obras">Obras</SelectItem>
                  <SelectItem value="servicos-especiais-engenharia">Serviços especiais de engenharia</SelectItem>
                  <SelectItem value="servicos-comuns-engenharia">Serviços comuns de engenharia</SelectItem>
                </>
              )}
              {formData.modality === "dispensa-eletronica" && (
                <>
                  <SelectItem value="aquisicao-bens">Aquisição de bens</SelectItem>
                  <SelectItem value="servicos-comuns">Serviços comuns</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="editalNumber">
            Número do Edital <span className="text-red-500">*</span>
          </Label>
          <Input
            id="editalNumber"
            value={formData.editalNumber}
            onChange={(e) => handleChange("editalNumber", e.target.value)}
            placeholder="Ex: 001/2025"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="processNumber">
            Número do Processo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="processNumber"
            value={formData.processNumber}
            onChange={(e) => handleChange("processNumber", e.target.value)}
            placeholder="Ex: 123456/2025"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="judgmentCriteria">
            Critério de Julgamento <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.judgmentCriteria} onValueChange={(value) => handleChange("judgmentCriteria", value)}>
            <SelectTrigger id="judgmentCriteria">
              <SelectValue placeholder="Selecione o critério" />
            </SelectTrigger>
            <SelectContent>
              {(formData.modality === "pregao-eletronico" || formData.modality === "dispensa-eletronica") && (
                <>
                  <SelectItem value="menor-preco-item">Menor Preço por item</SelectItem>
                  <SelectItem value="menor-preco-lote">Menor Preço por lote</SelectItem>
                  <SelectItem value="maior-desconto">Maior Desconto</SelectItem>
                  <SelectItem value="menor-taxa">Menor taxa administrativa</SelectItem>
                </>
              )}
              {formData.modality === "concorrencia-eletronica" && (
                <>
                  <SelectItem value="menor-preco">Menor Preço R$</SelectItem>
                  <SelectItem value="melhor-tecnica">Melhor técnica ou conteúdo artístico</SelectItem>
                  <SelectItem value="tecnica-preco">Técnica e preço R$</SelectItem>
                  <SelectItem value="maior-retorno">Maior retorno econômico R$ ou %</SelectItem>
                  <SelectItem value="maior-desconto">Maior Desconto (%)</SelectItem>
                  <SelectItem value="menor-taxa">Menor taxa administrativa %</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="disputeMode">
            Modo de Disputa <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.disputeMode} onValueChange={(value) => handleChange("disputeMode", value)}>
            <SelectTrigger id="disputeMode">
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent>
              {formData.modality === "pregao-eletronico" && (
                <>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="aberto-fechado">Aberto e Fechado</SelectItem>
                  <SelectItem value="fechado-aberto">Fechado e Aberto</SelectItem>
                  <SelectItem value="randomico">Randômico</SelectItem>
                </>
              )}
              {formData.modality === "concorrencia-eletronica" && (
                <>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="aberto-fechado">Aberto e Fechado</SelectItem>
                  <SelectItem value="fechado-aberto">Fechado e Aberto</SelectItem>
                </>
              )}
              {formData.modality === "dispensa-eletronica" && <SelectItem value="simples">Disputa Simples</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priceDecimals">Decimais dos Preços</Label>
          <Select value={formData.priceDecimals} onValueChange={(value) => handleChange("priceDecimals", value)}>
            <SelectTrigger id="priceDecimals">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Casas</SelectItem>
              <SelectItem value="3">3 Casas</SelectItem>
              <SelectItem value="4">4 Casas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valueBetweenBids">Valor Entre Lances</Label>
          <Input
            id="valueBetweenBids"
            value={formData.valueBetweenBids}
            onChange={(e) => handleChange("valueBetweenBids", e.target.value)}
            placeholder="Ex: 0,10 ou 1%"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="secretValue"
          checked={formData.secretValue}
          onCheckedChange={(checked) => handleChange("secretValue", checked)}
        />
        <Label htmlFor="secretValue">Valor Sigiloso</Label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>
            Data Limite para Impugnação e Esclarecimentos <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.impugnationDate ? (
                  format(formData.impugnationDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.impugnationDate}
                onSelect={(date) => handleChange("impugnationDate", date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>
            Data Limite para Recebimento das Propostas <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.proposalDate ? (
                  format(formData.proposalDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.proposalDate}
                onSelect={(date) => handleChange("proposalDate", date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>
            Data de Abertura da Sessão Pública <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.openingDate ? (
                  format(formData.openingDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.openingDate}
                onSelect={(date) => handleChange("openingDate", date)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Documentos de Habilitação</Label>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="all"
              name="documentationMode"
              value="all"
              checked={formData.documentationMode === "all"}
              onChange={() => handleChange("documentationMode", "all")}
              className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="all">Todos apresentam na fase de proposta</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="winner"
              name="documentationMode"
              value="winner"
              checked={formData.documentationMode === "winner"}
              onChange={() => handleChange("documentationMode", "winner")}
              className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="winner">Somente o licitante arrematante apresenta</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="phaseInversion"
          checked={formData.phaseInversion}
          onCheckedChange={(checked) => handleChange("phaseInversion", checked)}
        />
        <Label htmlFor="phaseInversion">Inversão das fases</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="object">
          Objeto do Edital <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="object"
          value={formData.object}
          onChange={(e) => handleChange("object", e.target.value)}
          placeholder="Descreva o objeto da licitação"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} className="gap-2">
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

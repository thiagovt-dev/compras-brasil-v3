"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TeamInfoProps {
  formData: any
  setFormData: (data: any) => void
  onNext: () => void
  onPrev: () => void
}

export default function TeamInfo({ formData, setFormData, onNext, onPrev }: TeamInfoProps) {
  const { toast } = useToast()

  const handleTeamChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      team: { ...formData.team, [field]: value },
    })
  }

  const handleSupportTeamChange = (index: number, value: string) => {
    const newSupportTeam = [...formData.team.supportTeam]
    newSupportTeam[index] = value
    setFormData({
      ...formData,
      team: { ...formData.team, supportTeam: newSupportTeam },
    })
  }

  const addSupportTeamMember = () => {
    setFormData({
      ...formData,
      team: {
        ...formData.team,
        supportTeam: [...formData.team.supportTeam, ""],
      },
    })
  }

  const removeSupportTeamMember = (index: number) => {
    const newSupportTeam = [...formData.team.supportTeam]
    newSupportTeam.splice(index, 1)
    setFormData({
      ...formData,
      team: { ...formData.team, supportTeam: newSupportTeam },
    })
  }

  const validateForm = () => {
    // Check if auctioneer and authority are selected
    if (!formData.team.auctioneer || !formData.team.authority) {
      toast({
        title: "Campos obrigatórios",
        description: `Por favor, selecione ${formData.modality === "pregao-eletronico" ? "o Pregoeiro" : "o Agente de Contratação"} e a Autoridade Superior.`,
        variant: "destructive",
      })
      return false
    }

    // Check if at least one support team member is selected
    if (formData.team.supportTeam.length === 0 || !formData.team.supportTeam[0]) {
      toast({
        title: "Equipe de Apoio",
        description: "Por favor, selecione pelo menos um membro para a Equipe de Apoio.",
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
      <div className="space-y-2">
        <Label htmlFor="auctioneer">
          {formData.modality === "pregao-eletronico" ? "Pregoeiro" : "Agente de Contratação"}{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.team.auctioneer} onValueChange={(value) => handleTeamChange("auctioneer", value)}>
          <SelectTrigger id="auctioneer">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="joao-silva">João Silva</SelectItem>
            <SelectItem value="maria-santos">Maria Santos</SelectItem>
            <SelectItem value="pedro-oliveira">Pedro Oliveira</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="authority">
          Autoridade Superior <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.team.authority} onValueChange={(value) => handleTeamChange("authority", value)}>
          <SelectTrigger id="authority">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="carlos-ferreira">Carlos Ferreira</SelectItem>
            <SelectItem value="ana-costa">Ana Costa</SelectItem>
            <SelectItem value="roberto-almeida">Roberto Almeida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>
            Equipe de Apoio <span className="text-red-500">*</span>
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addSupportTeamMember}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {formData.team.supportTeam.map((member: string, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <Select value={member} onValueChange={(value) => handleSupportTeamChange(index, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lucas-martins">Lucas Martins</SelectItem>
                <SelectItem value="julia-pereira">Julia Pereira</SelectItem>
                <SelectItem value="fernando-gomes">Fernando Gomes</SelectItem>
                <SelectItem value="patricia-lima">Patricia Lima</SelectItem>
              </SelectContent>
            </Select>

            {formData.team.supportTeam.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSupportTeamMember(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {(formData.modality === "concorrencia-eletronica" && formData.category === "aquisicao-bens-especiais") ||
      formData.category === "servicos-especiais" ||
      formData.category === "servicos-especiais-engenharia" ? (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
          <p>
            Para a categoria selecionada, é necessário escolher uma comissão de contratação com no mínimo 3 membros. A
            comissão de contratação substitui o pregoeiro/agente de contratação e a equipe de apoio.
          </p>
        </div>
      ) : null}

      <div className="flex justify-between">
        <Button onClick={onPrev} variant="outline" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} className="gap-2">
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

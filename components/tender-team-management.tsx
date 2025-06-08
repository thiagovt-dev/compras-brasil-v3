"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select" // Assuming you have a MultiSelect component
import { useToast } from "@/hooks/use-toast"
import { updateTenderTeam } from "@/app/dashboard/tenders/[id]/team-actions"
import type { Profile, Tender } from "@/types/supabase" // Assuming these types exist

interface TenderTeamManagementProps {
  tender: Tender
  agencyUsers: Profile[]
  currentProfileId: string
}

export function TenderTeamManagement({ tender, agencyUsers, currentProfileId }: TenderTeamManagementProps) {
  const { toast } = useToast()
  const [selectedPregoeiro, setSelectedPregoeiro] = useState<string | undefined>(tender.pregoeiro_id || undefined)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(tender.team_members || [])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSelectedPregoeiro(tender.pregoeiro_id || undefined)
    setSelectedTeamMembers(tender.team_members || [])
  }, [tender])

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateTenderTeam(tender.id, selectedPregoeiro, selectedTeamMembers)
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: "Time da licitação atualizado com sucesso.",
      })
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível atualizar o time da licitação.",
        variant: "destructive",
      })
    }
    setIsSaving(false)
  }

  const pregoeiroOptions = agencyUsers.map((user) => ({
    label: user.full_name || user.email || "Usuário sem nome",
    value: user.id,
  }))

  const teamMemberOptions = agencyUsers
    .filter((user) => user.id !== selectedPregoeiro) // Exclude selected pregoeiro from team members
    .map((user) => ({
      label: user.full_name || user.email || "Usuário sem nome",
      value: user.id,
    }))

  const isPregoeiro = currentProfileId === tender.pregoeiro_id
  const isAgencyAdmin = agencyUsers.find((u) => u.id === currentProfileId)?.role === "admin"
  const canEdit = isPregoeiro || isAgencyAdmin // Only pregoeiro or agency admin can edit

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão do Time da Licitação</CardTitle>
        <CardDescription>Defina o pregoeiro e os membros da equipe para esta licitação.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Pregoeiro</h3>
          <Select value={selectedPregoeiro} onValueChange={setSelectedPregoeiro} disabled={!canEdit || isSaving}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o pregoeiro" />
            </SelectTrigger>
            <SelectContent>
              {pregoeiroOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canEdit && (
            <p className="text-sm text-muted-foreground mt-2">
              Apenas o pregoeiro ou um administrador do órgão pode alterar esta configuração.
            </p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Membros da Equipe de Apoio</h3>
          <MultiSelect
            options={teamMemberOptions}
            selected={selectedTeamMembers}
            onSelectedChange={setSelectedTeamMembers}
            placeholder="Selecione os membros da equipe"
            disabled={!canEdit || isSaving}
          />
          {!canEdit && (
            <p className="text-sm text-muted-foreground mt-2">
              Apenas o pregoeiro ou um administrador do órgão pode alterar esta configuração.
            </p>
          )}
        </div>

        {canEdit && (
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

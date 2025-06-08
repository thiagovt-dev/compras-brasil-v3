"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select" // Assuming you have a MultiSelect component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [selectedPregoeiro, setSelectedPregoeiro] = useState<string | null>(tender.pregoeiro_id)
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(tender.team_members || [])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSelectedPregoeiro(tender.pregoeiro_id)
    setSelectedTeamMembers(tender.team_members || [])
  }, [tender])

  const handleSave = async () => {
    setIsSaving(true)
    const { success, message } = await updateTenderTeam(tender.id, selectedPregoeiro, selectedTeamMembers)
    if (success) {
      toast({
        title: "Sucesso!",
        description: message,
      })
    } else {
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      })
    }
    setIsSaving(false)
  }

  const pregoeiroOptions = agencyUsers.map((user) => ({
    value: user.id,
    label: user.full_name || user.email || "Usuário Desconhecido",
  }))

  const teamMemberOptions = agencyUsers
    .filter((user) => user.id !== selectedPregoeiro) // Exclude selected pregoeiro from team members
    .map((user) => ({
      value: user.id,
      label: user.full_name || user.email || "Usuário Desconhecido",
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Equipe da Licitação</CardTitle>
        <CardDescription>Defina o pregoeiro e os membros da equipe de apoio para esta licitação.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="pregoeiro">Pregoeiro</Label>
          <Select
            value={selectedPregoeiro || "none"}
            onValueChange={(value) => setSelectedPregoeiro(value === "none" ? null : value)}
          >
            <SelectTrigger id="pregoeiro">
              <SelectValue placeholder="Selecione o pregoeiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {pregoeiroOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="team-members">Membros da Equipe de Apoio</Label>
          <MultiSelect
            options={teamMemberOptions}
            selected={selectedTeamMembers}
            onSelectedChange={setSelectedTeamMembers}
            placeholder="Selecione os membros da equipe"
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  )
}

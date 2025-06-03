"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClientSupabaseClient } from "@/lib/supabase/client";

type Participant = {
  id: string;
  user_id: string;
  supplier_id: string;
  created_at: string;
  user?: {
    email?: string;
  };
  supplier?: {
    name?: string;
  };
};

type TeamMember = {
  id: string;
  role: string;
  user_id: string;
  auth?: {
    users?: {
      email?: string;
    };
  };
};

export function TenderSessionParticipants({ tenderId }: { tenderId: string }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: participantsData, error: participantsError } = await supabase
        .from("tender_suppliers")
        .select("*")
        .eq("tender_id", tenderId)
        .order("created_at", { ascending: false });

      const { data: teamData, error: teamError } = await supabase
        .from("tender_team")
        .select("*")
        .eq("tender_id", tenderId);
    

      if (participantsError || teamError) {
        setError("Erro ao carregar participantes");
        console.error("Erro:", participantsError || teamError);
        return;
      }

      setParticipants(participantsData || []);
      setTeam(teamData || []);
    };

    fetchData();
  }, [tenderId]);

  const getInitials = (text?: string) => {
    if (!text) return "U";
    return text.substring(0, 2).toUpperCase();
  };

  const formatRole = (role: string) => {
    const roleMap: Record<string, string> = {
      pregoeiro: "Pregoeiro",
      "autoridade-superior": "Autoridade Superior",
      "equipe-apoio": "Equipe de Apoio",
      comissao: "Comissão",
    };

    return roleMap[role] || role;
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="space-y-6">
      {team && team.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[1rem] font-medium">Equipe da Licitação</h3>
          <div className="grid gap-2">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(member.auth?.users?.email)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-[1rem] font-medium">
                    {member.auth?.users?.email || "Usuário"}
                  </p>
                </div>
                <Badge variant="outline">{formatRole(member.role)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-[1rem] font-medium">Fornecedores Participantes</h3>
        {participants && participants.length > 0 ? (
          <div className="grid gap-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(participant.supplier?.name || participant.user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-[1rem] font-medium">
                    {participant.supplier?.name || "Fornecedor"}
                  </p>
                  <p className="text-[1rem] text-muted-foreground">{participant.user?.email}</p>
                </div>
                <div className="text-[1rem] text-muted-foreground">
                  {new Date(participant.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground bg-muted/50 rounded-md">
            Nenhum fornecedor participante registrado.
          </div>
        )}
      </div>
    </div>
  );
}

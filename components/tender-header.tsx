import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserIcon } from "lucide-react"; // Assuming Lucide React is available

interface TenderHeaderProps {
  title: string;
  number: string;
  agency: string;
  id: string;
}

export async function TenderHeader({ title, number, agency, id }: TenderHeaderProps) {
  const supabase = createServerComponentClient({ cookies });

  // Fetch tender details including pregoeiro_id and team_members
  const { data: tenderDetails, error: tenderError } = await supabase
    .from("tenders")
    .select(
      `
      pregoeiro_id,
      team_members
    `
    )
    .eq("id", id)
    .single();

  let pregoeiroName: string | null = null;
  let teamMemberNames: string[] = [];

  if (tenderDetails) {
    // Fetch pregoeiro's name
    if (tenderDetails.pregoeiro_id) {
      const { data: pregoeiroProfile, error: pregoeiroError } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", tenderDetails.pregoeiro_id)
        .single();
      if (pregoeiroProfile) {
        pregoeiroName = pregoeiroProfile.name;
      }
    }

    // Fetch team members' names
    if (tenderDetails.team_members && tenderDetails.team_members.length > 0) {
      const { data: teamProfiles, error: teamError } = await supabase
        .from("profiles")
        .select("name")
        .in("id", tenderDetails.team_members);
      if (teamProfiles) {
        teamMemberNames = teamProfiles.map((p) => p.name).filter(Boolean) as string[];
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">
          Nº {number} - Órgão: {agency}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pregoeiroName && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="Pregoeiro" />
              <AvatarFallback>
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Pregoeiro</p>
              <p className="text-base">{pregoeiroName}</p>
            </div>
          </div>
        )}
        {teamMemberNames.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Equipe de Apoio</p>
            <div className="flex flex-wrap gap-1">
              {teamMemberNames.map((name, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="cursor-default">
                        {name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

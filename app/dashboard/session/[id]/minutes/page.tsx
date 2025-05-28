"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  FileIcon as FilePdf,
  FileSpreadsheet,
  FileJson,
  Trash2,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SessionMinutesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientSupabaseClient();
  const [isLoading, setIsLoading] = useState(true);
  const [minutes, setMinutes] = useState<any[]>([]);
  const [tender, setTender] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar dados da licitação
        const { data: tenderData, error: tenderError } = await supabase
          .from("tenders")
          .select("id, title, number")
          .eq("id", params.id)
          .single();

        if (tenderError) throw tenderError;

        // Buscar atas exportadas
        const { data: minutesData, error: minutesError } = await supabase
          .from("session_minutes")
          .select("*")
          .eq("tender_id", params.id)
          .order("created_at", { ascending: false });

        if (minutesError) throw minutesError;

        setTender(tenderData);
        setMinutes(minutesData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as atas exportadas. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, supabase, toast]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("session_minutes").delete().eq("id", id);

      if (error) throw error;

      setMinutes((prev) => prev.filter((minute) => minute.id !== id));

      toast({
        title: "Ata excluída com sucesso",
        description: "A ata foi excluída permanentemente.",
      });
    } catch (error) {
      console.error("Erro ao excluir ata:", error);
      toast({
        title: "Erro ao excluir ata",
        description: "Não foi possível excluir a ata. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <FilePdf className="h-4 w-4" />;
      case "docx":
        return <FileText className="h-4 w-4" />;
      case "xlsx":
        return <FileSpreadsheet className="h-4 w-4" />;
      case "json":
        return <FileJson className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "pdf":
        return "PDF";
      case "docx":
        return "Word";
      case "xlsx":
        return "Excel";
      case "json":
        return "JSON";
      default:
        return format.toUpperCase();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Atas Exportadas</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie as atas exportadas para a licitação {tender?.title} ({tender?.number}
          ).
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
        <div>
          <Button onClick={() => router.push(`/dashboard/session/${params.id}/export`)}>
            <FileText className="h-4 w-4 mr-2" />
            Nova Exportação
          </Button>
        </div>
      </div>

      {minutes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma ata exportada</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Você ainda não exportou nenhuma ata para esta sessão.
            </p>
            <Button onClick={() => router.push(`/dashboard/session/${params.id}/export`)}>
              Exportar Ata
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {minutes.map((minute) => (
            <Card key={minute.id}>
              <CardContent className="p-0">
                <div className="flex items-center p-6">
                  <div className="mr-4">{getFormatIcon(minute.format)}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{minute.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{getFormatLabel(minute.format)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(minute.created_at), "PPpp", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={minute.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={minute.file_url} download>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(minute.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

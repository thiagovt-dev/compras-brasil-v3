"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  FileIcon as FilePdf,
  FileSpreadsheet,
  FileJson,
  Printer,
  Share2,
  Save,
} from "lucide-react";

export default function ExportSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientSupabaseClient();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportOptions, setExportOptions] = useState({
    includeChat: true,
    includeProposals: true,
    includeDocuments: true,
    includeParticipants: true,
    includeSystemMessages: true,
    includeLots: true,
    includeHeader: true,
    includeFooter: true,
    includeSignature: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      setIsLoading(true);
      try {
        // Fetch tender data
        const { data: tender, error: tenderError } = await supabase
          .from("tenders")
          .select(
            `
            id,
            title,
            number,
            status,
            opening_date,
            agencies (
              name
            ),
            tender_team (
              id,
              role,
              auth.users (
                email
              )
            )
          `
          )
          .eq("id", params.id)
          .single();

        if (tenderError) throw tenderError;

        // Fetch session messages
        const { data: messages, error: messagesError } = await supabase
          .from("session_messages")
          .select("*")
          .eq("tender_id", params.id)
          .order("created_at", { ascending: true });

        if (messagesError) throw messagesError;

        // Fetch proposals
        const { data: proposals, error: proposalsError } = await supabase
          .from("proposals")
          .select(
            `
            id,
            value,
            created_at,
            status,
            lot_id,
            profiles (
              id,
              company_name
            )
          `
          )
          .eq("tender_id", params.id)
          .order("created_at", { ascending: true });

        if (proposalsError) throw proposalsError;

        // Fetch participants
        const { data: participants, error: participantsError } = await supabase
          .from("session_participants")
          .select(
            `
            id,
            role,
            joined_at,
            left_at,
            profiles (
              id,
              company_name,
              full_name
            )
          `
          )
          .eq("tender_id", params.id)
          .order("joined_at", { ascending: true });

        if (participantsError) throw participantsError;

        setSessionData({
          tender,
          messages,
          proposals,
          participants,
        });
      } catch (error) {
        console.error("Error fetching session data:", error);
        toast({
          title: "Erro ao carregar dados da sessão",
          description: "Não foi possível carregar os dados da sessão. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchSessionData();
    }
  }, [params.id, supabase, toast]);

  const handleExportOptionChange = (option: string, checked: boolean) => {
    setExportOptions((prev) => ({
      ...prev,
      [option]: checked,
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/session/${params.id}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: exportFormat,
          options: exportOptions,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao exportar ata da sessão");
      }

      // Se for PDF ou DOCX, precisamos baixar o arquivo
      if (exportFormat === "pdf" || exportFormat === "docx") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ata-sessao-${params.id}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        // Para outros formatos, podemos mostrar o resultado em uma nova aba
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Ata exportada com sucesso",
        description: `A ata da sessão foi exportada no formato ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Error exporting session:", error);
      toast({
        title: "Erro ao exportar ata",
        description: "Não foi possível exportar a ata da sessão. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-[600px] w-full" />
          </div>
          <div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Exportar Ata da Sessão</h1>
        <p className="text-muted-foreground">
          Gere um documento oficial com todos os eventos da sessão de licitação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização da Ata</CardTitle>
              <CardDescription>
                Visualize como a ata será gerada com base nas opções selecionadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="w-full justify-start px-6 pt-2">
                  <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
                  <TabsTrigger value="chat">Mensagens</TabsTrigger>
                  <TabsTrigger value="proposals">Propostas</TabsTrigger>
                  <TabsTrigger value="participants">Participantes</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="p-6 border-t">
                  {sessionData?.tender && (
                    <div className="space-y-6">
                      {exportOptions.includeHeader && (
                        <div className="space-y-2 pb-4 border-b">
                          <h2 className="text-2xl font-bold">{sessionData.tender.title}</h2>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge variant="outline">{sessionData.tender.number}</Badge>
                            <Badge variant="outline">{sessionData.tender.agencies?.name}</Badge>
                            <Badge
                              variant={
                                sessionData.tender.status === "completed"
                                  ? "default"
                                  : sessionData.tender.status === "active"
                                  ? "outline"
                                  : "secondary"
                              }>
                              {sessionData.tender.status === "completed"
                                ? "Concluída"
                                : sessionData.tender.status === "active"
                                ? "Em andamento"
                                : "Aguardando início"}
                            </Badge>
                          </div>
                          <p className="text-[1rem] text-muted-foreground">
                            Data de abertura: {formatDate(sessionData.tender.opening_date)}
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Resumo da Sessão</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-[1rem] font-medium">Pregoeiro</h4>
                            <p className="text-[1rem]">
                              {sessionData.tender.tender_team?.find(
                                (member: any) => member.role === "pregoeiro"
                              )?.auth?.users?.email || "Não definido"}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-[1rem] font-medium">Total de Participantes</h4>
                            <p className="text-[1rem]">{sessionData.participants?.length || 0}</p>
                          </div>
                          <div>
                            <h4 className="text-[1rem] font-medium">Total de Mensagens</h4>
                            <p className="text-[1rem]">{sessionData.messages?.length || 0}</p>
                          </div>
                          <div>
                            <h4 className="text-[1rem] font-medium">Total de Propostas</h4>
                            <p className="text-[1rem]">{sessionData.proposals?.length || 0}</p>
                          </div>
                        </div>
                      </div>

                      {exportOptions.includeChat && sessionData.messages?.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Mensagens da Sessão</h3>
                          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                            {sessionData.messages
                              .slice(0, 10)
                              .map((message: any, index: number) => (
                                <div key={index} className="text-[1rem]">
                                  <span className="font-medium">
                                    {formatDate(message.created_at)}
                                  </span>{" "}
                                  -{" "}
                                  <span className="font-semibold">
                                    {message.sender_name || "Sistema"}:
                                  </span>{" "}
                                  {message.content}
                                </div>
                              ))}
                            {sessionData.messages.length > 10 && (
                              <div className="text-[1rem] text-muted-foreground text-center pt-2">
                                ... mais {sessionData.messages.length - 10} mensagens
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {exportOptions.includeProposals && sessionData.proposals?.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Propostas Recebidas</h3>
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-[1rem]">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="px-4 py-2 text-left">Fornecedor</th>
                                  <th className="px-4 py-2 text-left">Valor</th>
                                  <th className="px-4 py-2 text-left">Data/Hora</th>
                                  <th className="px-4 py-2 text-left">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {sessionData.proposals
                                  .slice(0, 5)
                                  .map((proposal: any, index: number) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2">
                                        {proposal.profiles?.company_name || "Fornecedor"}
                                      </td>
                                      <td className="px-4 py-2">R$ {proposal.value}</td>
                                      <td className="px-4 py-2">
                                        {formatDate(proposal.created_at)}
                                      </td>
                                      <td className="px-4 py-2">
                                        <Badge
                                          variant={
                                            proposal.status === "accepted"
                                              ? "default"
                                              : proposal.status === "rejected"
                                              ? "destructive"
                                              : "outline"
                                          }>
                                          {proposal.status === "accepted"
                                            ? "Aceita"
                                            : proposal.status === "rejected"
                                            ? "Rejeitada"
                                            : "Pendente"}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                            {sessionData.proposals.length > 5 && (
                              <div className="text-[1rem] text-muted-foreground text-center p-2 bg-muted/50">
                                ... mais {sessionData.proposals.length - 5} propostas
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {exportOptions.includeParticipants &&
                        sessionData.participants?.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Participantes da Sessão</h3>
                            <div className="border rounded-md overflow-hidden">
                              <table className="w-full text-[1rem]">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="px-4 py-2 text-left">Nome</th>
                                    <th className="px-4 py-2 text-left">Função</th>
                                    <th className="px-4 py-2 text-left">Entrada</th>
                                    <th className="px-4 py-2 text-left">Saída</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {sessionData.participants
                                    .slice(0, 5)
                                    .map((participant: any, index: number) => (
                                      <tr key={index}>
                                        <td className="px-4 py-2">
                                          {participant.profiles?.company_name ||
                                            participant.profiles?.full_name ||
                                            "Participante"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {participant.role === "auctioneer"
                                            ? "Pregoeiro"
                                            : participant.role === "supplier"
                                            ? "Fornecedor"
                                            : participant.role === "support"
                                            ? "Equipe de Apoio"
                                            : participant.role}
                                        </td>
                                        <td className="px-4 py-2">
                                          {formatDate(participant.joined_at)}
                                        </td>
                                        <td className="px-4 py-2">
                                          {participant.left_at
                                            ? formatDate(participant.left_at)
                                            : "Ainda na sessão"}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                              {sessionData.participants.length > 5 && (
                                <div className="text-[1rem] text-muted-foreground text-center p-2 bg-muted/50">
                                  ... mais {sessionData.participants.length - 5} participantes
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {exportOptions.includeFooter && (
                        <div className="space-y-2 pt-4 border-t mt-6">
                          <p className="text-[1rem] text-muted-foreground">
                            Documento gerado em {new Date().toLocaleString("pt-BR")}
                          </p>
                          {exportOptions.includeSignature && (
                            <div className="pt-8 border-t mt-8">
                              <div className="w-64 mx-auto text-center">
                                <div className="border-b border-dashed border-gray-400 pb-1"></div>
                                <p className="text-[1rem] pt-1">
                                  {sessionData.tender.tender_team?.find(
                                    (member: any) => member.role === "pregoeiro"
                                  )?.auth?.users?.email || "Pregoeiro"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="p-6 border-t">
                  {sessionData?.messages?.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Todas as Mensagens da Sessão</h3>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto border rounded-md p-4">
                        {sessionData.messages.map((message: any, index: number) => (
                          <div key={index} className="text-[1rem]">
                            <span className="font-medium">{formatDate(message.created_at)}</span> -{" "}
                            <span className="font-semibold">
                              {message.sender_name || "Sistema"}:
                            </span>{" "}
                            {message.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Nenhuma mensagem encontrada</h3>
                      <p className="text-[1rem] text-muted-foreground mt-1">
                        Não há mensagens registradas para esta sessão.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="proposals" className="p-6 border-t">
                  {sessionData?.proposals?.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Todas as Propostas Recebidas</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-[1rem]">
                          <thead>
                            <tr className="bg-muted">
                              <th className="px-4 py-2 text-left">Fornecedor</th>
                              <th className="px-4 py-2 text-left">Valor</th>
                              <th className="px-4 py-2 text-left">Data/Hora</th>
                              <th className="px-4 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {sessionData.proposals.map((proposal: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2">
                                  {proposal.profiles?.company_name || "Fornecedor"}
                                </td>
                                <td className="px-4 py-2">R$ {proposal.value}</td>
                                <td className="px-4 py-2">{formatDate(proposal.created_at)}</td>
                                <td className="px-4 py-2">
                                  <Badge
                                    variant={
                                      proposal.status === "accepted"
                                        ? "default"
                                        : proposal.status === "rejected"
                                        ? "destructive"
                                        : "outline"
                                    }>
                                    {proposal.status === "accepted"
                                      ? "Aceita"
                                      : proposal.status === "rejected"
                                      ? "Rejeitada"
                                      : "Pendente"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Nenhuma proposta encontrada</h3>
                      <p className="text-[1rem] text-muted-foreground mt-1">
                        Não há propostas registradas para esta sessão.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="participants" className="p-6 border-t">
                  {sessionData?.participants?.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Todos os Participantes da Sessão</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-[1rem]">
                          <thead>
                            <tr className="bg-muted">
                              <th className="px-4 py-2 text-left">Nome</th>
                              <th className="px-4 py-2 text-left">Função</th>
                              <th className="px-4 py-2 text-left">Entrada</th>
                              <th className="px-4 py-2 text-left">Saída</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {sessionData.participants.map((participant: any, index: number) => (
                              <tr key={index}>
                                <td className="px-4 py-2">
                                  {participant.profiles?.company_name ||
                                    participant.profiles?.full_name ||
                                    "Participante"}
                                </td>
                                <td className="px-4 py-2">
                                  {participant.role === "auctioneer"
                                    ? "Pregoeiro"
                                    : participant.role === "supplier"
                                    ? "Fornecedor"
                                    : participant.role === "support"
                                    ? "Equipe de Apoio"
                                    : participant.role}
                                </td>
                                <td className="px-4 py-2">{formatDate(participant.joined_at)}</td>
                                <td className="px-4 py-2">
                                  {participant.left_at
                                    ? formatDate(participant.left_at)
                                    : "Ainda na sessão"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Nenhum participante encontrado</h3>
                      <p className="text-[1rem] text-muted-foreground mt-1">
                        Não há participantes registrados para esta sessão.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" onClick={() => router.back()}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={handleExport} disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Opções de Exportação</CardTitle>
              <CardDescription>Personalize o conteúdo e formato da ata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[1rem] font-medium">Formato</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={exportFormat === "pdf" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setExportFormat("pdf")}>
                    <FilePdf className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant={exportFormat === "docx" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setExportFormat("docx")}>
                    <FileText className="h-4 w-4 mr-2" />
                    DOCX
                  </Button>
                  <Button
                    variant={exportFormat === "xlsx" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setExportFormat("xlsx")}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    XLSX
                  </Button>
                  <Button
                    variant={exportFormat === "json" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setExportFormat("json")}>
                    <FileJson className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-[1rem] font-medium">Conteúdo</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeChat"
                      checked={exportOptions.includeChat}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeChat", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeChat">Incluir mensagens do chat</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeProposals"
                      checked={exportOptions.includeProposals}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeProposals", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeProposals">Incluir propostas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDocuments"
                      checked={exportOptions.includeDocuments}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeDocuments", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeDocuments">Incluir documentos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeParticipants"
                      checked={exportOptions.includeParticipants}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeParticipants", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeParticipants">Incluir participantes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSystemMessages"
                      checked={exportOptions.includeSystemMessages}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeSystemMessages", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeSystemMessages">Incluir mensagens do sistema</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeLots"
                      checked={exportOptions.includeLots}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeLots", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeLots">Incluir lotes e itens</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-[1rem] font-medium">Formatação</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHeader"
                      checked={exportOptions.includeHeader}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeHeader", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeHeader">Incluir cabeçalho</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeFooter"
                      checked={exportOptions.includeFooter}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeFooter", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeFooter">Incluir rodapé</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSignature"
                      checked={exportOptions.includeSignature}
                      onCheckedChange={(checked) =>
                        handleExportOptionChange("includeSignature", checked as boolean)
                      }
                    />
                    <Label htmlFor="includeSignature">Incluir campo para assinatura</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/dashboard/session/${params.id}`)}>
                <Save className="h-4 w-4 mr-2" />
                Salvar como modelo
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/dashboard/session/${params.id}`)}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

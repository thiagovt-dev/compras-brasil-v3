"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Check,
  X,
  Eye,
  FileText,
  Clock,
  AlertCircle,
  Gavel,
  Play,
  MessageSquare,
  Download,
} from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";

interface Proposal {
  id: string;
  supplier_id: string;
  lot_id: string;
  total_value: number;
  status: string;
  created_at: string;
  supplier: {
    name: string;
    cnpj: string;
  };
  items: ProposalItem[];
  is_mock?: boolean;
}

interface ProposalItem {
  id: string;
  tender_item_id: string;
  unit_price: number;
  total_price: number;
  brand?: string;
  model?: string;
  description?: string;
  tender_item: {
    number: number;
    description: string;
    quantity: number;
    unit: string;
  };
}

// Função para gerar dados mockados
const generateMockTenderData = (tenderId: string) => {
  return {
    id: tenderId,
    title: "Aquisição de Equipamentos de Informática",
    number: "2024/001",
    description:
      "Licitação para aquisição de equipamentos de informática para modernização do parque tecnológico",
    status: "published",
    created_at: new Date().toISOString(),
    is_mock: true,
  };
};

const generateMockLots = (tenderId: string) => {
  return [
    {
      id: "mock-lot-1",
      tender_id: tenderId,
      number: 1,
      description: "Computadores e Notebooks",
      estimated_value: 250000,
      is_mock: true,
    },
    {
      id: "mock-lot-2",
      tender_id: tenderId,
      number: 2,
      description: "Periféricos e Acessórios",
      estimated_value: 75000,
      is_mock: true,
    },
  ];
};

const generateMockProposals = (lotId: string) => {
  const suppliers = [
    { name: "TechSolutions Ltda", cnpj: "12.345.678/0001-90" },
    { name: "InfoComputer S.A.", cnpj: "98.765.432/0001-10" },
    { name: "Digital Systems Corp", cnpj: "11.222.333/0001-44" },
    { name: "CompuWorld Brasil", cnpj: "55.666.777/0001-88" },
    { name: "InfoTech Solutions", cnpj: "33.444.555/0001-66" },
    { name: "Mega Informática Ltda", cnpj: "77.888.999/0001-22" },
    { name: "Prime Technology Corp", cnpj: "44.555.666/0001-77" },
    { name: "Digital Plus Sistemas", cnpj: "88.999.000/0001-33" },
  ];

  const mockItems =
    lotId === "mock-lot-1"
      ? [
          {
            number: 1,
            description: "Computador Desktop Intel Core i5, 8GB RAM, SSD 256GB",
            quantity: 50,
            unit: "unidade",
          },
          {
            number: 2,
            description: "Notebook Intel Core i7, 16GB RAM, SSD 512GB",
            quantity: 25,
            unit: "unidade",
          },
        ]
      : [
          {
            number: 3,
            description: "Mouse Óptico USB",
            quantity: 100,
            unit: "unidade",
          },
          {
            number: 4,
            description: "Teclado ABNT2 USB",
            quantity: 100,
            unit: "unidade",
          },
        ];

  return suppliers
    .map((supplier, index) => {
      const baseValue = lotId === "mock-lot-1" ? 200000 : 60000;
      const variation = (Math.random() - 0.5) * 0.3; // Variação de ±15% para mais diversidade
      const totalValue = baseValue * (1 + variation);

      const createdDate = new Date();
      createdDate.setHours(createdDate.getHours() - Math.floor(Math.random() * 72)); // Até 3 dias atrás

      const items = mockItems.map((item, itemIndex) => {
        const unitPrice = totalValue / (mockItems.length * item.quantity);
        return {
          id: `mock-item-${lotId}-${index}-${itemIndex}`,
          tender_item_id: `mock-tender-item-${itemIndex}`,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity,
          brand: ["Dell", "HP", "Lenovo", "Acer", "Samsung", "LG", "Asus", "MSI"][
            Math.floor(Math.random() * 8)
          ],
          model: `Modelo ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(
            Math.random() * 1000
          )}`,
          description: `Especificação detalhada do ${item.description.toLowerCase()}`,
          tender_item: item,
        };
      });

      return {
        id: `mock-proposal-${lotId}-${index}`,
        supplier_id: `mock-supplier-${index}`,
        lot_id: lotId,
        total_value: totalValue,
        status: "classified", // Todos começam como "submitted" para permitir classificação
        created_at: createdDate.toISOString(),
        supplier: supplier,
        items: items,
        is_mock: true,
      };
    })
    .sort((a, b) => a.total_value - b.total_value); // Ordenar por valor crescente
};

export default function TenderProposalsPage() {
  const params = useParams();
  const tenderId = params.id as string;
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();

  const [tender, setTender] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Record<string, Proposal[]>>({});
  const [selectedLot, setSelectedLot] = useState<string>("");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"classify" | "declassify" | "view" | "negotiate">(
    "view"
  );
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    fetchTenderData();
  }, [tenderId]);

  const fetchTenderData = async () => {
    try {
      setIsLoading(true);

      // Buscar dados da licitação
      const { data: tenderData, error: tenderError } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", tenderId)
        .single();

      let currentTender = tenderData;
      let currentLots: any[] = [];
      let mockDataUsed = false;

      if (tenderError || !tenderData) {
        console.log("Dados reais não encontrados, usando dados mockados");
        currentTender = generateMockTenderData(tenderId);
        mockDataUsed = true;
      }

      setTender(currentTender);

      // Buscar lotes
      if (!mockDataUsed) {
        const { data: lotsData, error: lotsError } = await supabase
          .from("tender_lots")
          .select("*")
          .eq("tender_id", tenderId)
          .order("number", { ascending: true });

        if (lotsError || !lotsData || lotsData.length === 0) {
          console.log("Lotes reais não encontrados, usando dados mockados");
          currentLots = generateMockLots(tenderId);
          mockDataUsed = true;
        } else {
          currentLots = lotsData;
        }
      } else {
        currentLots = generateMockLots(tenderId);
      }

      setLots(currentLots);
      setUsingMockData(mockDataUsed);

      if (currentLots && currentLots.length > 0) {
        setSelectedLot(currentLots[0].id);
        await fetchProposals(currentLots[0].id, mockDataUsed);
      }

      // Toast informativo se usando dados mockados
      if (mockDataUsed) {
        toast({
          title: "Modo Demonstração",
          description: "Exibindo dados de exemplo para demonstração das funcionalidades.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);

      // Fallback para dados mockados em caso de erro
      console.log("Erro ao conectar, usando dados mockados");
      const mockTender = generateMockTenderData(tenderId);
      const mockLots = generateMockLots(tenderId);

      setTender(mockTender);
      setLots(mockLots);
      setUsingMockData(true);

      if (mockLots.length > 0) {
        setSelectedLot(mockLots[0].id);
        await fetchProposals(mockLots[0].id, true);
      }

      toast({
        title: "Erro de Conexão",
        description: "Exibindo dados de exemplo. Verifique sua conexão com a internet.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProposals = async (lotId: string, useMockData = false) => {
    try {
      if (useMockData || usingMockData) {
        // Usar dados mockados
        const mockProposals = generateMockProposals(lotId);
        setProposals((prev) => ({
          ...prev,
          [lotId]: mockProposals,
        }));
        return;
      }

      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
          *,
          supplier:profiles!supplier_id(name, cnpj),
          items:proposal_items(
            *,
            tender_item:tender_items(*)
          )
        `
        )
        .eq("tender_id", tenderId)
        .eq("lot_id", lotId)
        .order("total_value", { ascending: true });

      if (error) throw error;

      // Se não há propostas reais, usar dados mockados
      if (!data || data.length === 0) {
        console.log(`Nenhuma proposta real encontrada para lote ${lotId}, usando dados mockados`);
        const mockProposals = generateMockProposals(lotId);
        setProposals((prev) => ({
          ...prev,
          [lotId]: mockProposals,
        }));
        setUsingMockData(true);
      } else {
        setProposals((prev) => ({
          ...prev,
          [lotId]: data || [],
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar propostas:", error);

      // Fallback para dados mockados
      console.log("Erro ao carregar propostas, usando dados mockados");
      const mockProposals = generateMockProposals(lotId);
      setProposals((prev) => ({
        ...prev,
        [lotId]: mockProposals,
      }));
      setUsingMockData(true);
    }
  };

  const handleLotChange = async (lotId: string) => {
    setSelectedLot(lotId);
    if (!proposals[lotId]) {
      await fetchProposals(lotId, usingMockData);
    }
  };

  const handleProposalAction = (proposal: Proposal, action: typeof actionType) => {
    setSelectedProposal(proposal);
    setActionType(action);
    setJustification("");
    setIsDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedProposal) return;

    // Se estiver usando dados mockados, simular a ação
    if (selectedProposal.is_mock || usingMockData) {
      setIsSubmitting(true);

      // Simular delay de processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let message = "";
      let newStatus = selectedProposal.status;

      switch (actionType) {
        case "classify":
          message = "Proposta classificada com sucesso (simulação)";
          newStatus = "classified";
          break;
        case "declassify":
          if (!justification.trim()) {
            toast({
              title: "Erro",
              description: "Justificativa é obrigatória para desclassificar.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          message = "Proposta desclassificada com sucesso (simulação)";
          newStatus = "disqualified";
          break;
        case "negotiate":
          message = "Negociação iniciada com sucesso (simulação)";
          newStatus = "in_negotiation";
          break;
      }

      // Atualizar o status localmente para simulação
      setProposals((prev) => ({
        ...prev,
        [selectedLot]: prev[selectedLot].map((p) =>
          p.id === selectedProposal.id ? { ...p, status: newStatus } : p
        ),
      }));

      toast({
        title: "Simulação",
        description: message,
        duration: 3000,
      });

      setIsSubmitting(false);
      setIsDialogOpen(false);
      return;
    }

    // Código original para dados reais
    try {
      setIsSubmitting(true);

      let updateData: any = {};
      let systemMessage = "";

      switch (actionType) {
        case "classify":
          updateData = { status: "classified" };
          systemMessage = `Proposta do fornecedor ${selectedProposal.supplier.name} foi classificada.`;
          break;
        case "declassify":
          if (!justification.trim()) {
            toast({
              title: "Erro",
              description: "Justificativa é obrigatória para desclassificar.",
              variant: "destructive",
            });
            return;
          }
          updateData = {
            status: "disqualified",
            disqualification_reason: justification,
          };
          systemMessage = `Proposta do fornecedor ${selectedProposal.supplier.name} foi desclassificada. Justificativa: ${justification}`;
          break;
        case "negotiate":
          updateData = { status: "in_negotiation" };
          systemMessage = `Iniciada negociação com o fornecedor ${selectedProposal.supplier.name}.`;
          break;
      }

      // Atualizar proposta
      const { error: updateError } = await supabase
        .from("proposals")
        .update(updateData)
        .eq("id", selectedProposal.id);

      if (updateError) throw updateError;

      // Adicionar mensagem do sistema
      const { error: messageError } = await supabase.from("session_messages").insert({
        tender_id: tenderId,
        user_id: user?.id,
        content: systemMessage,
        type: "system",
      });

      if (messageError) throw messageError;

      toast({
        title: "Sucesso",
        description: "Ação executada com sucesso.",
      });

      // Recarregar propostas
      await fetchProposals(selectedLot);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao executar ação:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao executar a ação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      submitted: { label: "Enviada", variant: "default", icon: Clock },
      classified: { label: "Classificada", variant: "success", icon: Check },
      disqualified: { label: "Desclassificada", variant: "destructive", icon: X },
      in_negotiation: { label: "Em Negociação", variant: "warning", icon: MessageSquare },
      winner: { label: "Vencedora", variant: "success", icon: Gavel },
    };

    const config = statusConfig[status] || { label: status, variant: "outline", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium">
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8 space-y-8">
      {/* Indicador de dados mockados */}
      {usingMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-base text-amber-800">
            <strong>Modo Demonstração:</strong> Exibindo dados de exemplo para demonstração das
            funcionalidades. As ações executadas são simuladas.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Gerenciar Propostas</h1>
          <p className="text-lg text-muted-foreground">
            {tender?.title} - Nº {tender?.number}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" disabled={usingMockData}>
            <Download className="h-5 w-5 mr-2" />
            Exportar
          </Button>
          <Button size="lg" disabled={usingMockData}>
            <Play className="h-5 w-5 mr-2" />
            Iniciar Sessão
          </Button>
        </div>
      </div>

      <Tabs value={selectedLot} onValueChange={handleLotChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          {lots.map((lot) => (
            <TabsTrigger key={lot.id} value={lot.id} className="text-base font-medium">
              Lote {lot.number}
              {proposals[lot.id] && (
                <Badge variant="secondary" className="ml-2 text-sm">
                  {proposals[lot.id].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {lots.map((lot) => (
          <TabsContent key={lot.id} value={lot.id} className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">
                  Lote {lot.number}: {lot.description}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proposals[lot.id]?.length > 0 ? (
                  <div className="w-full overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="h-14">
                          <TableHead className="text-base font-semibold">Fornecedor</TableHead>
                          <TableHead className="text-base font-semibold">CNPJ</TableHead>
                          <TableHead className="text-base font-semibold">Valor Total</TableHead>
                          <TableHead className="text-base font-semibold">Data Envio</TableHead>
                          <TableHead className="text-base font-semibold">Status</TableHead>
                          <TableHead className="text-right text-base font-semibold">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proposals[lot.id].map((proposal, index) => (
                          <TableRow key={proposal.id} className="h-16 hover:bg-muted/50">
                            <TableCell className="font-medium text-base py-4">{`Fornecedor ${
                              index + 1
                            }`}</TableCell>
                            <TableCell className="text-base py-4">
                              {proposal.supplier.cnpj}
                            </TableCell>
                            <TableCell className="text-base font-semibold py-4">
                              {formatCurrency(proposal.total_value)}
                            </TableCell>
                            <TableCell className="text-base py-4">
                              {formatDate(proposal.created_at)}
                            </TableCell>
                            <TableCell className="py-4">
                              {getStatusBadge(proposal.status)}
                            </TableCell>
                            <TableCell className="text-right py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="default"
                                  onClick={() => handleProposalAction(proposal, "view")}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {proposal.status === "submitted" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="default"
                                      onClick={() => handleProposalAction(proposal, "classify")}
                                      className="text-green-600 border-green-600 hover:bg-green-50">
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="default"
                                      onClick={() => handleProposalAction(proposal, "declassify")}
                                      className="text-red-600 border-red-600 hover:bg-red-50">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {proposal.status === "classified" && (
                                  <Button
                                    variant="outline"
                                    size="default"
                                    onClick={() => handleProposalAction(proposal, "declassify")}
                                    className="text-red-600 border-red-600 hover:bg-red-50">
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-6 opacity-50" />
                    <p className="text-lg">Nenhuma proposta recebida para este lote.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog para ações */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {actionType === "view" && "Detalhes da Proposta"}
              {actionType === "classify" && "Classificar Proposta"}
              {actionType === "declassify" && "Desclassificar Proposta"}
              {actionType === "negotiate" && "Iniciar Negociação"}
            </DialogTitle>
            <DialogDescription className="text-base">
              Fornecedor:{" "}
              {selectedProposal
                ? `Fornecedor ${
                    proposals[selectedProposal.lot_id]?.findIndex(
                      (p) => p.id === selectedProposal.id
                    ) + 1
                  }`
                : ""}{" "}
              {(selectedProposal?.is_mock || usingMockData) && " (Dados de exemplo)"}
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                  <p className="text-xl font-semibold">
                    {formatCurrency(selectedProposal.total_value)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status Atual</Label>
                  <div className="mt-1">{getStatusBadge(selectedProposal.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data de Envio</Label>
                  <p className="text-base">{formatDate(selectedProposal.created_at)}</p>
                </div>
              </div>

              <div>
                <Label className="text-xl font-medium mb-4 block">Itens da Proposta</Label>
                <div className="space-y-4">
                  {selectedProposal.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-base">
                              Item {item.tender_item.number}: {item.tender_item.description}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Quantidade: {item.tender_item.quantity} {item.tender_item.unit}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Preço Unitário
                              </Label>
                              <p className="font-semibold text-base">
                                {formatCurrency(item.unit_price)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Valor Total</Label>
                              <p className="font-semibold text-base">
                                {formatCurrency(item.total_price)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {(item.brand || item.model || item.description) && (
                          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.brand && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Marca</Label>
                                <p className="text-base">{item.brand}</p>
                              </div>
                            )}
                            {item.model && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Modelo</Label>
                                <p className="text-base">{item.model}</p>
                              </div>
                            )}
                            {item.description && (
                              <div className="md:col-span-2">
                                <Label className="text-sm text-muted-foreground">
                                  Descrição Detalhada
                                </Label>
                                <p className="whitespace-pre-line text-base">{item.description}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {actionType === "declassify" && (
                <div>
                  <Label htmlFor="justification" className="text-base font-medium">
                    Justificativa *
                  </Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Digite a justificativa para desclassificação..."
                    className="mt-2 text-base"
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {actionType !== "view" && (
              <Button
                onClick={executeAction}
                disabled={isSubmitting || (actionType === "declassify" && !justification.trim())}
                size="lg"
                className={
                  actionType === "declassify"
                    ? "bg-red-600 hover:bg-red-700"
                    : actionType === "classify"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }>
                {isSubmitting
                  ? "Processando..."
                  : actionType === "declassify"
                  ? "Desclassificar"
                  : actionType === "classify"
                  ? "Classificar"
                  : "Confirmar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

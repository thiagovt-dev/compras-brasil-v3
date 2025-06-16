"use client";

import type React from "react";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  Upload,
  FileText,
  Save,
  Send,
  Calculator,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock data
const mockTender = {
  id: "1",
  title: "Aquisição de equipamentos de informática",
  number: "Pregão Eletrônico nº 001/2025",
  status: "Publicada",
  closingDate: "2025-06-19T17:00:00",
  openingDate: "2025-06-20T10:00:00",
  exclusiveMeEpp: true,
  lots: [
    {
      id: "1",
      number: 1,
      description: "Computadores Desktop",
      items: [
        {
          id: "1",
          number: 1,
          description: "Computador Desktop Intel Core i5, 8GB RAM, 256GB SSD",
          quantity: 50,
          unit: "unidade",
          requiresBrand: true,
          allowDescriptionChange: false,
        },
        {
          id: "2",
          number: 2,
          description: "Monitor LED 24 polegadas Full HD",
          quantity: 50,
          unit: "unidade",
          requiresBrand: true,
          allowDescriptionChange: false,
        },
      ],
    },
  ],
};

interface ProposalItem {
  itemId: string;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
  model?: string;
  description?: string;
}

interface ProposalData {
  items: ProposalItem[];
  declarations: {
    meEpp: boolean;
    compliance: boolean;
    authenticity: boolean;
    responsibility: boolean;
  };
  documents: File[];
}

export default function SupplierProposalPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;

  const [tender] = useState(mockTender);
  const [activeTab, setActiveTab] = useState("items");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const [proposalData, setProposalData] = useState<ProposalData>({
    items: tender.lots[0].items.map((item) => ({
      itemId: item.id,
      unitPrice: 0,
      totalPrice: 0,
      brand: "",
      model: "",
      description: item.description,
    })),
    declarations: {
      meEpp: false,
      compliance: false,
      authenticity: false,
      responsibility: false,
    },
    documents: [],
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const updateItemPrice = (itemId: string, unitPrice: number) => {
    const item = tender.lots[0].items.find((i) => i.id === itemId);
    if (!item) return;

    const totalPrice = unitPrice * item.quantity;

    setProposalData((prev) => ({
      ...prev,
      items: prev.items.map((proposalItem) =>
        proposalItem.itemId === itemId ? { ...proposalItem, unitPrice, totalPrice } : proposalItem
      ),
    }));
  };

  const updateItemField = (itemId: string, field: string, value: string) => {
    setProposalData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.itemId === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateDeclaration = (field: string, value: boolean) => {
    setProposalData((prev) => ({
      ...prev,
      declarations: {
        ...prev.declarations,
        [field]: value,
      },
    }));
  };

  const getTotalProposalValue = () => {
    return proposalData.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const isProposalValid = () => {
    const hasAllPrices = proposalData.items.every((item) => item.unitPrice > 0);
    const hasAllDeclarations = Object.values(proposalData.declarations).every(Boolean);
    const hasRequiredBrands = proposalData.items.every((item) => {
      const tenderItem = tender.lots[0].items.find((ti) => ti.id === item.itemId);
      return !tenderItem?.requiresBrand || (item.brand && item.model);
    });

    return hasAllPrices && hasAllDeclarations && hasRequiredBrands;
  };

  const isDeadlinePassed = () => {
    return new Date() > new Date(tender.closingDate);
  };

  const handleSaveDraft = async () => {
    setIsDraft(true);
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Rascunho salvo",
      description: "Sua proposta foi salva como rascunho.",
    });
    setIsDraft(false);
  };

  const handleSubmitProposal = async () => {
    if (!isProposalValid()) {
      toast({
        title: "Proposta incompleta",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (isDeadlinePassed()) {
      toast({
        title: "Prazo encerrado",
        description: "O prazo para envio de propostas já foi encerrado.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    // Simular envio
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Proposta enviada",
      description: "Sua proposta foi enviada com sucesso!",
    });

    router.push("/dashboard/supplier/my-tenders");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setProposalData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...files],
    }));
  };

  const removeDocument = (index: number) => {
    setProposalData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enviar Proposta</h1>
          <p className="text-lg text-gray-600">
            {tender.title} - {tender.number}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Prazo para Propostas</p>
                  <p className="text-sm text-gray-600">{formatDate(tender.closingDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Valor Total</p>
                  <p className="text-sm text-gray-600">{formatCurrency(getTotalProposalValue())}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {isProposalValid() ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <p className="text-sm text-gray-600">
                    {isProposalValid() ? "Pronta para envio" : "Incompleta"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isDeadlinePassed() && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O prazo para envio de propostas foi encerrado em {formatDate(tender.closingDate)}.
            </AlertDescription>
          </Alert>
        )}

        {tender.exclusiveMeEpp && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta licitação é exclusiva para Microempresas e Empresas de Pequeno Porte (ME/EPP).
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Itens e Preços</TabsTrigger>
          <TabsTrigger value="declarations">Declarações</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lote 1: {tender.lots[0].description}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {tender.lots[0].items.map((item, index) => {
                const proposalItem = proposalData.items.find((pi) => pi.itemId === item.id);
                if (!proposalItem) return null;

                return (
                  <div key={item.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          Item {item.number}: {item.description}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Quantidade: {item.quantity} {item.unit}
                        </p>
                      </div>
                      <Badge variant="outline">{formatCurrency(proposalItem.totalPrice)}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`price-${item.id}`}>Preço Unitário *</Label>
                        <Input
                          id={`price-${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={proposalItem.unitPrice || ""}
                          onChange={(e) =>
                            updateItemPrice(item.id, Number.parseFloat(e.target.value) || 0)
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Valor Total</Label>
                        <div className="mt-1 p-2 bg-gray-50 border rounded-md">
                          {formatCurrency(proposalItem.totalPrice)}
                        </div>
                      </div>
                    </div>

                    {item.requiresBrand && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`brand-${item.id}`}>Marca *</Label>
                          <Input
                            id={`brand-${item.id}`}
                            placeholder="Digite a marca"
                            value={proposalItem.brand || ""}
                            onChange={(e) => updateItemField(item.id, "brand", e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`model-${item.id}`}>Modelo *</Label>
                          <Input
                            id={`model-${item.id}`}
                            placeholder="Digite o modelo"
                            value={proposalItem.model || ""}
                            onChange={(e) => updateItemField(item.id, "model", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    {item.allowDescriptionChange && (
                      <div>
                        <Label htmlFor={`description-${item.id}`}>Descrição Detalhada</Label>
                        <Textarea
                          id={`description-${item.id}`}
                          placeholder="Descreva detalhadamente o produto ofertado"
                          value={proposalItem.description || ""}
                          onChange={(e) => updateItemField(item.id, "description", e.target.value)}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-900">Valor Total da Proposta:</span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatCurrency(getTotalProposalValue())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="declarations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Declarações Obrigatórias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {tender.exclusiveMeEpp && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="me-epp"
                    checked={proposalData.declarations.meEpp}
                    onCheckedChange={(checked) => updateDeclaration("meEpp", checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="me-epp" className="text-sm font-medium leading-none">
                      Declaração de Microempresa ou Empresa de Pequeno Porte
                    </Label>
                    <p className="text-sm text-gray-600">
                      Declaro que a empresa se enquadra na condição de microempresa ou empresa de
                      pequeno porte, nos termos da Lei Complementar nº 123/2006.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="compliance"
                  checked={proposalData.declarations.compliance}
                  onCheckedChange={(checked) => updateDeclaration("compliance", checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="compliance" className="text-sm font-medium leading-none">
                    Declaração de Cumprimento dos Requisitos
                  </Label>
                  <p className="text-sm text-gray-600">
                    Declaro que cumpro plenamente os requisitos de habilitação e que minha proposta
                    está em conformidade com as exigências do edital.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="authenticity"
                  checked={proposalData.declarations.authenticity}
                  onCheckedChange={(checked) =>
                    updateDeclaration("authenticity", checked as boolean)
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="authenticity" className="text-sm font-medium leading-none">
                    Declaração de Autenticidade
                  </Label>
                  <p className="text-sm text-gray-600">
                    Declaro que todas as informações prestadas são verdadeiras e que tenho ciência
                    das penalidades cabíveis em caso de declaração falsa.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="responsibility"
                  checked={proposalData.declarations.responsibility}
                  onCheckedChange={(checked) =>
                    updateDeclaration("responsibility", checked as boolean)
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="responsibility" className="text-sm font-medium leading-none">
                    Declaração de Responsabilidade
                  </Label>
                  <p className="text-sm text-gray-600">
                    Declaro que assumo total responsabilidade pela execução do objeto licitado,
                    conforme especificações do edital e proposta apresentada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos de Habilitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Envie seus documentos</h3>
                <p className="text-gray-600 mb-4">Selecione os arquivos ou arraste e solte aqui</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Selecionar Arquivos
                  </Button>
                </Label>
                <p className="text-sm text-gray-500 mt-2">
                  Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB cada)
                </p>
              </div>

              {proposalData.documents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Documentos Enviados</h4>
                  {proposalData.documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Os documentos de habilitação são obrigatórios e devem estar atualizados conforme
                  exigências do edital.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isDraft || isDeadlinePassed()}>
          {isDraft ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </>
          )}
        </Button>

        <Button
          onClick={handleSubmitProposal}
          disabled={!isProposalValid() || isSubmitting || isDeadlinePassed()}
          className="bg-green-600 hover:bg-green-700">
          {isSubmitting ? (
            <>
              <Send className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar Proposta
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

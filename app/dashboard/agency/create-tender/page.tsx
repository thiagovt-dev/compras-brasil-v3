"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Upload, Save, Loader2, Clock } from "lucide-react";
import { StepProgress } from "@/components/step-progress";
import { DocumentList } from "@/components/document-list";
import { FileUploadField } from "@/components/file-upload-field";
import { useAuth } from "@/lib/supabase/auth-context";
import { toast } from "@/components/ui/use-toast";

export default function CreateTenderPage() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    agency_id: "", // Movido para o topo
    modality: "",
    category: "",
    editalTitle: "",
    editalNumber: "",
    processNumber: "",
    judgmentCriteria: "",
    disputeMode: "",
    priceDecimals: "2",
    valueBetweenBids: "",
    secretValue: false,
    impugnationDate: undefined as Date | undefined,
    impugnationTime: "17:00", // Novo campo para horário
    proposalDate: undefined as Date | undefined,
    proposalTime: "17:00", // Novo campo para horário
    openingDate: undefined as Date | undefined,
    openingTime: "09:00", // Novo campo para horário
    documentationMode: "winner",
    phaseInversion: false,
    segments: [],
    object: "",
    team: {
      auctioneer: "",
      authority: "",
      supportTeam: [""],
    },
    groups: [
      // Renomeado de 'lots' para 'groups'
      {
        id: 1,
        description: "",
        type: "products",
        requireBrand: false,
        allowDescriptionChange: true,
        items: [
          {
            id: 1,
            description: "",
            quantity: "",
            unit: "",
            unitPrice: "",
            benefitType: "",
          },
        ],
      },
    ],
    documents: [] as {
      name: string;
      file: File | null;
      document_id?: string;
      file_path?: string;
    }[],
  });

  // Fetch agencies and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch agencies
        const { data: agenciesData, error: agenciesError } = await supabase
          .from("agencies")
          .select("*");

        if (agenciesError) throw agenciesError;

        setAgencies(agenciesData || []);

        // Fetch users (for team selection)
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("*")
          .in("profile_type", ["agency", "admin"]);

        if (usersError) throw usersError;

        setUsers(usersData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Erro ao carregar dados",
          description: error.message || "Ocorreu um erro ao carregar os dados necessários.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTeamChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      team: { ...formData.team, [field]: value },
    });
  };

  const handleSupportTeamChange = (index: number, value: string) => {
    const newSupportTeam = [...formData.team.supportTeam];
    newSupportTeam[index] = value;
    setFormData({
      ...formData,
      team: { ...formData.team, supportTeam: newSupportTeam },
    });
  };

  const addSupportTeamMember = () => {
    setFormData({
      ...formData,
      team: {
        ...formData.team,
        supportTeam: [...formData.team.supportTeam, ""],
      },
    });
  };

  const removeSupportTeamMember = (index: number) => {
    const newSupportTeam = [...formData.team.supportTeam];
    newSupportTeam.splice(index, 1);
    setFormData({
      ...formData,
      team: { ...formData.team, supportTeam: newSupportTeam },
    });
  };

  const handleGroupChange = (groupIndex: number, field: string, value: any) => {
    const newGroups = [...formData.groups];
    newGroups[groupIndex] = { ...newGroups[groupIndex], [field]: value };
    setFormData({ ...formData, groups: newGroups });
  };

  const handleItemChange = (groupIndex: number, itemIndex: number, field: string, value: any) => {
    const newGroups = [...formData.groups];
    newGroups[groupIndex].items[itemIndex] = {
      ...newGroups[groupIndex].items[itemIndex],
      [field]: value,
    };
    setFormData({ ...formData, groups: newGroups });
  };

  const addGroup = () => {
    const newGroupId =
      formData.groups.length > 0 ? Math.max(...formData.groups.map((group) => group.id)) + 1 : 1;

    setFormData({
      ...formData,
      groups: [
        ...formData.groups,
        {
          id: newGroupId,
          description: "",
          type: "products",
          requireBrand: false,
          allowDescriptionChange: true,
          items: [
            {
              id: 1,
              description: "",
              quantity: "",
              unit: "",
              unitPrice: "",
              benefitType: "open",
            },
          ],
        },
      ],
    });
  };

  const removeGroup = (index: number) => {
    const newGroups = [...formData.groups];
    newGroups.splice(index, 1);
    setFormData({ ...formData, groups: newGroups });
  };

  const addItem = (groupIndex: number) => {
    const newGroups = [...formData.groups];
    const newItemId =
      newGroups[groupIndex].items.length > 0
        ? Math.max(...newGroups[groupIndex].items.map((item) => item.id)) + 1
        : 1;

    newGroups[groupIndex].items.push({
      id: newItemId,
      description: "",
      quantity: "",
      unit: "",
      unitPrice: "",
      benefitType: "",
    });

    setFormData({ ...formData, groups: newGroups });
  };

  const removeItem = (groupIndex: number, itemIndex: number) => {
    const newGroups = [...formData.groups];
    newGroups[groupIndex].items.splice(itemIndex, 1);
    setFormData({ ...formData, groups: newGroups });
  };

  const handleDocumentNameChange = (index: number, name: string) => {
    const newDocuments = [...formData.documents];
    newDocuments[index] = { ...newDocuments[index], name };
    setFormData({ ...formData, documents: newDocuments });
  };

  const addDocument = () => {
    setFormData({
      ...formData,
      documents: [...formData.documents, { name: "", file: null }],
    });
  };

  const removeDocument = (index: number) => {
    const newDocuments = [...formData.documents];
    newDocuments.splice(index, 1);
    setFormData({ ...formData, documents: newDocuments });
  };

  const handleFileUploadComplete = (index: number, fileData: any) => {
    const newDocuments = [...formData.documents];
    newDocuments[index] = {
      ...newDocuments[index],
      document_id: fileData.document?.id,
      file_path: fileData.filePath,
    };
    setFormData({ ...formData, documents: newDocuments });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Submitting form data:", formData);
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        router.push("/login");
        return;
      }
      console.log("User ID:", user.id);
      // Combinar data e horário para criar datetime completo
      const impugnationDateTime =
        formData.impugnationDate && formData.impugnationTime
          ? new Date(
              `${format(formData.impugnationDate, "yyyy-MM-dd")}T${formData.impugnationTime}:00`
            )
          : null;

      const proposalDateTime =
        formData.proposalDate && formData.proposalTime
          ? new Date(`${format(formData.proposalDate, "yyyy-MM-dd")}T${formData.proposalTime}:00`)
          : null;

      const openingDateTime =
        formData.openingDate && formData.openingTime
          ? new Date(`${format(formData.openingDate, "yyyy-MM-dd")}T${formData.openingTime}:00`)
          : null;

      // Create tender in Supabase
      // Mapear o valor de formData.modality para o valor aceito na coluna tender_type
      const tenderTypeMap: { [key: string]: string } = {
        "pregao-eletronico": "pregao_eletronico",
        "concorrencia-eletronica": "concorrencia",
        "dispensa-eletronica": "tomada_de_precos",
      };

      console.log("Opening date and time:", openingDateTime);

      const { data: tenderData, error: tenderError } = await supabase
        .from("tenders")
        .insert({
          title: formData.editalTitle,
          description: formData.object,
          tender_number: formData.editalNumber,
          tender_type: tenderTypeMap[formData.modality] || formData.modality,
          agency_id: formData.agency_id,
          opening_date: openingDateTime,
          closing_date: proposalDateTime,
          status: "published",
          created_by: user.id,
        })
        .select()
        .single();

      console.log("Tender data:", tenderData);
      if (tenderError) console.log("Error creating tender:", tenderError);
      if (tenderError) throw tenderError;

      // Create groups (anteriormente lots)
      for (const group of formData.groups) {
        const { data: groupData, error: groupError } = await supabase
          .from("tender_lots")
          .insert({
            tender_id: tenderData.id,
            number: group.id,
            description: group.description,
            type: group.type,
            require_brand: group.requireBrand,
            allow_description_change: group.allowDescriptionChange,
            status: "active",
          })
          .select()
          .single();

        if (groupError) throw groupError;

        console.log("Group data:", groupData);

        // Create items for this group
        for (const item of group.items) {
          const { error: itemError } = await supabase.from("tender_items").insert({
            lot_id: groupData.id,
            tender_id: tenderData.id,
            item_number: item.id,
            description: item.description,
            quantity: Number.parseFloat(item.quantity) || 0,
            unit: item.unit,
            estimated_unit_price: Number.parseFloat(item.unitPrice) || 0,
            benefit_type: item.benefitType,
          });

          console.log("Item data:", item);
          if (itemError) throw itemError;
        }
      }

      // Link documents to the tender
      for (const doc of formData.documents) {
        if (doc.document_id) {
          const { error: docUpdateError } = await supabase
            .from("documents")
            .update({
              entity_id: tenderData.id,
              entity_type: "tender",
            })
            .eq("id", doc.document_id);

          if (docUpdateError) throw docUpdateError;
        }
        console.log("Document data:", doc);
      }

      toast({
        title: "Licitação criada com sucesso",
        description: "A licitação foi criada e está em modo de rascunho.",
      });

      // Redirect to the active tenders page
      setTimeout(() => {
        router.push("/dashboard/agency/active-tenders");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating tender:", error);
      toast({
        title: "Erro ao criar licitação",
        description: error.message || "Ocorreu um erro ao criar a licitação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Criar Nova Licitação</h1>
        <p className="text-muted-foreground">
          Preencha os dados para criar um novo processo licitatório
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Licitação - Etapa {currentStep} de 4</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Informações básicas da licitação"}
            {currentStep === 2 && "Equipe responsável pelo processo"}
            {currentStep === 3 && "Grupos e itens da licitação"}
            {currentStep === 4 && "Documentos e publicação"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <StepProgress
              steps={["Informações Básicas", "Equipe", "Grupos e Itens", "Documentos"]}
              currentStep={currentStep}
            />
          </div>
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* ÓRGÃO EM EVIDÊNCIA - MOVIDO PARA O TOPO */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-primary">Órgão Responsável</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="agency_id" className="text-base font-medium">
                        Órgão *
                      </Label>
                      <Select
                        value={formData.agency_id}
                        onValueChange={(value) => handleChange("agency_id", value)}>
                        <SelectTrigger id="agency_id" className="h-12">
                          <SelectValue placeholder="Selecione o órgão responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map((agency) => (
                            <SelectItem key={agency.id} value={agency.id}>
                              {agency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="modality">Modalidade</Label>
                    <Select
                      value={formData.modality}
                      onValueChange={(value) => handleChange("modality", value)}>
                      <SelectTrigger id="modality">
                        <SelectValue placeholder="Selecione a modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pregao-eletronico">Pregão Eletrônico</SelectItem>
                        <SelectItem value="concorrencia-eletronica">
                          Concorrência Eletrônica
                        </SelectItem>
                        <SelectItem value="dispensa-eletronica">Dispensa Eletrônica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleChange("category", value)}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.modality === "pregao-eletronico" && (
                          <>
                            <SelectItem value="aquisicao-bens">Aquisição de bens</SelectItem>
                            <SelectItem value="servicos-comuns">Serviços comuns</SelectItem>
                            <SelectItem value="servicos-comuns-engenharia">
                              Serviços comuns de engenharia
                            </SelectItem>
                          </>
                        )}
                        {formData.modality === "concorrencia-eletronica" && (
                          <>
                            <SelectItem value="aquisicao-bens-especiais">
                              Aquisição de bens especiais
                            </SelectItem>
                            <SelectItem value="servicos-especiais">Serviços especiais</SelectItem>
                            <SelectItem value="obras">Obras</SelectItem>
                            <SelectItem value="servicos-especiais-engenharia">
                              Serviços especiais de engenharia
                            </SelectItem>
                            <SelectItem value="servicos-comuns-engenharia">
                              Serviços comuns de engenharia
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editalNumber">Titulo do Edital</Label>
                    <Input
                      id="editalTitle"
                      value={formData.editalTitle}
                      onChange={(e) => handleChange("editalTitle", e.target.value)}
                      placeholder="Ex:Edital de Pregão Eletrônico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editalNumber">Número do Edital</Label>
                    <Input
                      id="editalNumber"
                      value={formData.editalNumber}
                      onChange={(e) => handleChange("editalNumber", e.target.value)}
                      placeholder="Ex: 001/2025"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processNumber">Número do Processo</Label>
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
                    <Label htmlFor="judgmentCriteria">Critério de Julgamento</Label>
                    <Select
                      value={formData.judgmentCriteria}
                      onValueChange={(value) => handleChange("judgmentCriteria", value)}>
                      <SelectTrigger id="judgmentCriteria">
                        <SelectValue placeholder="Selecione o critério" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.modality === "pregao-eletronico" ||
                          formData.modality === "dispensa-eletronica") && (
                          <>
                            <SelectItem value="menor-preco-item">Menor Preço por item</SelectItem>
                            <SelectItem value="menor-preco-lote">Menor Preço por grupo</SelectItem>
                            <SelectItem value="maior-desconto">Maior Desconto</SelectItem>
                            <SelectItem value="menor-taxa">Menor taxa administrativa</SelectItem>
                          </>
                        )}
                        {formData.modality === "concorrencia-eletronica" && (
                          <>
                            <SelectItem value="menor-preco">Menor Preço R$</SelectItem>
                            <SelectItem value="melhor-tecnica">
                              Melhor técnica ou conteúdo artístico
                            </SelectItem>
                            <SelectItem value="tecnica-preco">Técnica e preço R$</SelectItem>
                            <SelectItem value="maior-retorno">
                              Maior retorno econômico R$ ou %
                            </SelectItem>
                            <SelectItem value="maior-desconto">Maior Desconto (%)</SelectItem>
                            <SelectItem value="menor-taxa">Menor taxa administrativa %</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disputeMode">Modo de Disputa</Label>
                    <Select
                      value={formData.disputeMode}
                      onValueChange={(value) => handleChange("disputeMode", value)}>
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
                        {formData.modality === "dispensa-eletronica" && (
                          <SelectItem value="simples">Disputa Simples</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="priceDecimals">Decimais dos Preços</Label>
                    <Select
                      value={formData.priceDecimals}
                      onValueChange={(value) => handleChange("priceDecimals", value)}>
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

                {/* DATAS E HORÁRIOS COM DESTAQUE */}
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Cronograma da Licitação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="font-medium text-orange-800">
                          Data e Horário Limite para Impugnação e Esclarecimentos
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.impugnationDate ? (
                                  format(formData.impugnationDate, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Data</span>
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
                          <Input
                            type="time"
                            value={formData.impugnationTime}
                            onChange={(e) => handleChange("impugnationTime", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-medium text-orange-800">
                          Data e Horário Limite para Propostas
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.proposalDate ? (
                                  format(formData.proposalDate, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Data</span>
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
                          <Input
                            type="time"
                            value={formData.proposalTime}
                            onChange={(e) => handleChange("proposalTime", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-medium text-orange-800">
                          Data e Horário de Abertura da Sessão
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.openingDate ? (
                                  format(formData.openingDate, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Data</span>
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
                          <Input
                            type="time"
                            value={formData.openingTime}
                            onChange={(e) => handleChange("openingTime", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Documentos de Habilitação</Label>
                  <RadioGroup
                    value={formData.documentationMode}
                    onValueChange={(value) => handleChange("documentationMode", value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">Todos apresentam na fase de proposta</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="winner" id="winner" />
                      <Label htmlFor="winner">Somente o licitante arrematante apresenta</Label>
                    </div>
                  </RadioGroup>
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
                  <Label htmlFor="object">Objeto do Edital</Label>
                  <Textarea
                    id="object"
                    value={formData.object}
                    onChange={(e) => handleChange("object", e.target.value)}
                    placeholder="Descreva o objeto da licitação"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="auctioneer">
                    {formData.modality === "pregao-eletronico"
                      ? "Pregoeiro"
                      : "Agente de Contratação"}
                  </Label>
                  <Select
                    value={formData.team.auctioneer}
                    onValueChange={(value) => handleTeamChange("auctioneer", value)}>
                    <SelectTrigger id="auctioneer">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authority">Autoridade Superior</Label>
                  <Select
                    value={formData.team.authority}
                    onValueChange={(value) => handleTeamChange("authority", value)}>
                    <SelectTrigger id="authority">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Equipe de Apoio</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSupportTeamMember}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>

                  {formData.team.supportTeam.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={member}
                        onValueChange={(value) => handleSupportTeamChange(index, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {formData.team.supportTeam.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSupportTeamMember(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {formData.judgmentCriteria === "menor-preco-item" ? "Itens" : "Grupos de Itens"}
                  </h3>
                  <Button type="button" variant="outline" onClick={addGroup}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar {formData.judgmentCriteria === "menor-preco-item" ? "Item" : "Grupo"}
                  </Button>
                </div>

                <div className="space-y-8">
                  {formData.groups.map((group, groupIndex) => (
                    <Card key={group.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {formData.judgmentCriteria === "menor-preco-item"
                              ? `Item ${String(groupIndex + 1).padStart(2, "0")}`
                              : `Grupo ${String(groupIndex + 1).padStart(2, "0")}`}
                          </CardTitle>
                          {formData.groups.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGroup(groupIndex)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Tipo de Itens</Label>
                            <Select
                              value={group.type}
                              onValueChange={(value) =>
                                handleGroupChange(groupIndex, "type", value)
                              }>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="products">Produtos</SelectItem>
                                <SelectItem value="services">Serviços</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Descrição do{" "}
                              {formData.judgmentCriteria === "menor-preco-item" ? "Item" : "Grupo"}
                            </Label>
                            <Input
                              value={group.description}
                              onChange={(e) =>
                                handleGroupChange(groupIndex, "description", e.target.value)
                              }
                              placeholder="Descrição"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          {group.type === "products" && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`requireBrand-${groupIndex}`}
                                checked={group.requireBrand}
                                onCheckedChange={(checked) =>
                                  handleGroupChange(groupIndex, "requireBrand", checked)
                                }
                              />
                              <Label htmlFor={`requireBrand-${groupIndex}`}>
                                Requer Marca, Modelo e Fabricante
                              </Label>
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`allowDescriptionChange-${groupIndex}`}
                              checked={group.allowDescriptionChange}
                              onCheckedChange={(checked) =>
                                handleGroupChange(groupIndex, "allowDescriptionChange", checked)
                              }
                            />
                            <Label htmlFor={`allowDescriptionChange-${groupIndex}`}>
                              Permitir Alterar a Descrição
                            </Label>
                          </div>
                        </div>

                        {formData.judgmentCriteria === "menor-preco-lote" && (
                          <>
                            <div className="flex items-center justify-between mt-4">
                              <h4 className="font-medium">Itens do Grupo</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addItem(groupIndex)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Item
                              </Button>
                            </div>
                          </>
                        )}

                        <div className="space-y-4">
                          {group.items.map((item, itemIndex) => (
                            <div key={item.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="font-medium">
                                  Item {String(itemIndex + 1).padStart(2, "0")}
                                </h5>
                                {group.items.length > 1 &&
                                  formData.judgmentCriteria === "menor-preco-lote" && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeItem(groupIndex, itemIndex)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Descrição</Label>
                                  <Input
                                    value={item.description}
                                    onChange={(e) =>
                                      handleItemChange(
                                        groupIndex,
                                        itemIndex,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Descrição do item"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Tipo de Benefício</Label>
                                  <Select
                                    value={item.benefitType}
                                    onValueChange={(value) =>
                                      handleItemChange(groupIndex, itemIndex, "benefitType", value)
                                    }>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="exclusive_for_me_epp">
                                        Exclusivo ME/EPP
                                      </SelectItem>
                                      <SelectItem value="open_competition_with_benefit_for_me_epp">
                                        Ampla concorrência com benefício para ME/EPP
                                      </SelectItem>
                                      <SelectItem value="open_competition_without_benefit">
                                        Ampla concorrência sem benefício
                                      </SelectItem>
                                      <SelectItem value="regional">Regional</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-3 mt-4">
                                <div className="space-y-2">
                                  <Label>Quantidade</Label>
                                  <Input
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(
                                        groupIndex,
                                        itemIndex,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Quantidade"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Unidade de Medida</Label>
                                  <Input
                                    value={item.unit}
                                    onChange={(e) =>
                                      handleItemChange(
                                        groupIndex,
                                        itemIndex,
                                        "unit",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Ex: UN, KG, CX"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Valor Unitário</Label>
                                  <Input
                                    value={item.unitPrice}
                                    onChange={(e) =>
                                      handleItemChange(
                                        groupIndex,
                                        itemIndex,
                                        "unitPrice",
                                        e.target.value
                                      )
                                    }
                                    placeholder="R$ 0,00"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Documentos</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addDocument}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Documento
                    </Button>
                  </div>

                  {formData.documents.length === 0 && (
                    <div className="text-center p-8 border rounded-md border-dashed">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Adicione o Edital, Anexos, Estudo Técnico Preliminar, Termo de Referência
                      </p>
                    </div>
                  )}

                  {formData.documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-4 border rounded-md p-4">
                      <div className="flex-1 space-y-2">
                        <Label>Nome do Documento</Label>
                        <Input
                          value={doc.name}
                          onChange={(e) => handleDocumentNameChange(index, e.target.value)}
                          placeholder="Ex: Edital, Termo de Referência"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <FileUploadField
                          label="Arquivo"
                          folder="tender-documents"
                          entityType="tender"
                          onUploadComplete={(fileData) => handleFileUploadComplete(index, fileData)}
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        onClick={() => removeDocument(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-medium">Publicação</h3>

                  <Tabs defaultValue="now">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="now">Publicar Agora</TabsTrigger>
                      <TabsTrigger value="schedule">Agendar Publicação</TabsTrigger>
                    </TabsList>
                    <TabsContent value="now" className="p-4 border rounded-md mt-2">
                      <p className="text-sm text-muted-foreground">
                        A licitação será publicada imediatamente após salvar.
                      </p>
                    </TabsContent>
                    <TabsContent value="schedule" className="p-4 border rounded-md mt-2">
                      <div className="space-y-2">
                        <Label>Data de Publicação</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              <span>Selecionar data</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" initialFocus locale={ptBR} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-medium">Documentos Relacionados</h3>
                  <DocumentList documents={formData.documents} />
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              Voltar
            </Button>
          ) : (
            <div></div>
          )}

          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep}>
              Próximo
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar e Publicar
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

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
import { TenderSummary } from "./tender-summary";
import { Combobox, ComboboxProvider } from "@/components/ui/combobox";

const STORAGE_KEY = "create-tender-form-data";


// Função para formatar valor em BRL
const SEGMENTS = [
  {
    label: "Serviços de Tecnologia da Informação e Comunicação (TIC)",
    options: [
      "Desenvolvimento de software e sistemas",
      "Suporte técnico e manutenção de TI",
      "Locação e venda de equipamentos de informática",
      "Serviços de cloud computing e data center",
      "Provedores de internet e infraestrutura de redes",
    ],
  },
  {
    label: "Construção Civil e Engenharia",
    options: [
      "Obras de infraestrutura (estradas, pontes, saneamento)",
      "Manutenção predial e reformas",
      "Projetos de engenharia e arquitetura",
      "Sondagens e topografia",
      "Fiscalização de obras públicas",
    ],
  },
  {
    label: "Saúde",
    options: [
      "Fornecimento de medicamentos e insumos hospitalares",
      "Equipamentos médicos e odontológicos",
      "Serviços médicos especializados",
      "Laboratórios de análises clínicas",
      "Locação de ambulâncias e home care",
    ],
  },
  {
    label: "Educação",
    options: [
      "Fornecimento de livros e materiais didáticos",
      "Uniformes escolares",
      "Transporte escolar",
      "Software educacional",
      "Mobiliário para salas de aula",
    ],
  },
  {
    label: "Limpeza, Conservação e Facilities",
    options: [
      "Limpeza predial e hospitalar",
      "Coleta e destinação de resíduos",
      "Jardinagem e paisagismo",
      "Controle de pragas",
      "Portaria, recepção e vigilância",
    ],
  },
  {
    label: "Alimentação",
    options: [
      "Gêneros alimentícios (para merenda escolar, hospitais, presídios)",
      "Serviços de catering e alimentação coletiva",
      "Cestas básicas",
    ],
  },
  {
    label: "Veículos e Transporte",
    options: [
      "Locação de veículos",
      "Aquisição de automóveis, ônibus, motos e tratores",
      "Manutenção e peças automotivas",
      "Transporte de pacientes e cargas",
    ],
  },
  {
    label: "Serviços Administrativos",
    options: [
      "Digitalização e arquivamento",
      "Serviços gráficos",
      "Tradução e interpretação",
      "Treinamentos e capacitação",
      "Consultoria e assessoria técnica",
    ],
  },
  {
    label: "Segurança",
    options: [
      "Vigilância armada e desarmada",
      "Monitoramento eletrônico",
      "Equipamentos de segurança (CFTV, alarmes, portões)",
    ],
  },
  {
    label: "Mobiliário e Equipamentos",
    options: [
      "Móveis para escritório, escola e hospital",
      "Equipamentos de áudio e vídeo",
      "Ar-condicionado e refrigeração",
      "Máquinas e ferramentas industriais",
    ],
  },
  {
    label: "Agricultura e Meio Ambiente",
    options: [
      "Fornecimento de sementes e insumos agrícolas",
      "Equipamentos e tratores",
      "Consultoria ambiental",
      "Serviços de reflorestamento e poda",
      "Monitoramento ambiental",
    ],
  },
  {
    label: "Vestuário e Têxteis",
    options: [
      "Uniformes profissionais",
      "Equipamentos de proteção individual (EPI)",
      "Roupa de cama hospitalar e escolar",
    ],
  },
  {
    label: "Obras e Serviços de Urbanismo",
    options: [
      "Iluminação pública",
      "Pavimentação e calçamento",
      "Sinalização urbana",
      "Manutenção de áreas públicas",
    ],
  },
  {
    label: "Marketing, Comunicação e Eventos",
    options: [
      "Produção de eventos",
      "Publicidade institucional",
      "Criação de campanhas educativas",
      "Impressão de material gráfico e brindes",
    ],
  },
  {
    label: "Energia e Utilities",
    options: [
      "Fornecimento e manutenção de painéis solares",
      "Eficiência energética",
      "Geradores e nobreaks",
      "Poços artesianos e sistemas hidráulicos",
    ],
  },
];
export const formatCurrency = (value: string | number): string => {
  const numericValue =
    typeof value === "string"
      ? Number.parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."))
      : value;
  if (isNaN(numericValue)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
};

// Função para converter valor BRL para número
const parseCurrency = (value: string): number => {
  const numericValue = Number.parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."));
  return isNaN(numericValue) ? 0 : numericValue;
};

// Função para calcular valor total do item
export const calculateItemTotal = (quantity: string, unitPrice: string): number => {
  const qty = Number.parseFloat(quantity) || 0;
  const price = parseCurrency(unitPrice) || 0;
  return qty * price;
};

// Função para calcular valor total do Lote
export const calculateGroupTotal = (items: any[]): number => {
  return items.reduce((total, item) => {
    return total + calculateItemTotal(item.quantity, item.unitPrice);
  }, 0);
};

// Função para salvar dados no localStorage
const saveToLocalStorage = (data: any) => {
  try {
    // Converter datas para strings antes de salvar
    const dataToSave = {
      ...data,
      impugnationDate: data.impugnationDate ? data.impugnationDate.toISOString() : null,
      proposalDate: data.proposalDate ? data.proposalDate.toISOString() : null,
      openingDate: data.openingDate ? data.openingDate.toISOString() : null,
      publishDate: data.publishDate ? data.publishDate.toISOString() : null,
      // Remover arquivos dos documentos para evitar problemas de serialização
      documents: data.documents.map((doc: any) => ({
        ...doc,
        file: null, // Não salvar o arquivo, apenas os metadados
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Erro ao salvar no localStorage:", error);
  }
};

// Função para carregar dados do localStorage
const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Converter strings de volta para datas
      return {
        ...data,
        impugnationDate: data.impugnationDate ? new Date(data.impugnationDate) : undefined,
        proposalDate: data.proposalDate ? new Date(data.proposalDate) : undefined,
        openingDate: data.openingDate ? new Date(data.openingDate) : undefined,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
      };
    }
  } catch (error) {
    console.error("Erro ao carregar do localStorage:", error);
  }
  return null;
};

// Função para limpar localStorage
const clearLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Erro ao limpar localStorage:", error);
  }
};

export default function CreateTenderPage() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [segmentSearch, setSegmentSearch] = useState("");

  const filteredSegments = SEGMENTS.map((group) => ({
    ...group,
    options: group.options.filter((option) =>
      option.toLowerCase().includes(segmentSearch.toLowerCase())
    ),
  })).filter((group) => group.options.length > 0);

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
    publishDate: undefined as Date | undefined,
    documentationMode: "winner",
    phaseInversion: false,
    segments: [],
    object: "",
    team: {
      auctioneer: "",
      authority: "",
      supportTeam: [""],
    },
    itemStructure: "multiple-groups", // Novo campo: 'single', 'multiple', 'group', 'multiple-groups'
    items: [
      // Novo array para itens sem Lote
      {
        id: 1,
        description: "",
        quantity: "",
        unit: "",
        unitPrice: "",
        benefitType: "open",
      },
    ],
    groups: [
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

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setFormData((prevData) => ({
        ...prevData,
        ...savedData,
      }));
    }
  }, []);

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

        // Se o usuário tem agency_id definido no perfil, buscar usuários desse órgão
        if (profile?.agency_id) {
          const { data: usersData, error: usersError } = await supabase
            .from("profiles")
            .select("id, name, email, profile_type")
            .eq("agency_id", profile.agency_id)
            .in("profile_type", [
              "agency",
              "admin",
              "support",
              "authority",
              "auctioneer",
              "agency_support",
            ]);

          if (usersError) throw usersError;
          setUsers(usersData || []);

          // Pré-selecionar o órgão do usuário
          setFormData((prev) => ({
            ...prev,
            agency_id: profile.agency_id,
          }));
        }
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
  }, [supabase, profile]);

  // Novo useEffect para buscar usuários quando agency_id for alterado no formulário
  useEffect(() => {
    const fetchUsersForSelectedAgency = async () => {
      if (!formData.agency_id) {
        setUsers([]);
        return;
      }

      try {
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, name, email, profile_type")
          .eq("agency_id", formData.agency_id)
          .in("profile_type", [
            "agency",
            "admin",
            "support",
            "authority",
            "auctioneer",
            "agency_support",
          ]);
        console.log("Fetched users for agency:", usersData);
        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Limpar seleções de equipe quando o órgão mudar
        setFormData((prev) => ({
          ...prev,
          team: {
            auctioneer: "",
            authority: "",
            supportTeam: [""],
          },
        }));
      } catch (error: any) {
        console.error("Error fetching users for agency:", error);
        toast({
          title: "Erro ao carregar usuários",
          description: error.message || "Ocorreu um erro ao carregar os usuários do órgão.",
          variant: "destructive",
        });
      }
    };

    fetchUsersForSelectedAgency();
  }, [formData.agency_id, supabase]);

  // Salvar no localStorage sempre que formData mudar
  useEffect(() => {
    if (!isLoading) {
      // Só salvar após o carregamento inicial
      saveToLocalStorage(formData);
    }
  }, [formData, isLoading]);

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

  const handleSingleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addSingleItem = () => {
    const newId =
      formData.items.length > 0 ? Math.max(...formData.items.map((item) => item.id)) + 1 : 1;
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          id: newId,
          description: "",
          quantity: "",
          unit: "",
          unitPrice: "",
          benefitType: "open",
        },
      ],
    });
  };

  const removeSingleItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
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

  const renderStep3Content = () => {
    switch (formData.itemStructure) {
      case "single":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Item Único</h3>
            <div className="border rounded-md p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.items[0].description}
                    onChange={(e) => handleSingleItemChange(0, "description", e.target.value)}
                    placeholder="Descrição do item"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Benefício</Label>
                  <Select
                    value={formData.items[0].benefitType}
                    onValueChange={(value) => handleSingleItemChange(0, "benefitType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive_for_me_epp">Exclusivo ME/EPP</SelectItem>
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
              <div className="grid gap-4 md:grid-cols-4 mt-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.items[0].quantity}
                    onChange={(e) => handleSingleItemChange(0, "quantity", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade de Medida</Label>
                  <Input
                    value={formData.items[0].unit}
                    onChange={(e) => handleSingleItemChange(0, "unit", e.target.value)}
                    placeholder="Ex: UN, KG, CX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Unitário</Label>
                  <Input
                    value={formData.items[0].unitPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d,.-]/g, "");
                      handleSingleItemChange(0, "unitPrice", value);
                    }}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Total</Label>
                  <Input
                    value={formatCurrency(
                      calculateItemTotal(formData.items[0].quantity, formData.items[0].unitPrice)
                    )}
                    disabled
                    className="bg-gray-50 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "multiple":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Itens Individuais</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSingleItem}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Item
              </Button>
            </div>
            {formData.items.map((item, index) => (
              <div key={item.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSingleItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleSingleItemChange(index, "description", e.target.value)}
                      placeholder="Descrição do item"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Benefício</Label>
                    <Select
                      value={item.benefitType}
                      onValueChange={(value) =>
                        handleSingleItemChange(index, "benefitType", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusive_for_me_epp">Exclusivo ME/EPP</SelectItem>
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
                <div className="grid gap-4 md:grid-cols-4 mt-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => handleSingleItemChange(index, "quantity", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade de Medida</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => handleSingleItemChange(index, "unit", e.target.value)}
                      placeholder="Ex: UN, KG, CX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Unitário</Label>
                    <Input
                      value={item.unitPrice}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,.-]/g, "");
                        handleSingleItemChange(index, "unitPrice", value);
                      }}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Total</Label>
                    <Input
                      value={formatCurrency(calculateItemTotal(item.quantity, item.unitPrice))}
                      disabled
                      className="bg-gray-50 font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Total Geral para Múltiplos Itens */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-blue-800">Total Geral dos Itens:</span>
                  <span className="text-xl font-bold text-blue-900">
                    {formatCurrency(
                      formData.items.reduce(
                        (total, item) => total + calculateItemTotal(item.quantity, item.unitPrice),
                        0
                      )
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "group":
        const groupTotal = calculateGroupTotal(formData.groups[0].items);
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Lote Único</h3>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Lote 1</CardTitle>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total do Lote</div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(groupTotal)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Itens</Label>
                    <Select
                      value={formData.groups[0].type}
                      onValueChange={(value) => handleGroupChange(0, "type", value)}>
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
                    <Label>Descrição do Lote</Label>
                    <Input
                      value={formData.groups[0].description}
                      onChange={(e) => handleGroupChange(0, "description", e.target.value)}
                      placeholder="Descrição"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  {formData.groups[0].type === "products" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requireBrand"
                        checked={formData.groups[0].requireBrand}
                        onCheckedChange={(checked) => handleGroupChange(0, "requireBrand", checked)}
                      />
                      <Label htmlFor="requireBrand">Requer Marca, Modelo e Fabricante</Label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowDescriptionChange"
                      checked={formData.groups[0].allowDescriptionChange}
                      onCheckedChange={(checked) =>
                        handleGroupChange(0, "allowDescriptionChange", checked)
                      }
                    />
                    <Label htmlFor="allowDescriptionChange">Permitir Alterar a Descrição</Label>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Itens do Lote</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => addItem(0)}>
                      <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                    </Button>
                  </div>
                  {formData.groups[0].items.map((item, itemIndex) => (
                    <div key={item.id} className="border rounded-md p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-medium">Item {itemIndex + 1}</h5>
                        {formData.groups[0].items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(0, itemIndex)}>
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
                              handleItemChange(0, itemIndex, "description", e.target.value)
                            }
                            placeholder="Descrição do item"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo de Benefício</Label>
                          <Select
                            value={item.benefitType}
                            onValueChange={(value) =>
                              handleItemChange(0, itemIndex, "benefitType", value)
                            }>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="exclusive_for_me_epp">Exclusivo ME/EPP</SelectItem>
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
                      <div className="grid gap-4 md:grid-cols-4 mt-4">
                        <div className="space-y-2">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(0, itemIndex, "quantity", e.target.value)
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unidade de Medida</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => handleItemChange(0, itemIndex, "unit", e.target.value)}
                            placeholder="Ex: UN, KG, CX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Unitário</Label>
                          <Input
                            value={item.unitPrice}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d,.-]/g, "");
                              handleItemChange(0, itemIndex, "unitPrice", value);
                            }}
                            placeholder="0,00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor Total</Label>
                          <Input
                            value={formatCurrency(
                              calculateItemTotal(item.quantity, item.unitPrice)
                            )}
                            disabled
                            className="bg-gray-50 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "multiple-groups":
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Lotes de Itens</h3>
              <Button type="button" variant="outline" size="sm" onClick={addGroup}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Lote
              </Button>
            </div>
            {formData.groups.map((group, groupIndex) => {
              const groupTotal = calculateGroupTotal(group.items);
              return (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Lote {groupIndex + 1}</CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total do Lote</div>
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(groupTotal)}
                          </div>
                        </div>
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
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Tipo de Itens</Label>
                        <Select
                          value={group.type}
                          onValueChange={(value) => handleGroupChange(groupIndex, "type", value)}>
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
                        <Label>Descrição do Lote</Label>
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
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Itens do Lote</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addItem(groupIndex)}>
                          <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                        </Button>
                      </div>
                      {group.items.map((item, itemIndex) => (
                        <div key={item.id} className="border rounded-md p-4 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium">Item {itemIndex + 1}</h5>
                            {group.items.length > 1 && (
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
                          <div className="grid gap-4 md:grid-cols-4 mt-4">
                            <div className="space-y-2">
                              <Label>Quantidade</Label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    groupIndex,
                                    itemIndex,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Unidade de Medida</Label>
                              <Input
                                value={item.unit}
                                onChange={(e) =>
                                  handleItemChange(groupIndex, itemIndex, "unit", e.target.value)
                                }
                                placeholder="Ex: UN, KG, CX"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Valor Unitário</Label>
                              <Input
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d,.-]/g, "");
                                  handleItemChange(groupIndex, itemIndex, "unitPrice", value);
                                }}
                                placeholder="0,00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Valor Total</Label>
                              <Input
                                value={formatCurrency(
                                  calculateItemTotal(item.quantity, item.unitPrice)
                                )}
                                disabled
                                className="bg-gray-50 font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Total Geral de Todos os Lotes */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-green-800">
                    Total Geral de Todos os Lotes:
                  </span>
                  <span className="text-xl font-bold text-green-900">
                    {formatCurrency(
                      formData.groups.reduce(
                        (total, group) => total + calculateGroupTotal(group.items),
                        0
                      )
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
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

      // Mapear o valor de formData.modality para o valor aceito na coluna tender_type
      const tenderTypeMap: { [key: string]: string } = {
        "pregao-eletronico": "pregao_eletronico",
        "concorrencia-eletronica": "concorrencia",
        "dispensa-eletronica": "tomada_de_precos",
      };

      console.log("Opening date and time:", openingDateTime);

      // Determinar itens e Lotes para submissão baseado na estrutura escolhida
      const itemsToSubmit =
        formData.itemStructure === "single" || formData.itemStructure === "multiple"
          ? formData.items
          : [];

      const groupsToSubmit =
        formData.itemStructure === "group" || formData.itemStructure === "multiple-groups"
          ? formData.groups
          : [];

      // Calcular valor estimado total
      let totalEstimatedValue = 0;

      // Calcular para itens sem Lote
      for (const item of itemsToSubmit) {
        const quantity = Number.parseFloat(item.quantity.replace(",", ".")) || 0;
        const unitPrice = Number.parseFloat(item.unitPrice.replace(",", ".")) || 0;
        totalEstimatedValue += quantity * unitPrice;
      }

      // Calcular para Lotes e seus itens
      for (const group of groupsToSubmit) {
        for (const item of group.items) {
          const quantity = Number.parseFloat(item.quantity.replace(",", ".")) || 0;
          const unitPrice = Number.parseFloat(item.unitPrice.replace(",", ".")) || 0;
          totalEstimatedValue += quantity * unitPrice;
        }
      }

      // 1. Criar a licitação principal
      const { data: tenderData, error: tenderError } = await supabase
        .from("tenders")
        .insert({
          title: formData.editalTitle,
          description: formData.object,
          tender_number: formData.editalNumber,
          process_number: formData.processNumber,
          tender_type: tenderTypeMap[formData.modality] || formData.modality,
          category: formData.category,
          agency_id: formData.agency_id,
          opening_date: openingDateTime,
          closing_date: proposalDateTime,
          impugnation_deadline: impugnationDateTime,
          judgment_criteria: formData.judgmentCriteria,
          dispute_mode: formData.disputeMode,
          price_decimals: Number.parseInt(formData.priceDecimals),
          bid_increment: formData.valueBetweenBids,
          secret_value: formData.secretValue,
          documentation_mode: formData.documentationMode,
          phase_inversion: formData.phaseInversion,
          estimated_value: totalEstimatedValue,
          status: "published",
          created_by: user.id,
        })
        .select()
        .single();

      console.log("Tender data:", tenderData);
      if (tenderError) {
        console.log("Error creating tender:", tenderError);
        throw tenderError;
      }

      // 2. Adicionar membros da equipe
      if (formData.team.auctioneer) {
        const { error: auctioneerError } = await supabase.from("tender_team").insert({
          tender_id: tenderData.id,
          user_id: formData.team.auctioneer,
          role: formData.modality === "pregao-eletronico" ? "auctioneer" : "contracting_agent",
        });

        if (auctioneerError) {
          console.log("Error adding auctioneer:", auctioneerError);
          throw auctioneerError;
        }
      }

      if (formData.team.authority) {
        const { error: authorityError } = await supabase.from("tender_team").insert({
          tender_id: tenderData.id,
          user_id: formData.team.authority,
          role: "authority",
        });

        if (authorityError) {
          console.log("Error adding authority:", authorityError);
          throw authorityError;
        }
      }

      // Adicionar equipe de apoio
      for (const memberId of formData.team.supportTeam) {
        if (memberId) {
          const { error: supportError } = await supabase.from("tender_team").insert({
            tender_id: tenderData.id,
            user_id: memberId,
            role: "support",
          });

          if (supportError) {
            console.log("Error adding support team member:", supportError);
            throw supportError;
          }
        }
      }

      // 3. Criar Lotes para submissão
      for (const group of groupsToSubmit) {
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

        if (groupError) {
          console.log("Error creating group:", groupError);
          throw groupError;
        }

        console.log("Group data:", groupData);

        // Criar itens para este Lote
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
          if (itemError) {
            console.log("Error creating item:", itemError);
            throw itemError;
          }
        }
      }

      // 4. Tratar itens sem Lote (criar um Lote padrão)
      if (itemsToSubmit.length > 0) {
        // Criar um Lote padrão para itens avulsos
        const { data: defaultGroupData, error: groupError } = await supabase
          .from("tender_lots")
          .insert({
            tender_id: tenderData.id,
            number: 1,
            description: "Itens Avulsos",
            type: "products",
            require_brand: false,
            allow_description_change: true,
            status: "active",
          })
          .select()
          .single();

        if (groupError) {
          console.log("Error creating default group:", groupError);
          throw groupError;
        }

        // Adicionar itens ao Lote padrão
        for (const item of itemsToSubmit) {
          const { error: itemError } = await supabase.from("tender_items").insert({
            lot_id: defaultGroupData.id,
            tender_id: tenderData.id,
            item_number: item.id,
            description: item.description,
            quantity: Number.parseFloat(item.quantity) || 0,
            unit: item.unit,
            estimated_unit_price: Number.parseFloat(item.unitPrice) || 0,
            benefit_type: item.benefitType,
          });

          console.log("Single Item data:", item);
          if (itemError) {
            console.log("Error creating single item:", itemError);
            throw itemError;
          }
        }
      }

      // 5. Link documents to the tender
      for (const doc of formData.documents) {
        if (doc.file_path) {
          try {
            const { error: docInsertError } = await supabase.from("documents").insert({
              name: doc.name,
              file_path: doc.file_path,
              file_type: doc.file?.type || "application/octet-stream",
              file_size: doc.file?.size || 0,
              entity_id: tenderData.id, // Já fornece o ID da licitação
              entity_type: "tender",
            });

            if (docInsertError) {
              console.log("Error inserting document:", docInsertError);
            }
          } catch (docError) {
            console.error("Failed to insert document record:", docError);
          }
        }
        console.log("Document data:", doc);
      }

      // 6. Criar registro de resultados inicial
      const { error: resultError } = await supabase.from("tender_results").insert({
        tender_id: tenderData.id,
        total_value: totalEstimatedValue,
        estimated_value: totalEstimatedValue,
        saved_value: 0,
        saved_percentage: 0,
        total_lots: groupsToSubmit.length + (itemsToSubmit.length > 0 ? 1 : 0),
        completed_lots: 0,
        total_items:
          itemsToSubmit.length + groupsToSubmit.reduce((sum, group) => sum + group.items.length, 0),
        total_proposals: 0,
        total_suppliers: 0,
        status: "pending",
      });

      if (resultError) {
        console.error("Failed to create tender results:", resultError);
        throw new Error("Failed to create tender results record");
      }

      // Limpar localStorage após sucesso
      clearLocalStorage();

      toast({
        title: "Licitação criada com sucesso",
        description: `A licitação foi publicada com valor estimado de ${totalEstimatedValue.toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL",
          }
        )}`,
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
            {currentStep === 3 && "Lotes e itens da licitação"}
            {currentStep === 4 && "Documentos e publicação"}
          </CardDescription>
          <div className="flex items-center gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Tem certeza que deseja limpar todos os dados salvos?")) {
                  clearLocalStorage();
                  window.location.reload();
                }
              }}
              className="text-muted-foreground hover:text-destructive">
              Limpar Dados Salvos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <StepProgress
              steps={["Informações Básicas", "Equipe", "Lotes e Itens", "Documentos"]}
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
                    <Label htmlFor="segments">Segmentos da Licitação</Label>
                    <Combobox
                      value={formData.segments[0] || ""}
                      onValueChange={(value) => handleChange("segments", [value])}
                      onInputChange={setSegmentSearch}
                      placeholder="Busque ou selecione um segmento">
                      <ComboboxProvider
                        value={formData.segments[0] || ""}
                        onValueChange={(value) => handleChange("segments", [value])}
                        setOpen={() => {}} // pode deixar vazio, pois não é usado diretamente
                      >
                        {filteredSegments.map((group) => (
                          <Combobox.Group key={group.label} label={group.label}>
                            {group.options.map((option) => (
                              <Combobox.Option key={option} value={option}>
                                {option}
                              </Combobox.Option>
                            ))}
                          </Combobox.Group>
                        ))}
                      </ComboboxProvider>
                    </Combobox>
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
                            <SelectItem value="menor-preco-lote">Menor Preço por Lote</SelectItem>
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
                {!formData.agency_id && (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                    <p className="text-yellow-800">
                      Selecione um órgão na primeira etapa para visualizar os usuários disponíveis
                      para a equipe.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="auctioneer">
                    {formData.modality === "pregao-eletronico"
                      ? "Pregoeiro"
                      : "Agente de Contratação"}
                  </Label>
                  <Select
                    value={formData.team.auctioneer}
                    onValueChange={(value) => handleTeamChange("auctioneer", value)}
                    disabled={!formData.agency_id || users.length === 0}>
                    <SelectTrigger id="auctioneer">
                      <SelectValue
                        placeholder={
                          !formData.agency_id
                            ? "Selecione um órgão primeiro"
                            : users.length === 0
                            ? "Nenhum usuário disponível"
                            : "Selecione"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(
                          (user) =>
                            user.profile_type === "agency" ||
                            user.profile_type === "admin" ||
                            user.profile_type === "auctioneer"
                        )
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authority">Autoridade Superior</Label>
                  <Select
                    value={formData.team.authority}
                    onValueChange={(value) => handleTeamChange("authority", value)}
                    disabled={!formData.agency_id || users.length === 0}>
                    <SelectTrigger id="authority">
                      <SelectValue
                        placeholder={
                          !formData.agency_id
                            ? "Selecione um órgão primeiro"
                            : users.length === 0
                            ? "Nenhum usuário disponível"
                            : "Selecione"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(
                          (user) =>
                            user.profile_type === "admin" ||
                            user.profile_type === "agency" ||
                            user.profile_type === "authority"
                        )
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
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
                      onClick={addSupportTeamMember}
                      disabled={!formData.agency_id || users.length === 0}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>

                  {formData.team.supportTeam.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={member}
                        onValueChange={(value) => handleSupportTeamChange(index, value)}
                        disabled={!formData.agency_id || users.length === 0}>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !formData.agency_id
                                ? "Selecione um órgão primeiro"
                                : users.length === 0
                                ? "Nenhum usuário disponível"
                                : "Selecione"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((user) =>
                              ["agency", "admin", "support", "agency_support"].includes(
                                user.profile_type
                              )
                            )
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
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
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  {/* Conteúdo principal da etapa 3 */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Como deseja organizar os itens?</Label>
                      <Select
                        value={formData.itemStructure}
                        onValueChange={(value) => handleChange("itemStructure", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a estrutura" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Um item sem Lote</SelectItem>
                          <SelectItem value="multiple">Vários itens sem Lote</SelectItem>
                          <SelectItem value="group">Um Lote com itens</SelectItem>
                          <SelectItem value="multiple-groups">Vários Lotes com itens</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {renderStep3Content()}
                  </div>
                </div>
                <TenderSummary
                  itemStructure={formData.itemStructure}
                  items={formData.items}
                  groups={formData.groups}
                />
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
                      <p className="mt-2 text-[1rem] text-muted-foreground">
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
                      <p className="text-[1rem] text-muted-foreground">
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
                              {formData.publishDate ? (
                                format(formData.publishDate, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecionar data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.publishDate}
                              onSelect={(date) => handleChange("publishDate", date)}
                              initialFocus
                              locale={ptBR}
                            />
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

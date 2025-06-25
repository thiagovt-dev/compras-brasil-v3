"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Todos os possíveis estados do processo de licitação
export type TenderStatus =
  | "draft"
  | "published"
  | "waiting_opening"
  | "proposal_analysis"
  | "dispute"
  | "negotiation"
  | "document_analysis"
  | "winner_declaration"
  | "resource_phase"
  | "adjudication"
  | "homologation"
  | "revoked"
  | "canceled";

// Estados possíveis da fase recursal
export type ResourcePhase =
  | "not_started"
  | "manifestation_open" // Prazo para manifestar interesse
  | "waiting_resource" // Aguardando envio do recurso
  | "resource_submitted" // Recurso enviado, aguardando contrarrazões
  | "counter_argument" // Fase de contrarrazões
  | "judgment" // Em julgamento
  | "adjudicated" // Adjudicado
  | "homologated" // Homologado
  | "revoked"; // Revogado

// Estados possíveis de um lote
export type LotStatus =
  | "waiting" // Aguardando abertura
  | "open" // Em disputa
  | "paused" // Disputa pausada
  | "finished" // Disputa encerrada
  | "negotiation" // Em negociação
  | "disqualified" // Fornecedor desclassificado
  | "winner_declared" // Vencedor declarado
  | "resource_phase" // Em fase recursal
  | "adjudicated" // Adjudicado
  | "homologated" // Homologado
  | "revoked" // Revogado
  | "canceled"; // Anulado

// Modos de disputa
export type DisputeMode =
  | "open" // Aberto
  | "open_restart" // Aberto com reinício
  | "closed" // Fechado
  | "open_closed" // Aberto e Fechado
  | "closed_open" // Fechado e Aberto
  | "random"; // Randômico

// Definição de um recurso
export interface ResourceData {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  phase: "pending" | "manifested" | "submitted" | "not_submitted" | "judged";
  manifestationDate?: Date;
  submissionDate?: Date;
  content?: string;
  counterArguments: Array<{
    id: string;
    supplierId: string;
    supplierName: string;
    content: string;
    submissionDate: Date;
  }>;
  judgment?: {
    decision: "procedente" | "improcedente";
    justification: string;
    date: Date;
  };
}

// Definição de uma mensagem
export interface Message {
  id: string;
  type: "system" | "chat" | "bid";
  content: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  userRole?: string;
  isPrivate?: boolean;
}

// Definição do contexto
interface TenderWorkflowContextType {
  // Estado geral da licitação
  tenderStatus: TenderStatus;
  setTenderStatus: (status: TenderStatus) => void;

  // Lotes
  lots: Array<any>;
  activeLotId: string | null;
  setActiveLotId: (lotId: string | null) => void;

  // Fornecedores
  suppliers: Array<{
    id: string;
    name: string;
    company: string;
    lotId: string;
    value: number;
    status: "classified" | "disqualified" | "winner" | "eliminated";
  }>;
  updateSupplierStatus: (
    supplierId: string,
    status: "classified" | "disqualified" | "winner" | "eliminated"
  ) => void;

  // Status individual dos lotes
  lotStatuses: Record<string, LotStatus>;
  updateLotStatus: (lotId: string, status: LotStatus) => void;

  // Modo de disputa
  disputeMode: DisputeMode;
  setDisputeMode: (mode: DisputeMode) => void;

  // Fase recursal
  resourcePhase: ResourcePhase;
  setResourcePhase: (phase: ResourcePhase) => void;

  // Recursos
  resources: ResourceData[];
  addResource: (resource: ResourceData) => void;
  updateResource: (id: string, updates: Partial<ResourceData>) => void;

  // Mensagens do sistema
  systemMessages: Message[];
  addSystemMessage: (content: string) => void;

  // Mensagens do chat
  chatMessages: Message[];
  addChatMessage: (
    content: string,
    userId: string,
    userName: string,
    userRole: string,
    isPrivate?: boolean
  ) => void;

  // Controle do chat
  isChatEnabled: boolean;
  setChatEnabled: (enabled: boolean) => void;

  // Controle de prazos
  manifestationDeadline: Date | null;
  setManifestationDeadline: (date: Date | null) => void;
  resourceDeadline: Date | null;
  setResourceDeadline: (date: Date | null) => void;
  counterArgumentDeadline: Date | null;
  setCounterArgumentDeadline: (date: Date | null) => void;

  // Ações de fluxo
  openProposals: () => void;
  startDispute: (lotId: string) => void;
  endDispute: (lotId: string) => void;
  startNegotiation: (lotId: string, supplierId: string) => void;
  declareWinner: (lotId: string, supplierId: string, justification: string) => void;
  openResourcePhase: (lotId: string, hours: number) => void;
  addResourceManifestation: (lotId: string, supplierId: string) => void;
  submitResource: (lotId: string, supplierId: string, content: string) => void;
  submitCounterArgument: (resourceId: string, supplierId: string, content: string) => void;
  judgeResource: (
    resourceId: string,
    decision: "procedente" | "improcedente",
    justification: string
  ) => void;
  adjudicate: (lotId: string, supplierId: string) => void;
  homologate: (lotId: string) => void;
  revoke: (lotId: string, justification: string) => void;
  cancel: (lotId: string, justification: string) => void;
}

// Dados mocados para demonstração
const mockLots = [
  {
    id: "lot-001",
    number: "001",
    name: "Material de Escritório",
    description: "Canetas, cadernos, papel A4 e materiais diversos",
    estimatedValue: 15750.0,
    items: [
      {
        id: "item-001",
        description: "Caneta Esferográfica Azul",
        reference: "CX-100",
        quantity: 500,
        unit: "unidade",
        value: 0.8,
      },
      {
        id: "item-002",
        description: "Caderno Espiral 96 Folhas",
        reference: "UN-001",
        quantity: 100,
        unit: "unidade",
        value: 5.5,
      },
    ],
  },
  {
    id: "lot-002",
    number: "002",
    name: "Mobiliário Escolar",
    description: "Mesas e cadeiras para salas de aula",
    estimatedValue: 8500.0,
    items: [
      {
        id: "item-003",
        description: "Mesa Escolar Individual",
        reference: "MOB-001",
        quantity: 20,
        unit: "unidade",
        value: 120.0,
      },
    ],
  },
  {
    id: "lot-003",
    number: "003",
    name: "Mobiliário de Escritório",
    description: "Cadeiras e armários para escritório",
    estimatedValue: 12000.0,
    items: [
      {
        id: "item-004",
        description: "Cadeira Ergonômica",
        reference: "MOB-002",
        quantity: 30,
        unit: "unidade",
        value: 50.0,
      },
      {
        id: "item-005",
        description: "Armário de Aço",
        reference: "MOB-003",
        quantity: 5,
        unit: "unidade",
        value: 200.0,
      },
    ],
  },
];

// Criação do contexto
const TenderWorkflowContext = createContext<TenderWorkflowContextType | undefined>(undefined);

// Provedor do contexto
export function TenderWorkflowProvider({ children }: { children: React.ReactNode }) {
  // Estado geral da licitação
  const [tenderStatus, setTenderStatus] = useState<TenderStatus>("published");

  // Lotes
  const [lots] = useState(mockLots);
  const [activeLotId, setActiveLotId] = useState<string | null>(null);

  // Fornecedores - dados mockados para simulação
  const [suppliers, setSuppliers] = useState([
    {
      id: "s1",
      name: "FORNECEDOR 15",
      company: "Tech Solutions LTDA",
      lotId: "lot-001",
      value: 2890.0,
      status: "classified" as "classified" | "disqualified" | "winner" | "eliminated",
    },
    {
      id: "s2",
      name: "FORNECEDOR 22",
      company: "Inovação Digital ME",
      lotId: "lot-001",
      value: 2900.0,
      status: "classified" as "classified" | "disqualified" | "winner" | "eliminated",
    },
    {
      id: "s3",
      name: "FORNECEDOR 8",
      company: "Sistemas Avançados S.A.",
      lotId: "lot-001",
      value: 2904.0,
      status: "classified" as "classified" | "disqualified" | "winner" | "eliminated",
    },
    {
      id: "s5",
      name: "FORNECEDOR 5",
      company: "Fornecedora Premium LTDA",
      lotId: "lot-002",
      value: 110.0,
      status: "classified" as "classified" | "disqualified" | "winner" | "eliminated",
    },
    {
      id: "s6",
      name: "FORNECEDOR 18",
      company: "Distribuidora Central ME",
      lotId: "lot-002",
      value: 115.0,
      status: "classified" as "classified" | "disqualified" | "winner" | "eliminated",
    },
    {
      id: "s7",
      name: "FORNECEDOR 1",
      company: "Comercial Norte S.A.",
      lotId: "lot-003",
      value: 48.0,
      status: "classified" as "classified" | "disqualified" | "winner" | "eliminated",
    },
    {
      id: "s8",
      name: "FORNECEDOR 7",
      company: "Suprimentos Sul LTDA",
      lotId: "lot-003",
      value: 49.5,
      status: "classified" as "classified" | "disqualified" | "winner" | "eliminated",
    },
  ]);

  // Atualização de status de lote
  const updateLotStatus = (lotId: string, status: LotStatus) => {
    setLotStatuses((prev) => ({ ...prev, [lotId]: status }));
  };

  // Atualização de status de fornecedor
  const updateSupplierStatus = (
    supplierId: string,
    status: "classified" | "disqualified" | "winner" | "eliminated"
  ) => {
    setSuppliers((prev) =>
      prev.map((supplier) => (supplier.id === supplierId ? { ...supplier, status } : supplier))
    );
  };

  // Adicionar recurso
  const addResource = (resource: ResourceData) => {
    setResources((prev) => [...prev, resource]);
  };

  // Atualizar recurso
  const updateResource = (id: string, updates: Partial<ResourceData>) => {
    setResources((prev) =>
      prev.map((resource) => (resource.id === id ? { ...resource, ...updates } : resource))
    );
  };

  // Adicionar mensagem do sistema
  const addSystemMessage = (content: string) => {
    const newMessage: Message = {
      id: `sys-${Date.now()}`,
      type: "system",
      content,
      timestamp: new Date(),
    };

    setSystemMessages((prev) => [...prev, newMessage]);
  };

  // Adicionar mensagem do chat
  const addChatMessage = (
    content: string,
    userId: string,
    userName: string,
    userRole: string,
    isPrivate: boolean = false
  ) => {
    const newMessage: Message = {
      id: `chat-${Date.now()}`,
      type: "chat",
      content,
      timestamp: new Date(),
      userId,
      userName,
      userRole,
      isPrivate,
    };

    setChatMessages((prev) => [...prev, newMessage]);
  };

  // Abrir propostas
  const openProposals = () => {
    setTenderStatus("proposal_analysis");

    // Atualizar todos os lotes para "proposals_opened" (usando o status intermediário)
    setLotStatuses((prev) => {
      const newStatuses = { ...prev };
      Object.keys(newStatuses).forEach((lotId) => {
        if (newStatuses[lotId] === "waiting") {
          newStatuses[lotId] = "finished"; // Mudamos para finished para mostrar as ações de declarar vencedor
        }
      });
      return newStatuses;
    });

    // Adicionar mensagem sobre abertura das propostas
    addSystemMessage(
      "O pregoeiro iniciou a análise de propostas. As propostas estão sendo abertas para verificação."
    );
    addSystemMessage("O processo está em fase de análise das propostas");
    addSystemMessage(
      "Propostas analisadas e fornecedores classificados. Você pode iniciar a disputa ou declarar vencedores."
    );
  };

  // Iniciar disputa
  const startDispute = (lotId: string) => {
    setTenderStatus("dispute");
    setActiveLotId(lotId);
    updateLotStatus(lotId, "open");

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      addSystemMessage(`O item ${lot.number} foi aberto para lances.`);
      // Usando modo de disputa aberta por padrão
      addSystemMessage(`O item ${lot.number} está em disputa aberta.`);
    }
  };

  // Encerrar disputa
  const endDispute = (lotId: string) => {
    updateLotStatus(lotId, "finished");

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      addSystemMessage(`O item ${lot.number} foi encerrado.`);
    }
  };

  // Iniciar negociação
  const startNegotiation = (lotId: string, supplierId: string) => {
    updateLotStatus(lotId, "negotiation");

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      addSystemMessage(
        `O Pregoeiro/Agente de Contratação está negociando o item ${lot.number} com o detentor da melhor oferta.`
      );
    }
  };

  // Declarar vencedor
  const declareWinner = (lotId: string, supplierId: string, justification: string) => {
    updateLotStatus(lotId, "winner_declared");
    updateSupplierStatus(supplierId, "winner");

    // Obter os dados do fornecedor
    const supplier = suppliers.find((s) => s.id === supplierId);

    const lot = lots.find((l) => l.id === lotId);
    if (lot && supplier) {
      addSystemMessage(
        `O Pregoeiro/Agente de Contratação declarou vencedor ${supplier.company} para o item ${lot.number}, com a seguinte justificativa: "${justification}".`
      );
    }
  };

  // Abrir fase recursal
  const openResourcePhase = (lotId: string, hours: number) => {
    setTenderStatus("resource_phase");
    updateLotStatus(lotId, "resource_phase");

    // Definimos um prazo para manifestação de recursos
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      const deadlineStr = deadline.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateStr = deadline.toLocaleDateString("pt-BR");
      addSystemMessage(
        `O Pregoeiro/Agente de Contratação abriu a fase recursal para o item ${lot.number}. O prazo para manifestação é até às ${deadlineStr} do dia ${dateStr}.`
      );
    }
  };

  // Adicionar manifestação de recurso
  const addResourceManifestation = (lotId: string, supplierId: string) => {
    const lot = lots.find((l) => l.id === lotId);
    const supplier = suppliers.find((s) => s.id === supplierId);

    if (lot && supplier) {
      // Criar o recurso
      const newResource: ResourceData = {
        id: `resource-${Date.now()}`,
        supplierId,
        supplierName: supplier.name,
        supplierCompany: supplier.company,
        phase: "manifested",
        manifestationDate: new Date(),
        counterArguments: [],
      };

      addResource(newResource);

      // Calcular data limite (3 dias úteis)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3); // Simplificado (não considera fins de semana)

      const dateStr = deadline.toLocaleDateString("pt-BR");
      addSystemMessage(
        `O fornecedor ${supplier.company} manifestou intenção de recurso para o item ${lot.number}. O prazo para envio das razões é até 23:59 do dia ${dateStr}.`
      );
    }
  };

  // Submeter recurso
  const submitResource = (lotId: string, supplierId: string, content: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);

    if (supplier) {
      // Calcular data limite para contrarrazões (3 dias úteis)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3); // Simplificado (não considera fins de semana)

      const lot = lots.find((l) => l.id === lotId);
      if (lot) {
        const dateStr = deadline.toLocaleDateString("pt-BR");
        addSystemMessage(
          `O fornecedor ${supplier.company} apresentou recurso para o item ${lot.number}. Os demais licitantes ficam convocados para apresentar contrarrazão. O prazo para envio das razões é até 23:59 do dia ${dateStr}.`
        );
      }
    }
  };

  // Submeter contrarrazão
  const submitCounterArgument = (resourceId: string, supplierId: string, content: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);

    if (supplier) {
      addSystemMessage(
        `Contrarrazão recebida de ${supplier.name} para o recurso de ID ${resourceId}.`
      );
    }
  };

  // Julgar recurso
  const judgeResource = (
    resourceId: string,
    decision: "procedente" | "improcedente",
    justification: string
  ) => {
    addSystemMessage(
      `O recurso de ID ${resourceId} foi julgado ${decision} com a seguinte justificativa: "${justification}".`
    );
  };

  // Adjudicar
  const adjudicate = (lotId: string, supplierId: string) => {
    updateLotStatus(lotId, "adjudicated");

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      addSystemMessage(`O item ${lot.number} foi adjudicado.`);
    }
  };

  // Homologar
  const homologate = (lotId: string) => {
    updateLotStatus(lotId, "homologated");

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      addSystemMessage(`O item ${lot.number} foi homologado pela autoridade competente.`);
    }
  };

  // Revogar
  const revoke = (lotId: string, justification: string) => {
    updateLotStatus(lotId, "revoked");

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      addSystemMessage(
        `O item ${lot.number} foi revogado com a seguinte justificativa: "${justification}".`
      );
    }
  };

  // Anular
  const cancel = (lotId: string, justification: string) => {
    updateLotStatus(lotId, "canceled");

    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      addSystemMessage(
        `O item ${lot.number} foi anulado com a seguinte justificativa: "${justification}".`
      );
    }
  }; // Criamos valores vazios para os dados não implementados
  const [lotStatuses, setLotStatuses] = useState<Record<string, LotStatus>>({
    "lot-001": "waiting",
    "lot-002": "waiting",
    "lot-003": "waiting",
  });

  const [disputeMode, setDisputeMode] = useState<DisputeMode>("open");
  const [resourcePhase, setResourcePhase] = useState<ResourcePhase>("not_started");
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [systemMessages, setSystemMessages] = useState<Message[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatEnabled, setChatEnabled] = useState(true);
  const [manifestationDeadline, setManifestationDeadline] = useState<Date | null>(null);
  const [resourceDeadline, setResourceDeadline] = useState<Date | null>(null);
  const [counterArgumentDeadline, setCounterArgumentDeadline] = useState<Date | null>(null);

  return (
    <TenderWorkflowContext.Provider
      value={{
        tenderStatus,
        setTenderStatus,
        lots,
        activeLotId,
        setActiveLotId,
        suppliers,
        updateSupplierStatus,
        lotStatuses,
        updateLotStatus,
        disputeMode,
        setDisputeMode,
        resourcePhase,
        setResourcePhase,
        resources,
        addResource,
        updateResource,
        systemMessages,
        addSystemMessage,
        chatMessages,
        addChatMessage,
        isChatEnabled,
        setChatEnabled,
        manifestationDeadline,
        setManifestationDeadline,
        resourceDeadline,
        setResourceDeadline,
        counterArgumentDeadline,
        setCounterArgumentDeadline,
        openProposals,
        startDispute,
        endDispute,
        startNegotiation,
        declareWinner,
        openResourcePhase,
        addResourceManifestation,
        submitResource,
        submitCounterArgument,
        judgeResource,
        adjudicate,
        homologate,
        revoke,
        cancel,
      }}>
      {children}
    </TenderWorkflowContext.Provider>
  );
}

// Hook para uso do contexto
export function useTenderWorkflow() {
  const context = useContext(TenderWorkflowContext);

  if (context === undefined) {
    throw new Error("useTenderWorkflow must be used within a TenderWorkflowProvider");
  }

  return context;
}

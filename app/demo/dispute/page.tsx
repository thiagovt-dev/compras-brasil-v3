"use client";

import { useState } from "react";
import DisputeRoom from "@/components/dispute-room";
import DisputeRoomDemo from "@/components/dispute-room-demo";
import { TenderWorkflowProvider } from "@/lib/contexts/tender-workflow-context";

// Dados mocados para demonstração
const mockTender = {
  id: "demo-tender-001",
  title: "Pregão Eletrônico nº 23/2025 - Aquisição de Material Escolar",
  number: "23/2025",
  process_number: "66/2025",
  description: "Aquisição de material escolar e didático para as escolas municipais",
  status: "active",
  dispute_start_date: "2025-06-12T09:30:00Z",
  dispute_end_date: "2025-06-12T17:00:00Z",
  estimated_value: 450000.0,
  agency: {
    id: "agency-001",
    name: "Prefeitura Municipal de Janaúba",
    cnpj: "18.715.383/0001-40",
  },
  lots: [
    {
      id: "lot-001",
      number: 1,
      title: "Material Escolar Básico",
      description: "Cadernos, lápis, canetas e material básico",
      estimated_value: 87120.0,
      status: "disputing",
      items: [
        {
          id: "item-001",
          description: "Caderno universitário 200 folhas",
          quantity: 5000,
          unit: "unidade",
          estimated_unit_price: 8.5,
          estimated_total_price: 42500.0,
        },
        {
          id: "item-002",
          description: "Lápis preto nº 2",
          quantity: 10000,
          unit: "unidade",
          estimated_unit_price: 1.2,
          estimated_total_price: 12000.0,
        },
      ],
    },
    {
      id: "lot-002",
      number: 2,
      title: "Material Esportivo",
      description: "Bolas, equipamentos esportivos diversos",
      estimated_value: 23200.0,
      status: "waiting",
      items: [
        {
          id: "item-003",
          description: "Bola de futebol oficial",
          quantity: 50,
          unit: "unidade",
          estimated_unit_price: 85.0,
          estimated_total_price: 4250.0,
        },
      ],
    },
    {
      id: "lot-003",
      number: 3,
      title: "Material de Limpeza",
      description: "Produtos de limpeza e higiene",
      estimated_value: 46258.2,
      status: "finished",
      items: [
        {
          id: "item-004",
          description: "Detergente neutro 5L",
          quantity: 200,
          unit: "unidade",
          estimated_unit_price: 12.5,
          estimated_total_price: 2500.0,
        },
      ],
    },
  ],
};

const mockProfile = {
  id: "user-demo-001",
  name: "João Silva",
  email: "joao.silva@empresa.com",
  role: "supplier",
  company_name: "Fornecedora ABC Ltda",
  cnpj: "12.345.678/0001-90",
};

export default function DemoDisputePage() {
  const [userType, setUserType] = useState<"auctioneer" | "supplier" | "citizen">("supplier");

  // Simular diferentes tipos de usuário
  const getUserInfo = () => {
    switch (userType) {
      case "auctioneer":
        return {
          isAuctioneer: true,
          isSupplier: false,
          isCitizen: false,
          userId: "auctioneer-demo-001",
          profile: {
            ...mockProfile,
            name: "Maria Santos",
            role: "auctioneer",
            company_name: "Prefeitura Municipal",
          },
        };
      case "supplier":
        return {
          isAuctioneer: false,
          isSupplier: true,
          isCitizen: false,
          userId: "supplier-demo-001",
          profile: mockProfile,
        };
      case "citizen":
        return {
          isAuctioneer: false,
          isSupplier: false,
          isCitizen: true,
          userId: "citizen-demo-001",
          profile: {
            ...mockProfile,
            name: "Carlos Observador",
            role: "citizen",
            company_name: null,
          },
        };
      default:
        return {
          isAuctioneer: false,
          isSupplier: true,
          isCitizen: false,
          userId: "supplier-demo-001",
          profile: mockProfile,
        };
    }
  };

  const userInfo = getUserInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de controle para alternar tipo de usuário */}
      <div className="bg-yellow-100 border-b border-yellow-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-yellow-800">🎭 MODO DEMONSTRAÇÃO</span>
            <span className="text-sm text-yellow-700">Visualizar como:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setUserType("auctioneer")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  userType === "auctioneer"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                Pregoeiro
              </button>
              <button
                onClick={() => setUserType("supplier")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  userType === "supplier"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                Fornecedor
              </button>
              <button
                onClick={() => setUserType("citizen")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  userType === "citizen"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                Cidadão
              </button>
            </div>
          </div>
          <div className="text-sm text-yellow-700">Esta é uma demonstração com dados fictícios</div>
        </div>
      </div>

      {/* Componente da sala de disputa dentro do TenderWorkflowProvider */}
      <TenderWorkflowProvider>
        <DisputeRoomDemo
          tender={mockTender}
          isAuctioneer={userInfo.isAuctioneer}
          isSupplier={userInfo.isSupplier}
          isCitizen={userInfo.isCitizen}
          userId={userInfo.userId}
          profile={userInfo.profile}
        />
      </TenderWorkflowProvider>
    </div>
  );
}

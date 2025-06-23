"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TenderDetails from "@/components/tender-details";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface TenderDetailPageProps {
  params: {
    id: string;
  };
}

// Função para gerar dados mockados da licitação
const generateMockTender = (tenderId: string) => {
  const mockAgency = {
    id: "mock-agency-1",
    name: "Prefeitura Municipal de São Paulo",
    cnpj: "12.345.678/0001-90",
    email: "licitacoes@prefeitura.sp.gov.br",
    phone: "(11) 3113-1234",
    address: "Viaduto do Chá, 15 - Centro - São Paulo/SP",
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const openingDate = new Date();
  openingDate.setDate(openingDate.getDate() + 5);
  
  const closingDate = new Date(openingDate);
  closingDate.setDate(closingDate.getDate() + 10);

  const impugnationDeadline = new Date(openingDate);
  impugnationDeadline.setDate(impugnationDeadline.getDate() - 2);

  const clarificationDeadline = new Date(openingDate);
  clarificationDeadline.setDate(clarificationDeadline.getDate() - 1);

  const mockLots = [
    {
      id: "mock-lot-1",
      tender_id: tenderId,
      number: 1,
      description: "Computadores e Notebooks",
      estimated_value: 250000,
      is_mock: true,
      items: [
        {
          id: "mock-item-1",
          lot_id: "mock-lot-1",
          number: 1,
          description: "Computador Desktop Intel Core i5, 8GB RAM, SSD 256GB",
          quantity: 50,
          unit: "unidade",
          unit_price: 2500,
          total_price: 125000,
          specifications: "Processador Intel Core i5, Memória RAM 8GB DDR4, SSD 256GB, Sistema Operacional Windows 11",
          is_mock: true,
        },
        {
          id: "mock-item-2",
          lot_id: "mock-lot-1",
          number: 2,
          description: "Notebook Intel Core i7, 16GB RAM, SSD 512GB",
          quantity: 25,
          unit: "unidade",
          unit_price: 5000,
          total_price: 125000,
          specifications: "Processador Intel Core i7, Memória RAM 16GB DDR4, SSD 512GB, Tela 15.6 polegadas, Sistema Operacional Windows 11",
          is_mock: true,
        },
      ],
    },
    {
      id: "mock-lot-2",
      tender_id: tenderId,
      number: 2,
      description: "Periféricos e Acessórios",
      estimated_value: 75000,
      is_mock: true,
      items: [
        {
          id: "mock-item-3",
          lot_id: "mock-lot-2",
          number: 3,
          description: "Mouse Óptico USB",
          quantity: 100,
          unit: "unidade",
          unit_price: 25,
          total_price: 2500,
          specifications: "Mouse óptico USB, 1000 DPI, design ergonômico, compatível com Windows e Mac",
          is_mock: true,
        },
        {
          id: "mock-item-4",
          lot_id: "mock-lot-2",
          number: 4,
          description: "Teclado ABNT2 USB",
          quantity: 100,
          unit: "unidade",
          unit_price: 35,
          total_price: 3500,
          specifications: "Teclado USB padrão ABNT2, teclas multimídia, resistente a respingos",
          is_mock: true,
        },
        {
          id: "mock-item-5",
          lot_id: "mock-lot-2",
          number: 5,
          description: "Monitor LED 24 polegadas",
          quantity: 75,
          unit: "unidade",
          unit_price: 450,
          total_price: 33750,
          specifications: "Monitor LED 24', resolução Full HD 1920x1080, entrada HDMI e VGA, ajuste de altura",
          is_mock: true,
        },
      ],
    },
  ];

  return {
    id: tenderId,
    tender_number: "2024/001-PE",
    title: "Aquisição de Equipamentos de Informática",
    description: "Licitação para aquisição de equipamentos de informática destinados à modernização do parque tecnológico da administração pública municipal, incluindo computadores, notebooks, periféricos e acessórios diversos, visando melhorar a eficiência dos serviços públicos prestados à população.",
    modality: "Pregão Eletrônico",
    category: "Tecnologia da Informação",
    status: "published",
    estimated_value: 325000,
    is_value_secret: false,
    opening_date: openingDate.toISOString(),
    closing_date: closingDate.toISOString(),
    impugnation_deadline: impugnationDeadline.toISOString(),
    clarification_deadline: clarificationDeadline.toISOString(),
    proposal_deadline: closingDate.toISOString(),
    session_date: closingDate.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: "mock-user-1",
    agency_id: mockAgency.id,
    judgment_criteria: "Menor Preço por Lote",
    dispute_mode: "Aberto",
    tender_type: "Pregão Eletrônico",
    is_mock: true,
    agency: mockAgency,
    lots: mockLots,
  };
};

// Função para gerar equipe mockada
const generateMockTenderTeam = (tenderId: string, userId: string | undefined) => {
  const team = [
    {
      user_id: "mock-user-pregoeiro",
      role: "auctioneer",
      tender_id: tenderId,
    },
    {
      user_id: "mock-user-apoio-1",
      role: "support_team",
      tender_id: tenderId,
    },
    {
      user_id: "mock-user-apoio-2",
      role: "support_team",
      tender_id: tenderId,
    },
  ];

  // Se houver usuário logado, adicionar como pregoeiro para permitir acesso
  if (userId) {
    team.push({
      user_id: userId,
      role: "auctioneer",
      tender_id: tenderId,
    });
  }

  return team;
};

export default function TenderDetailPage() {
  const params = useParams();
  const tenderId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentTender, setCurrentTender] = useState<any>(null);
  const [currentTenderTeam, setCurrentTenderTeam] = useState<any[]>([]);
  const [supplierParticipation, setSupplierParticipation] = useState<any>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const supabase = createClientSupabaseClient();

  useEffect(() => {
    const loadTenderData = async () => {
      try {
        setIsLoading(true);
        
        console.log("Tender ID:", tenderId);

        // Check if user is authenticated
        const {
          data: { session: userSession },
        } = await supabase.auth.getSession();
        
        console.log("User Session:", userSession);
        setSession(userSession);

        // Get user profile
        let userProfile = null;
        if (userSession) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userSession.user.id)
            .single();
          userProfile = data;
          setProfile(userProfile);
        }

        console.log("User Profile:", userProfile);

        // Try to get tender details from database
        const { data: tender, error } = await supabase
          .from("tenders")
          .select(
            `
              *,
              agency:agencies(*),
              lots:tender_lots(
                *,
                items:tender_items(*)
              )
            `
          )
          .eq("id", tenderId)
          .single();

        let tenderData = tender;
        let tenderTeam: any[] = [];
        let mockDataFlag = false;

        // If tender not found or error, use mock data
        if (error || !tender) {
          console.log("Licitação não encontrada, usando dados mockados para ID:", tenderId);
          tenderData = generateMockTender(tenderId);
          tenderTeam = generateMockTenderTeam(tenderId, userSession?.user.id);
          mockDataFlag = true;
          setUsingMockData(true);
        } else {
          // Get real tender team data
          const { data: realTenderTeam } = await supabase
            .from("tender_team")
            .select("user_id, role")
            .eq("tender_id", tenderId);
          
          tenderTeam = realTenderTeam || [];
        }

        // Check supplier participation
        let supplierData = null;
        if (!mockDataFlag && userSession?.user.id) {
          const { data } = await supabase
            .from("tender_suppliers")
            .select("*")
            .eq("tender_id", tenderId)
            .eq("user_id", userSession.user.id)
            .single();
          supplierData = data;
        } else if (mockDataFlag && userProfile?.profile_type === "supplier") {
          // Mock supplier participation for demo
          supplierData = {
            id: "mock-participation-1",
            tender_id: tenderId,
            user_id: userSession?.user.id,
            status: "active",
            created_at: new Date().toISOString(),
          };
        }

        // Add mock data flag to tender object
        if (mockDataFlag) {
          tenderData.is_mock = true;
        }

        // Set all state
        setCurrentTender(tenderData);
        setCurrentTenderTeam(tenderTeam);
        setSupplierParticipation(supplierData);
        setUsingMockData(mockDataFlag);

      } catch (error) {
        console.error("Erro ao carregar dados da licitação:", error);
        
        // Fallback para dados mock em caso de erro
        const mockTender = generateMockTender(tenderId);
        const mockTeam = generateMockTenderTeam(tenderId, session?.user.id);
        
        mockTender.is_mock = true;
        setCurrentTender(mockTender);
        setCurrentTenderTeam(mockTeam);
        setUsingMockData(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (tenderId) {
      loadTenderData();
    }
  }, [tenderId, supabase]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando detalhes da licitação...</p>
        </div>
      </div>
    );
  }

  // Show error state if no tender data
  if (!currentTender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Não foi possível carregar os dados da licitação.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Calculate user permissions
  const isAuctioneer = currentTenderTeam?.some(
    (member) =>
      member.user_id === session?.user.id &&
      (member.role === "auctioneer" || member.role === "contracting_agent")
  );

  const isSupplierParticipant = !!supplierParticipation;
  const isAgencyUser = profile?.profile_type === "agency";
  const isSupplierUser = profile?.profile_type === "supplier";
  const isAdminUser = profile?.profile_type === "admin";
  const isCitizen = profile?.profile_type === "citizen" || !profile?.profile_type;
  const isOwner = session?.user.id === currentTender.created_by;
  const showProposals = (isAgencyUser && isOwner) || isAdminUser || isAuctioneer;

  return (
    <TenderDetails
      tender={currentTender}
      isAgencyUser={isAgencyUser}
      showProposals={showProposals}
      isAuctioneer={isAuctioneer as boolean}
      isAdmin={isAdminUser}
      isSupplierParticipant={isSupplierParticipant}
      isCitizen={isCitizen}
      userProfile={profile}
      usingMockData={usingMockData}
    />
  );
}
// components/tender-details-client-components/tender-detail-client.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TenderHeader from "./tender-detail-header";
import TenderInfoCards from "./tender-detail-info-card";
import TenderOverview from "./tender-detail-overview";
import TenderLots from "./tender-detail-lots";
import TenderDocuments from "./tender-detail-documents";
import TenderParticipants from "./tender-detail-participants";
import TenderTimeline from "./tender-detail-timeline";

interface TenderDetailClientProps {
  tender: Tender;
  documents: TenderDocument[];
  participants: TenderParticipant[];
  isFavorite: boolean;
  isAuthenticated: boolean;
  hasDocumentError: boolean;
  hasParticipantError: boolean;
  userProposals?: Record<string, any>;
  isSupplier?: boolean;
  userId?: string;
}

export default function TenderDetailClient({
  tender,
  documents,
  participants,
  isFavorite: initialIsFavorite,
  isAuthenticated,
  hasDocumentError,
  hasParticipantError,
  userProposals = {},
  isSupplier = false,
  userId,
}: TenderDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  const handleFavoriteChange = (newIsFavorite: boolean) => {
    setIsFavorite(newIsFavorite);
  };

  return (
    <div className="py-6 space-y-6">
      <TenderHeader
        tender={tender}
        isFavorite={isFavorite}
        isAuthenticated={isAuthenticated}
        onFavoriteChange={handleFavoriteChange}
      />

      <TenderInfoCards tender={tender} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="lots">Lotes e Itens</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TenderOverview tender={tender} />
        </TabsContent>

        <TabsContent value="lots">
          <TenderLots 
            tender={tender} 
            userProposals={userProposals}
            isSupplier={isSupplier}
            userId={userId}
          />
        </TabsContent>

        <TabsContent value="documents">
          <TenderDocuments documents={documents} hasDocumentError={hasDocumentError} />
        </TabsContent>

        <TabsContent value="participants">
          <TenderParticipants participants={participants} hasParticipantError={hasParticipantError} />
        </TabsContent>

        <TabsContent value="timeline">
          <TenderTimeline tender={tender} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
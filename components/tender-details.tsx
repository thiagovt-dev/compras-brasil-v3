"use client"
import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TenderActions } from "@/components/tender-actions"
import { TenderLots } from "@/components/tender-lots"
import { TenderDocuments } from "@/components/tender-documents"
import { TenderClarifications } from "@/components/tender-clarifications"
import { TenderImpugnations } from "@/components/tender-impugnations"
import { TenderProposals } from "@/components/tender-proposals"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, Users, Eye } from "lucide-react"

const TenderDetails = ({
  tender,
  showProposals,
  isAgencyUser = false,
  isAuctioneer = false,
  isAdmin = false,
  isSupplierParticipant = false,
  isCitizen = false,
  userProfile,
}: {
  tender: any
  showProposals: boolean
  isAgencyUser: boolean
  isAuctioneer: boolean
  isAdmin: boolean
  isSupplierParticipant: boolean
  isCitizen: boolean
  userProfile: any
}) => {
  const router = useRouter()

  // Determinar se pode acessar a sala de disputa
  const canAccessDisputeRoom = isAuctioneer || isSupplierParticipant || isCitizen

  // Determinar se pode participar ativamente (não apenas visualizar)
  const canParticipateInDispute = isAuctioneer || isSupplierParticipant

  const getDisputeButtonText = () => {
    if (isAuctioneer) return "Gerenciar Sala de Disputa"
    if (isSupplierParticipant) return "Participar da Disputa"
    if (isCitizen) return "Acompanhar Disputa"
    return "Acessar Sala de Disputa"
  }

  const getDisputeButtonIcon = () => {
    if (isCitizen) return <Eye className="h-4 w-4 mr-2" />
    return <Users className="h-4 w-4 mr-2" />
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-start gap-4">
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Botão para Sala de Disputa - Disponível para todos os usuários autenticados */}
        {canAccessDisputeRoom && tender.status === "published" && (
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/tenders/${tender.id}/session/dispute`)}
              variant={canParticipateInDispute ? "default" : "outline"}
            >
              {getDisputeButtonIcon()}
              {getDisputeButtonText()}
            </Button>

            {/* Indicador do tipo de acesso */}
            <Badge variant={isCitizen ? "secondary" : "default"}>
              {isCitizen ? "Visualização" : "Participação"}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">{tender.title}</h1>
          <p className="text-muted-foreground">Nº {tender.tender_number}</p>

          {/* Informações sobre acesso à disputa */}
          {canAccessDisputeRoom && (
            <div className="mt-2 p-3 bg-muted/50 rounded-md">
              <p className="text-sm">
                {isAuctioneer && "Você pode gerenciar esta disputa como pregoeiro."}
                {isSupplierParticipant && "Você está habilitado a participar desta disputa."}
                {isCitizen && "Você pode acompanhar esta disputa como observador."}
              </p>
            </div>
          )}
        </div>

        <TenderActions tender={tender} />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="lots">Lotes e Itens</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="clarifications">Esclarecimentos</TabsTrigger>
          <TabsTrigger value="impugnations">Impugnações</TabsTrigger>
          {showProposals && <TabsTrigger value="proposals">Propostas</TabsTrigger>}
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Detalhes da licitação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">Descrição</h2>
                <p className="whitespace-pre-line">{tender.description ?? "N/A"}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Órgão</h2>
                <p>{tender.agency?.name}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Modalidade</h2>
                <p>{tender.modality}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Categoria</h2>
                <p>{tender.category}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Critério de Julgamento</h2>
                <p>{tender.judgment_criteria}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Modo de Disputa</h2>
                <p>{tender.dispute_mode}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">Data de Abertura</h2>
                <p>{new Date(tender.opening_date).toLocaleString("pt-BR")}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Prazo para Propostas</h2>
                <p>{new Date(tender.closing_date).toLocaleString("pt-BR")}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Prazo para Impugnações</h2>
                <p>{new Date(tender.impugnation_deadline).toLocaleString("pt-BR")}</p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Valor Estimado</h2>
                <p>
                  {tender.is_value_secret
                    ? "Sigiloso"
                    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        tender.estimated_value || 0,
                      )}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-medium">Status</h2>
                <p>{tender.status}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lots">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TenderLots tender={tender || []} />
          </Suspense>
        </TabsContent>

        <TabsContent value="documents">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TenderDocuments tender={tender} />
          </Suspense>
        </TabsContent>

        <TabsContent value="clarifications">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TenderClarifications tenderId={tender.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="impugnations">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <TenderImpugnations tenderId={tender.id} />
          </Suspense>
        </TabsContent>

        {showProposals && (
          <TabsContent value="proposals">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <TenderProposals
                tenderId={tender.id}
                lots={tender.lots || []}
                isAgencyUser={isAgencyUser}
              />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default TenderDetails
"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

interface TenderDetailsProps {
  tender: any // Replace 'any' with a more specific type if possible
  userRole: string | null | undefined
}

const TenderDetails: React.FC<TenderDetailsProps> = ({ tender, userRole }) => {
  return (
    <div>
      {/* Tender Details Content Here */}
      {/* Example Content - Replace with actual tender details */}
      <h2 className="text-2xl font-bold mb-4">{tender?.title || "Tender Title"}</h2>
      <p className="text-gray-600 mb-2">Description: {tender?.description || "Tender Description"}</p>
      <p className="text-gray-600 mb-2">Status: {tender?.status || "Tender Status"}</p>
      {/* End Example Content */}

      {/* Botão para Sala de Disputa */}
      {(userRole === "agency" || userRole === "supplier") && tender.status === "active" && (
        <div className="mt-6 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-semibold mb-2">Sala de Disputa</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {userRole === "agency"
              ? "Acesse a sala de disputa para gerenciar propostas e negociar com fornecedores."
              : "Acesse a sala de disputa para enviar propostas e negociar valores."}
          </p>
          <Button onClick={() => (window.location.href = `/tenders/${tender.id}/session/dispute`)} className="w-full">
            {userRole === "agency" ? "Gerenciar Disputa" : "Participar da Disputa"}
          </Button>
        </div>
      )}
    </div>
  )
}

export default TenderDetails

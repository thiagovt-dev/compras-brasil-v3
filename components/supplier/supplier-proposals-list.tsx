"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, FileText } from "lucide-react";
import SupplierProposalCard from "./supplier-proposal-card";

interface SupplierProposalsListProps {
  proposals: any[];
}

export default function SupplierProposalsList({ 
  proposals, 
}: SupplierProposalsListProps) {

//   if (hasError) {
//     return (
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-3xl font-bold">Minhas Propostas</h1>
//             <p className="text-muted-foreground">Gerencie suas propostas para licitações</p>
//           </div>
//         </div>

//         <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//           <div className="flex items-center gap-2">
//             <AlertCircle className="h-5 w-5 text-red-600" />
//             <p className="text-sm text-red-800">
//               <strong>Erro ao carregar dados:</strong> {errorMessage}
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minhas Propostas</h1>
          <p className="text-muted-foreground">
            Gerencie suas propostas para licitações
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/supplier/tenders">
            <Plus className="mr-2 h-4 w-4" />
            Nova Proposta
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals && proposals.length > 0 ? (
          proposals.map((proposal) => (
            <SupplierProposalCard 
              key={proposal.id} 
              proposal={proposal}
            />
          ))
        ) : (
          <div className="col-span-full p-8 text-center border rounded-lg bg-muted">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma proposta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não enviou nenhuma proposta para licitações.
            </p>
            <Button asChild>
              <Link href="/dashboard/supplier/tenders">
                <Plus className="mr-2 h-4 w-4" />
                Buscar Licitações para Participar
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
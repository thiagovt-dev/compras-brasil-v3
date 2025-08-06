import { Suspense } from "react";
import { getSessionWithProfile } from "@/lib/actions/authAction";
import { fetchUserProposals } from "@/lib/actions/supplierAction";
import SupplierProposalsList from "@/components/supplier/supplier-proposals-list";
import SupplierProposalsLoading from "./loading";

export default async function SupplierProposalsPage() {
  const sessionData = await getSessionWithProfile();

  if (!sessionData?.user) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <p className="text-muted-foreground">
            Você precisa estar logado para visualizar suas propostas.
          </p>
        </div>
      </div>
    );
  }

  if (sessionData.profile?.profile_type !== "supplier") {
    return (
      <div className="container py-6">
        <div className="text-center">
          <p className="text-muted-foreground">
            Apenas fornecedores podem visualizar propostas.
          </p>
        </div>
      </div>
    );
  }

  const proposalsResult = await fetchUserProposals(sessionData.user.id);
  const proposals = proposalsResult.success ? proposalsResult.data || [] : [];


  return (
    <div className=" py-6 space-y-6">
      <Suspense fallback={<SupplierProposalsLoading />}>
        <SupplierProposalsList 
          proposals={proposals}
        />
      </Suspense>
    </div>
  );
}
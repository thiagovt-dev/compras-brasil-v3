import { Suspense } from "react";
import { getSessionWithProfile } from "@/lib/actions/authAction";
import SupplierDashboardClient from "@/components/supplier/supplier-dashboard-stats";
import SupplierDashboardLoading from "./loading";
import { fetchSupplierDashboardStats, fetchSupplierRecentActivities } from "@/lib/actions/supplierAction";

export default async function SupplierDashboard() {
  // const sessionData = await getSessionWithProfile();
  // console.log("Session Data:", sessionData);

  // if (!sessionData?.user) {
  //   return (
  //     <div className="space-y-6">
  //       <div>
  //         <h1 className="text-3xl font-bold tracking-tight">Dashboard do Fornecedor</h1>
  //         <p className="text-muted-foreground">Você precisa estar logado para acessar o dashboard</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (sessionData.profile?.profile_type !== "supplier") {
  //   return (
  //     <div className="space-y-6">
  //       <div>
  //         <h1 className="text-3xl font-bold tracking-tight">Dashboard do Fornecedor</h1>
  //         <p className="text-muted-foreground">Apenas fornecedores podem acessar este dashboard</p>
  //       </div>
  //     </div>
  //   );
  // }

  const [statsResult, activitiesResult] = await Promise.all([
    fetchSupplierDashboardStats(),
    fetchSupplierRecentActivities()
  ]);

  const stats = statsResult.success && statsResult.data ? statsResult.data : {
    activeTenders: 0,
    totalProposals: 0,
    activeProposals: 0,
    upcomingSessions: 0,
    totalValue: 0,
    trends: {
      newProposalsThisWeek: 0,
      newTendersToday: 0,
    }
  };

  const activities = activitiesResult.success && activitiesResult.data ? activitiesResult.data : [];

  const hasError = !statsResult.success || !activitiesResult.success;
  const errorMessage = statsResult.success ? activitiesResult.error : statsResult.error;

  return (
    <div className="space-y-6">
      <Suspense fallback={<SupplierDashboardLoading />}>
        <SupplierDashboardClient
          stats={stats}
          activities={activities}
          hasError={hasError}
          errorMessage={errorMessage}
        />
      </Suspense>
    </div>
  );
}
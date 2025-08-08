import { fetchAllAgencies } from "@/lib/actions/agencyAction";
import { AgencyTable } from "@/components/agency/agency-table";

export default async function AgenciesPage() {
  const result = await fetchAllAgencies();
  const agencies = result.success && Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Órgãos Públicos</h1>
        <p className="text-muted-foreground">
          Gerencie todos os órgãos públicos cadastrados no sistema.
        </p>
      </div>
      <AgencyTable agencies={agencies} />
    </div>
  );
}
import { fetchAllSuppliers } from "@/lib/actions/supplierAction";
import { SupplierTable } from "@/components/supplier/supplier-table";

export default async function SuppliersPage() {
  const result = await fetchAllSuppliers();
  const suppliers = result.success && Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
      <SupplierTable suppliers={suppliers} />
    </div>
  );
}
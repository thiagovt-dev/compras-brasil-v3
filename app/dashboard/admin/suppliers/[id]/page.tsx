import { fetchSupplierById, fetchSupplierDocuments, getSignedUrl, fetchSupplySegments } from "@/lib/actions/supplierAction";
import { SupplierDetailCard } from "@/components/supplier/supplier-detail-card";
import { SupplierDocumentsTable } from "@/components/supplier/supplier-documents-table";

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const result = await fetchSupplierById(id);
  const supplier = result.success ? result.data : null;

  const segmentsResult = await fetchSupplySegments();
  const allSegments = segmentsResult.success ? segmentsResult.data : [];

  const supplyLineNames = Array.isArray(supplier?.supply_lines)
    ? supplier.supply_lines
        .map((segId: string) => allSegments?.find((s: any) => s.id === segId)?.name)
        .filter(Boolean)
    : [];

  const docsResult = await fetchSupplierDocuments(id);
  const documents = docsResult.success ? docsResult.data : [];
  for (const doc of documents as any) {
    doc.signedUrl = await getSignedUrl(doc.file_path);
  }

  if (!supplier) {
    return <div className="text-red-500 text-lg">Fornecedor não encontrado.</div>;
  }

  return (
    <div className="space-y-8 max-w-full mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Detalhes do Fornecedor</h1>
      <SupplierDetailCard supplier={{ ...supplier, supply_line_names: supplyLineNames }} />
      <SupplierDocumentsTable documents={documents || []} />
    </div>
  );
}
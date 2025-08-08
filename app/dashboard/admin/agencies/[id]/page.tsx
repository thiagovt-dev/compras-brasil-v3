import { fetchAgencyById, fetchAgencyDocuments } from "@/lib/actions/agencyAction";
import { getSignedUrl } from "@/lib/actions/supplierAction";
import { AgencyDetailCard } from "@/components/agency/agency-detail-card";
import { AgencyDocumentsTable } from "@/components/agency/agency-documents-table";

export default async function AgencyDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const result = await fetchAgencyById(id);
  const agency = result.success ? result.data : null;

  const docsResult = await fetchAgencyDocuments(id);
  const documents = docsResult.success ? docsResult.data : [];

  for (const doc of documents as any[]) {
    doc.signedUrl = await getSignedUrl(doc.file_path);
  }

  if (!agency) {
    return <div className="text-red-500 text-lg">Órgão não encontrado.</div>;
  }

  return (
    <div className="space-y-8 max-w-full mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detalhes do Órgão Público</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie as informações do órgão público.
        </p>
      </div>
      <AgencyDetailCard agency={agency} />
      <AgencyDocumentsTable documents={documents || []} />
    </div>
  );
}
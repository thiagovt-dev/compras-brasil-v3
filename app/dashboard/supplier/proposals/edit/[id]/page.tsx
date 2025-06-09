import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ProposalForm } from "@/components/proposal-form";

interface EditProposalPageProps {
  params: {
    id: string;
  };
}

export default async function EditProposalPage({ params }: EditProposalPageProps) {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.profile_type !== "supplier") {
    redirect("/dashboard");
  }

  // Get proposal details
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select(
      `
      *,
      tender:tenders(id, status)
    `
    )
    .eq("id", params.id)
    .eq("supplier_id", profile.id)
    .eq("status", "draft")
    .single();

  if (error || !proposal) {
    redirect("/dashboard/supplier/proposals");
  }

  // Check if tender is still active
  if (proposal.tender?.status !== "active") {
    redirect("/dashboard/supplier/proposals");
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Proposta</h1>
        <p className="text-muted-foreground">Atualize os dados da sua proposta</p>
      </div>

      <ProposalForm tenderId={proposal.tender_id} initialData={proposal} />
    </div>
  );
}

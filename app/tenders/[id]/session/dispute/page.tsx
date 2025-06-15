"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import DisputeRoom from "@/components/dispute-room";

export default function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClientSupabaseClient();

  const [isLoading, setIsLoading] = useState(true);
  const [tender, setTender] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuctioneer, setIsAuctioneer] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [isCitizen, setIsCitizen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push(`/login?callbackUrl=/tenders/${resolvedParams.id}/session/dispute`);
          return;
        }

        setUserId(session.user.id);

        // Fetch tender data
        const { data: tenderData, error: tenderError } = await supabase
          .from("tenders")
          .select(
            `
            *,
            agency:agencies(*),
            lots:tender_lots(
              *,
              items:tender_items(*)
            )
          `
          )
          .eq("id", resolvedParams.id)
          .single();

        if (tenderError || !tenderData) {
          router.push(`/dashboard/tenders/${resolvedParams.id}`);
          return;
        }

        setTender(tenderData);

        // Fetch user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(profileData);

        // Check if user is auctioneer
        const { data: teamMember } = await supabase
          .from("tender_team")
          .select("id, role")
          .eq("tender_id", resolvedParams.id)
          .eq("user_id", session.user.id)
          .single();

        const auctioneeerRole =
          teamMember?.role === "pregoeiro" || teamMember?.role === "auctioneer";
        setIsAuctioneer(auctioneeerRole);

        // Check if user is a supplier
        const { data: supplierParticipation } = await supabase
          .from("tender_suppliers")
          .select("*")
          .eq("tender_id", resolvedParams.id)
          .eq("user_id", session.user.id)
          .single();

        setIsSupplier(!!supplierParticipation);

        // Check if user is a citizen (can view but not participate)
        const citizen =
          profileData?.role === "citizen" || (!auctioneeerRole && !supplierParticipation);
        setIsCitizen(citizen);
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push(`/dashboard/tenders/${resolvedParams.id}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, router, supabase]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!tender) {
    return null; // Will redirect in useEffect
  }

  return (
    <DisputeRoom
      tender={tender}
      isAuctioneer={isAuctioneer}
      isSupplier={isSupplier}
      isCitizen={isCitizen}
      userId={userId || ""}
      profile={profile}
    />
  );
}
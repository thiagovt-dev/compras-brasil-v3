"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import DisputeRoom from "@/components/dispute-room"

export default function DisputePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [tender, setTender] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isAuctioneer, setIsAuctioneer] = useState(false)
  const [isSupplier, setIsSupplier] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push(`/login?callbackUrl=/tenders/${params.id}/session/dispute`)
          return
        }
        
        setUserId(session.user.id)
        
        // Fetch tender data
        const { data: tenderData, error: tenderError } = await supabase
          .from("tenders")
          .select(`
            *,
            agency:agencies(*),
            lots:tender_lots(
              *,
              items:tender_items(*)
            )
          `)
          .eq("id", params.id)
          .single()
        
        if (tenderError || !tenderData) {
          router.push(`/tenders/${params.id}/session`)
          return
        }
        
        setTender(tenderData)
        
        // Fetch user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          
        setProfile(profileData)
        
        // Check if user is auctioneer
        const { data: teamMember } = await supabase
          .from("tender_team")
          .select("id, role")
          .eq("tender_id", params.id)
          .eq("user_id", session.user.id)
          .single()
          
        setIsAuctioneer(teamMember?.role === "pregoeiro")
        
        // Check if user is a supplier
        const { data: supplierParticipation } = await supabase
          .from("tender_suppliers")
          .select("*")
          .eq("tender_id", params.id)
          .eq("user_id", session.user.id)
          .single()
          
        setIsSupplier(!!supplierParticipation)
        
        // If not auctioneer or supplier, redirect
        if (
          (teamMember?.role !== "contracting_agent" || teamMember.role !== "auctioneer") &&
          !supplierParticipation
        ) {
          router.push(`/tenders/${params.id}/session`);
          return;
        }
        
      } catch (error) {
        console.error("Error fetching data:", error)
        router.push(`/tenders/${params.id}/session`)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [params.id, router, supabase])
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }
  
  // Redirect if conditions aren't met
  if (!isAuctioneer && !isSupplier) {
    return null // We'll redirect in the useEffect
  }
  
  return (
    <DisputeRoom
      tender={tender}
      isAuctioneer={isAuctioneer}
      isSupplier={isSupplier}
      userId={userId || ""}
      profile={profile}
    />
  )
}
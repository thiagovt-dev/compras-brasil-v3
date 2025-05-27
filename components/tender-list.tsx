"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { TenderCard } from "@/components/tender-card"
import { TenderFilters } from "@/components/tender-filters"
import { TenderSort } from "@/components/tender-sort"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface TenderListProps {
  initialTenders?: any[]
  showAgency?: boolean
  agencyId?: string
  showFilters?: boolean
  showSort?: boolean
  limit?: number
  className?: string
}

export function TenderList({
  initialTenders = [],
  showAgency = true,
  agencyId,
  showFilters = true,
  showSort = true,
  limit = 50,
  className = "",
}: TenderListProps) {
  const supabase = createClientComponentClient()
  const [tenders, setTenders] = useState<any[]>(initialTenders)
  const [agencies, setAgencies] = useState<any[]>([])
  const [loading, setLoading] = useState(initialTenders.length === 0)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    modality: "",
    category: "",
    agency_id: agencyId || "",
    status: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    onlyOpen: true,
  })
  const [sort, setSort] = useState({
    field: "opening_date",
    direction: "asc" as "asc" | "desc",
  })

  // Fetch agencies for filters
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const { data, error } = await supabase.from("agencies").select("id, name").eq("status", "active")

        if (error) throw error

        setAgencies(data || [])
      } catch (error: any) {
        console.error("Error fetching agencies:", error)
      }
    }

    fetchAgencies()
  }, [supabase])

  // Fetch tenders with filters and sorting
  const fetchTenders = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      let query = supabase
        .from("tenders")
        .select("*")
        .order(sort.field, { ascending: sort.direction === "asc" })
        .limit(limit)

      // Apply filters
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        )
      }

      if (filters.modality) {
        query = query.eq("modality", filters.modality)
      }

      if (filters.category) {
        query = query.eq("category", filters.category)
      }

      if (filters.agency_id) {
        query = query.eq("agency_id", filters.agency_id)
      }

      if (filters.status) {
        query = query.eq("status", filters.status)
      } else if (filters.onlyOpen) {
        query = query.eq("status", "active")
      }

      if (filters.startDate) {
        query = query.gte("opening_date", filters.startDate.toISOString())
      }

      if (filters.endDate) {
        // Add one day to include the end date
        const endDate = new Date(filters.endDate)
        endDate.setDate(endDate.getDate() + 1)
        query = query.lt("opening_date", endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Buscar agencies separadamente se showAgency for true
      let tendersWithAgencies = data || []
      if (showAgency && data && data.length > 0) {
        const agencyIds = [...new Set(data.map((tender) => tender.agency_id).filter(Boolean))]

        if (agencyIds.length > 0) {
          const { data: agenciesData } = await supabase.from("agencies").select("id, name").in("id", agencyIds)

          // Mapear agencies para os tenders
          tendersWithAgencies = data.map((tender) => ({
            ...tender,
            agency: agenciesData?.find((agency) => agency.id === tender.agency_id) || null,
          }))
        }
      }

      setTenders(tendersWithAgencies)
    } catch (error: any) {
      console.error("Error fetching tenders:", error)
      toast({
        title: "Erro ao carregar licitações",
        description: error.message || "Ocorreu um erro ao carregar as licitações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch tenders when filters or sort change
  useEffect(() => {
    fetchTenders()
  }, [filters, sort])

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSort: { field: string; direction: "asc" | "desc" }) => {
    setSort(newSort)
  }

  const handleRefresh = () => {
    fetchTenders(true)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showFilters && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TenderFilters onFilterChange={handleFilterChange} agencies={agencies} />
          <div className="flex items-center gap-2">
            {showSort && <TenderSort onSortChange={handleSortChange} currentSort={sort} />}
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tenders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenders.map((tender) => (
            <TenderCard key={tender.id} tender={tender} showAgency={showAgency} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">Nenhuma licitação encontrada.</p>
          <p className="text-sm text-muted-foreground mt-2">Tente ajustar os filtros ou criar uma nova licitação.</p>
        </div>
      )}
    </div>
  )
}

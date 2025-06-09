import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Tender {
  id: string
  status: string
  // Add other properties as needed
}

interface Props {
  params: {
    id: string
  }
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

const TenderDetailPage = async ({ params, searchParams }: Props) => {
  const tenderId = params.id

  // Mock tender data (replace with actual data fetching)
  const tender: Tender = {
    id: tenderId,
    status: "active", // Or "inactive", "completed", etc.
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tender Details</h1>
      <p>Tender ID: {tender.id}</p>
      <p>Status: {tender.status}</p>

      {/* Link para Sala de Disputa */}
      {tender.status === "active" && (
        <div className="mt-6">
          <Link href={`/tenders/${tender.id}/session/dispute`}>
            <Button className="w-full" size="lg">
              Acessar Sala de Disputa
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default TenderDetailPage

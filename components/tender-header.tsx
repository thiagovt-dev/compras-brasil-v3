import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TenderHeaderProps {
  title: string
  number: string
  agency: string
  id: string
}

export function TenderHeader({ title, number, agency, id }: TenderHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/tenders/${id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar para Licitação</span>
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
          <span>Nº {number}</span>
          {agency && <span>• {agency}</span>}
        </div>
      </div>
    </div>
  )
}

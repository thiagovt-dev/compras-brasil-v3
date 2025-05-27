import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SignDocumentLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Tabs defaultValue="sign">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign">Assinar Documento</TabsTrigger>
          <TabsTrigger value="history">Histórico de Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="sign" className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              <Skeleton className="h-10 w-full mt-4" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

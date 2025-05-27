import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function TenderResultsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[250px] mt-2" />
      </div>

      <div className="flex items-center space-x-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-[100px]" />
        ))}
      </div>

      <Separator />

      <Tabs defaultValue="winners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="winners">Vencedores</TabsTrigger>
          <TabsTrigger value="savings">Economia</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="winners" className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[300px] mt-2" />
            </CardHeader>
            <CardContent>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-4">
                  <Skeleton className="h-6 w-[150px] mb-2" />
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="flex justify-between items-center border-b pb-2">
                        <Skeleton className="h-5 w-[200px]" />
                        <Skeleton className="h-5 w-[100px]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

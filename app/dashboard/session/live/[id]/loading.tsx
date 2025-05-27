import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LiveSessionLoading() {
  return (
    <div className="container mx-auto py-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-8 w-[300px]" />
              <Skeleton className="h-4 w-[250px] mt-2" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-[100px]" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-4 w-[200px]" />
            <div className="flex items-center space-x-4">
              {Array(4)
                .fill(null)
                .map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8 rounded-md" />
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" disabled>
                Chat
              </TabsTrigger>
              <TabsTrigger value="documents" disabled>
                Documentos
              </TabsTrigger>
              <TabsTrigger value="proposals" disabled>
                Propostas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-4 border rounded-lg p-4 h-[600px]">
              <div className="space-y-4 h-full">{/* Chat content skeleton */}</div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-1">{/* Sidebar content skeleton */}</div>
      </div>
    </div>
  )
}

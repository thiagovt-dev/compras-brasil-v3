import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function SupportManageLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-[300px]" />

        <Card>
          <CardHeader className="px-6 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-[200px]" />
                      <Skeleton className="h-5 w-[80px]" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-[60px]" />
                      <Skeleton className="h-5 w-[100px]" />
                    </div>
                  </div>

                  <Skeleton className="mt-2 h-4 w-full" />

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>

                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-[50px]" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Skeleton className="h-9 w-[100px]" />
                    <Skeleton className="h-9 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <Skeleton className="h-4 w-[200px]" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-[80px]" />
                <Skeleton className="h-9 w-[80px]" />
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

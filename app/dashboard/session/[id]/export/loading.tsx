import { Skeleton } from "@/components/ui/skeleton"

export default function ExportSessionLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Skeleton className="h-[600px] w-full" />
        </div>
        <div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  )
}

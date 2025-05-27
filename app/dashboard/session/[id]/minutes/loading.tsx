import { Skeleton } from "@/components/ui/skeleton"

export default function SessionMinutesLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="grid grid-cols-1 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

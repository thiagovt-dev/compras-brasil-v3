import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SubscriptionPlanSkeletonProps {
  count?: number
}

export function SubscriptionPlanSkeleton({ count = 3 }: SubscriptionPlanSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-[120px]" />
            <CardDescription>
              <Skeleton className="h-4 w-[200px] mt-2" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[150px] mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </>
  )
}

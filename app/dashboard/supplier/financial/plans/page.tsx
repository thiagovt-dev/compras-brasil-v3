import { Suspense } from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SubscriptionPlanSkeleton } from "@/components/subscription-plan-skeleton"

export default async function SubscriptionPlansPage() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch subscription plans
  const { data: plans } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("price")

  // Fetch current user subscription
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let currentSubscription = null
  if (user) {
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("*, plan:subscription_plans(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    currentSubscription = subscription
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planos de Assinatura</h1>
        <p className="text-muted-foreground">Escolha o plano ideal para o seu negócio</p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Suspense fallback={<SubscriptionPlanSkeleton count={3} />}>
          {plans?.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id
            const features = (plan.features as string[]) || []

            return (
              <Card key={plan.id} className={isCurrentPlan ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(plan.price)}
                    </span>
                    <span className="text-muted-foreground">/{plan.billing_cycle}</span>
                  </div>

                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" asChild>
                      <a href={`/dashboard/supplier/financial/subscribe?plan=${plan.id}`}>Assinar Plano</a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </Suspense>
      </div>
    </div>
  )
}

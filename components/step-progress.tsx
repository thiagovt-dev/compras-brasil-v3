import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepProgressProps {
  steps: string[]
  currentStep: number
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep - 1
          const isLast = index === steps.length - 1

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium",
                    isCompleted
                      ? "border-primary bg-primary text-white"
                      : isCurrent
                        ? "border-primary text-primary"
                        : "border-gray-300 text-gray-500",
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCompleted || isCurrent ? "text-primary" : "text-gray-500",
                  )}
                >
                  {step}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 w-full min-w-[3rem] max-w-[8rem] flex-1",
                    index < currentStep - 1 ? "bg-primary" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { STEPS } from "./constants"

type StepperProps = {
  activeStep: number
  onStepChange: (index: number) => void
}

export function Stepper({ activeStep, onStepChange }: StepperProps) {
  return (
    <Card className="border-none bg-gradient-to-r from-card via-background to-card text-foreground shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Train Your Krira AI Assistant</CardTitle>
            <CardDescription className="text-muted-foreground">
              Follow the guided workflow to upload data, configure embeddings, and deploy a production-ready chatbot.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur">
            Guided Mode
          </Badge>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 grid-cols-6">
            {STEPS.map((step, index) => {
              const status = index === activeStep ? "active" : index < activeStep ? "completed" : "pending"
              return (
                <button
                  key={step.title}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-3 text-left transition",
                    status === "active"
                      ? "border-primary/80 bg-primary/10"
                      : status === "completed"
                        ? "border-emerald-400/30 bg-emerald-400/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                  )}
                  onClick={() => onStepChange(index)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                        status === "active"
                          ? "border-primary bg-primary text-white"
                          : status === "completed"
                            ? "border-emerald-400 bg-emerald-400 text-emerald-950"
                            : "border-white/30 bg-transparent text-white/70"
                      )}
                    >
                      {status === "completed" ? <CheckIcon className="h-4 w-4" /> : index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{step.title}</span>
                      <span className="text-xs text-muted-foreground">{step.subtitle}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <Progress value={(activeStep / (STEPS.length - 1)) * 100} className="h-2 bg-white/10" />
        </div>
      </CardHeader>
    </Card>
  )
}

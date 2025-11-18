"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  CheckCircle2,
  CreditCard,
  Zap,
  Sparkle,
  Star,
  Lock,
  Shield,
  Check,
  Minus,
  ArrowRight
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type Plan = {
  id: string
  name: string
  priceMonthly: number
  priceAnnual?: number
  badge?: string
  description: string
  features: { label: string; available: boolean }[]
  highlight?: boolean
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link"
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    description: "Great for experimentation and personal projects.",
    features: [
      { label: "1 Chatbot", available: true },
      { label: "No API access", available: false },
      { label: "Krira watermark", available: true },
      { label: "30 queries/month", available: true },
      { label: "Community support", available: true },
      { label: "Internal vector DB", available: true },
    ],
    buttonVariant: "outline",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 35,
    description: "Scale assistants with API integrations and analytics.",
    badge: "Popular",
    highlight: true,
    features: [
      { label: "5 Chatbots", available: true },
      { label: "Full API access", available: true },
      { label: "Custom watermark", available: true },
      { label: "5,000 queries/month", available: true },
      { label: "Email support", available: true },
      { label: "Bring your own vector store", available: true },
    ],
    buttonVariant: "default",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 135,
    description: "Advanced governance for large teams and workloads.",
    features: [
      { label: "Unlimited chatbots", available: true },
      { label: "24/7 priority support", available: true },
      { label: "Custom SLAs", available: true },
      { label: "Fine-tuned models", available: true },
      { label: "Dedicated CSM", available: true },
      { label: "SOC2, HIPAA compliance", available: true },
    ],
    buttonVariant: "secondary",
  },
  {
    id: "startup",
    name: "Startup Annual",
    priceMonthly: 1365,
    priceAnnual: 1365,
    badge: "Best Value",
    description: "Save big with annual billing for high-growth teams.",
    features: [
      { label: "All enterprise features", available: true },
      { label: "Annual billing", available: true },
      { label: "$255 yearly savings", available: true },
      { label: "Dedicated onboarding", available: true },
      { label: "Advanced analytics", available: true },
      { label: "Sandbox environments", available: true },
    ],
    buttonVariant: "outline",
  },
]

const FEATURE_COMPARISON = [
  { feature: "Chatbot seats", free: "1", pro: "5", enterprise: "Unlimited", startup: "Unlimited" },
  { feature: "API access", free: false, pro: true, enterprise: true, startup: true },
  { feature: "Watermark control", free: false, pro: true, enterprise: true, startup: true },
  { feature: "Vector store", free: "Managed", pro: "BYO", enterprise: "BYO", startup: "BYO" },
  { feature: "Usage analytics", free: "Basic", pro: "Advanced", enterprise: "Advanced", startup: "Advanced" },
  { feature: "Support", free: "Community", pro: "Email", enterprise: "24/7 priority", startup: "Priority" },
]

const FAQS = [
  {
    question: "Can I upgrade or downgrade anytime?",
    answer: "Yes, plan changes take effect immediately and pro-rate on your next invoice.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "Krira accepts major credit cards, ACH, and invoicing for enterprise tiers.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Annual plans have a 30-day money-back guarantee. Monthly plans are non-refundable.",
  },
  {
    question: "What happens if I exceed my query limit?",
    answer: "We'll notify you when you reach 80% and 100% of your limit. You can upgrade or pay for overages at standard rates.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function PricingTab() {
  const [annualBilling, setAnnualBilling] = React.useState(false)
  const [openPayment, setOpenPayment] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null)

  const currentPlanUsage = {
    plan: "Pro",
    renewal: "Dec 12, 2025",
    usage: [
      { label: "Chatbots", value: 2, limit: 5, icon: Zap },
      { label: "API calls", value: 9802, limit: 15000, icon: Sparkle },
      { label: "Monthly queries", value: 18245, limit: 25000, icon: Star },
    ],
  }

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlan(plan)
    setOpenPayment(true)
  }

  return (
    <motion.div
      className="space-y-8 p-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Current Plan Usage Section */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
            <div className="space-y-1">
              <Badge variant="outline" className="w-fit gap-1.5 border-primary/30 bg-primary/10 text-primary">
                <Star className="h-3.5 w-3.5 fill-primary/20" /> Current Plan
              </Badge>
              <CardTitle className="text-2xl flex items-center gap-2">
                {currentPlanUsage.plan} Plan
                <span className="text-sm font-normal text-muted-foreground">
                  (Renews {currentPlanUsage.renewal})
                </span>
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <CreditCard className="h-4 w-4" /> Invoices
              </Button>
              <Button variant="secondary" size="sm" className="gap-2 h-9">
                <Lock className="h-4 w-4" /> Manage Billing
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3 pt-6">
            {currentPlanUsage.usage.map((item) => {
              const percentage = Math.min((item.value / item.limit) * 100, 100)
              const Icon = item.icon
              return (
                <div key={item.label} className="group space-y-3 rounded-xl border bg-card/50 p-4 transition-colors hover:bg-card hover:shadow-sm">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium tabular-nums">
                      {item.value.toLocaleString()} <span className="text-muted-foreground">/ {item.limit.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(0)}% used</span>
                      {percentage > 80 && <span className="text-amber-500 font-medium">Near limit</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pricing Toggle */}
      <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-4 py-4 text-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Upgrade your workspace</h2>
          <p className="text-muted-foreground">Unlock advanced features and higher limits.</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border bg-muted/50 p-1 pr-4">
          <div className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            !annualBilling ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
          )}>
            Monthly
          </div>
          <Switch
            checked={annualBilling}
            onCheckedChange={setAnnualBilling}
            className="data-[state=checked]:bg-primary"
          />
          <div className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            annualBilling ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
          )}>
            Annual
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
              -20%
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div 
        variants={itemVariants} 
        className={cn(
          "grid gap-6 items-start max-w-5xl mx-auto",
          annualBilling 
            ? "md:grid-cols-1 lg:grid-cols-1 justify-items-center" 
            : "md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {PLANS.filter(plan => annualBilling ? plan.id === "startup" : plan.id !== "startup").map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="h-full"
          >
            <Card
              className={cn(
                "relative h-full flex flex-col overflow-hidden transition-all duration-300",
                plan.highlight
                  ? "border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/50 hover:shadow-md"
              )}
            >
              {plan.highlight && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
              )}
              <CardHeader className="space-y-2 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                  {plan.badge && (
                    <Badge variant={plan.highlight ? "default" : "secondary"} className="font-medium">
                      {plan.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {annualBilling && plan.priceAnnual ? `$${plan.priceAnnual}` : `$${plan.priceMonthly}`}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {plan.id === "startup" ? "/year" : "/month"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Includes:</div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature.label} className="flex items-start gap-3">
                        {feature.available ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <Minus className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={cn(feature.available ? "text-foreground/90" : "text-muted-foreground/60")}>
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  variant={plan.buttonVariant || "default"}
                  className={cn("w-full gap-2", plan.highlight && "shadow-md shadow-primary/20")}
                  onClick={() => handleUpgrade(plan)}
                >
                  {plan.id === "free" ? "Current Plan" : "Upgrade to " + plan.name}
                  {plan.id !== "free" && <ArrowRight className="h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Feature Comparison */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Compare Features</CardTitle>
            <CardDescription>Detailed breakdown of what&apos;s included in each plan.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px]">Feature</TableHead>
                  <TableHead className="text-center">Free</TableHead>
                  <TableHead className="text-center text-primary font-bold">Pro</TableHead>
                  <TableHead className="text-center">Enterprise</TableHead>
                  <TableHead className="text-center">Startup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FEATURE_COMPARISON.map((row, i) => (
                  <TableRow key={row.feature} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell className="text-center">
                      {typeof row.free === "boolean" ? (
                        row.free ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground/30" />
                      ) : row.free}
                    </TableCell>
                    <TableCell className="text-center font-medium bg-primary/5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground/30" />
                      ) : row.pro}
                    </TableCell>
                    <TableCell className="text-center">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground/30" />
                      ) : row.enterprise}
                    </TableCell>
                    <TableCell className="text-center">
                      {typeof row.startup === "boolean" ? (
                        row.startup ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground/30" />
                      ) : row.startup}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQs */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-2">
          <h3 className="text-xl font-bold">Frequently Asked Questions</h3>
          <p className="text-sm text-muted-foreground">
            Have more questions? Contact our support team or check our documentation.
          </p>
          <Button variant="link" className="px-0 text-primary">
            Contact Support <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="md:col-span-8">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.div>

      {/* Payment Dialog */}
      <Dialog open={openPayment} onOpenChange={setOpenPayment}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Upgrade</DialogTitle>
            <DialogDescription>
              You are about to upgrade to the <span className="font-medium text-foreground">{selectedPlan?.name}</span> plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Subscription</div>
                  <div className="text-xs text-muted-foreground">{annualBilling ? "Billed annually" : "Billed monthly"}</div>
                </div>
                <div className="text-xl font-bold">
                  {annualBilling && selectedPlan?.priceAnnual
                    ? `$${selectedPlan.priceAnnual}`
                    : `$${selectedPlan?.priceMonthly ?? 0}`}
                  <span className="text-sm font-normal text-muted-foreground">/{annualBilling ? "yr" : "mo"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Secure SSL Encrypted Payment
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Card Information</Label>
                <Input placeholder="0000 0000 0000 0000" />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="MM/YY" />
                  <Input placeholder="CVC" />
                  <Input placeholder="Zip" />
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label>Promo Code</Label>
                  <Input placeholder="Enter code" className="h-9" />
                </div>
                <Button variant="secondary" className="mt-6 h-9">Apply</Button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpenPayment(false)}>
              Cancel
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-md">
              <Sparkle className="h-4 w-4" /> Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

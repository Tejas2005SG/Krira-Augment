import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

const plans = [
    {
        id: "free",
        name: "Free",
        badge: "Hobby",
        description: "Best for hobby projects and testing the platform.",
        price: "$0",
        period: "/ month",
        features: [
            "100 requests / month",
            "50 MB total storage pool",
            "Internal vector DB",
            "Internal embedding model",
            "Analytics dashboard",
            "Community support",
        ],
        buttonText: "Get Started",
        buttonVariant: "outline",
        isPopular: false
    },
    {
        id: "startup_monthly",
        name: "Starter",
        badge: "Most popular",
        description: "For individuals and teams that need higher storage.",
        price: "$49",
        period: "/ month",
        features: [
            "5,000 requests / month",
            "5 GB total storage pool",
            "Bring your own vector store",
            "Bring your own embedding model",
            "Full analytics + API",
            "Standard email support",
        ],
        buttonText: "Subscribe",
        buttonVariant: "default",
        isPopular: true
    },
    {
        id: "enterprise_monthly",
        name: "Enterprise",
        badge: "Maximum Power",
        description: "For teams that need massive infrastructure and storage.",
        price: "$200",
        period: "/ month",
        features: [
            "15,000 requests / month",
            "20 GB total storage pool",
            "Bring your own vector store",
            "Bring your own embedding model",
            "Full analytics + API",
            "Priority email support",
        ],
        buttonText: "Subscribe",
        buttonVariant: "outline",
        isPopular: false
    }
]

export default function Pricing() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center mb-16">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl space-mono-regular">Pricing that Scales with You</h1>
                    <p className="text-muted-foreground space-mono-regular">
                        Transparent pricing for every stage of your growth. Start free and scale as you need.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`relative flex flex-col ${plan.isPopular ? 'lg:scale-105 z-10' : ''}`}>
                            {plan.isPopular && (
                                <span className="absolute inset-x-0 -top-3 mx-auto z-20 flex h-6 w-fit items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground ring-1 ring-inset ring-primary/20 shadow-sm">
                                    {plan.badge}
                                </span>
                            )}
                            <Card
                                className={`group flex flex-col relative h-full transition-all duration-300 hover:shadow-xl overflow-hidden ${plan.isPopular
                                    ? 'border-primary shadow-lg bg-background'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:-translate-y-1 bg-background'
                                    }`}
                            >
                                {/* Aurora glow effect on card */}
                                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-2xl" />
                                    <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl" />
                                </div>

                                <CardHeader>
                                    <div className="flex justify-between items-center mb-2">
                                        <CardTitle className="font-medium text-xl space-mono-regular font-bold">{plan.name}</CardTitle>
                                        {!plan.isPopular && (
                                            <Badge variant="secondary" className="text-[10px] font-normal">{plan.badge}</Badge>
                                        )}
                                    </div>
                                    <div className="my-4 space-mono-regular">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-muted-foreground ml-1 text-sm">{plan.period}</span>
                                    </div>
                                    <CardDescription className="text-sm h-12">{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <hr className="border-dashed" />
                                    <ul className="space-y-3 text-sm">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                                <Check className="size-4 shrink-0 text-primary mt-0.5" />
                                                <span className="leading-tight space-mono-regular">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter className="mt-auto pt-6">
                                    <Button
                                        asChild
                                        variant={plan.buttonVariant as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"}
                                        className="w-full space-mono-regular font-bold"
                                    >
                                        <Link href={plan.id === 'enterprise_monthly' ? '#' : '/signup'}>
                                            {plan.buttonText}
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

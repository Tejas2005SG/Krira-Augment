import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Star } from 'lucide-react'

const plans = [
    {
        id: "free",
        name: "Free",
        badge: "Hobby",
        description: "Best for hobby projects and testing the platform.",
        price: "$0",
        period: "/ month",
        features: [
            "Requests: 100 / mo",
            "Total Storage: 50 MB",
            "Unlimited pipelines",
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
            "Requests: 5,000 / mo",
            "Total Storage: 5.0 GB",
            "Unlimited pipelines",
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
        price: "$179",
        period: "/ month",
        features: [
            "Requests: 15,000 / mo",
            "Total Storage: 20.0 GB",
            "Unlimited pipelines",
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
                        <div key={plan.id} className={`relative flex flex-col ${plan.isPopular ? '' : ''}`}>
                            <Card
                                className={`group relative flex h-full flex-col border transition-all duration-300 hover:shadow-xl overflow-hidden ${plan.isPopular
                                    ? 'border-primary shadow-lg'
                                    : 'hover:border-primary/40'
                                    }`}
                            >
                                {/* Aurora glow effect on card */}
                                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-3xl" />
                                    <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl" />
                                </div>

                                {plan.isPopular && (
                                    <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30 z-10" />
                                )}

                                <CardHeader className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-semibold space-mono-regular">{plan.name}</CardTitle>
                                        {plan.badge && <Badge className="fira-mono-regular">{plan.badge}</Badge>}
                                    </div>
                                    <CardDescription className="fira-mono-regular">{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex flex-1 flex-col space-y-5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold space-mono-regular">{plan.price}</span>
                                        <span className="text-sm text-muted-foreground fira-mono-regular">{plan.period}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-foreground space-mono-regular">Includes</p>
                                        <ul className="space-y-2 text-sm text-muted-foreground fira-mono-regular">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        asChild
                                        variant={plan.id === 'startup_monthly' ? "default" : "outline"}
                                        className="w-full space-mono-regular"
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

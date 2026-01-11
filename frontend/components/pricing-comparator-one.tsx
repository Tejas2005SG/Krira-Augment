import { Button } from '@/components/ui/button'
import { Check, Minus, Sparkles, Star } from 'lucide-react'
import Link from 'next/link'

const tableData = [
    {
        feature: 'Monthly Requests',
        free: '100',
        starter: '5,000',
        enterprise: '15,000',
    },
    {
        feature: 'Total Storage Pool',
        free: '50 MB',
        starter: '5 GB',
        enterprise: '20 GB',
    },
    {
        feature: 'Vector Databases',
        free: 'Chroma',
        starter: 'Chroma, Pinecone',
        enterprise: 'Chroma, Pinecone',
    },
    {
        feature: 'AI Providers',
        free: 'OpenAI, Google, Deepseek',
        starter: 'All (+ Anthropic, Perplexity)',
        enterprise: 'All (+ Anthropic, Perplexity)',
    },
    {
        feature: 'Embedding Models',
        free: 'OpenAI Small, HuggingFace',
        starter: 'All (+ OpenAI Large)',
        enterprise: 'All (+ OpenAI Large)',
    },
    {
        feature: 'Analytics Dashboard',
        free: true,
        starter: true,
        enterprise: true,
    },
    {
        feature: 'API Access',
        free: true,
        starter: true,
        enterprise: true,
    },
    {
        feature: 'Remove Watermark',
        free: false,
        starter: true,
        enterprise: true,
    },
    {
        feature: 'Support',
        free: 'Community',
        starter: 'Standard (24h)',
        enterprise: 'Priority (24h)',
    },
]

export default function PricingComparator() {
    return (
        <section className="bg-muted py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="w-full overflow-auto lg:overflow-visible">
                    <table className="w-[200vw] border-separate border-spacing-x-3 md:w-full dark:[--color-muted:var(--color-zinc-900)]">
                        <thead className="bg-muted/95 sticky top-0">
                            <tr className="*:py-4 *:text-left *:font-medium *:space-mono-regular">
                                <th className="lg:w-2/5"></th>
                                <th className="space-y-3">
                                    <span className="block text-xl font-bold">Free</span>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="space-mono-regular font-bold">
                                        <Link href="#">Get Started</Link>
                                    </Button>
                                </th>
                                <th className="space-y-3">
                                    <span className="block text-xl font-bold">Starter</span>
                                    <Button asChild className="space-mono-regular font-bold">
                                        <Link href="/signup">Subscribe</Link>
                                    </Button>
                                </th>
                                <th className="space-y-3">
                                    <span className="block text-xl font-bold">Enterprise</span>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="space-mono-regular font-bold">
                                        <Link href="#">Subscribe</Link>
                                    </Button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="*:py-4">
                                <td className="flex items-center gap-2 font-medium space-mono-regular">
                                    <Star className="size-4" />
                                    <span>Core Features</span>
                                </td>
                                <td></td>
                                <td className="border-none px-4"></td>
                                <td></td>
                            </tr>
                            {tableData.map((row, index) => (
                                <tr
                                    key={index}
                                    className="*:border-b *:py-4 space-mono-regular text-sm">
                                    <td className="text-muted-foreground font-medium">{row.feature}</td>
                                    <td>
                                        {row.free === true ? (
                                            <Check
                                                className="text-primary size-5"
                                                strokeWidth={2.5}
                                            />
                                        ) : row.free === false ? (
                                            <Minus className="text-muted-foreground size-4" />
                                        ) : (
                                            <span className="text-foreground">{row.free}</span>
                                        )}
                                    </td>
                                    <td>
                                        {row.starter === true ? (
                                            <Check
                                                className="text-primary size-5"
                                                strokeWidth={2.5}
                                            />
                                        ) : row.starter === false ? (
                                            <Minus className="text-muted-foreground size-4" />
                                        ) : (
                                            <span className="text-foreground">{row.starter}</span>
                                        )}
                                    </td>
                                    <td>
                                        {row.enterprise === true ? (
                                            <Check
                                                className="text-primary size-5"
                                                strokeWidth={2.5}
                                            />
                                        ) : row.enterprise === false ? (
                                            <Minus className="text-muted-foreground size-4" />
                                        ) : (
                                            <span className="text-foreground">{row.enterprise}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

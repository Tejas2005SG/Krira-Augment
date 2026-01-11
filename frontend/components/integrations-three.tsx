'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Search, Zap, Shield, Database, Cpu, Layers } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Category = 'All' | 'LLM' | 'Vector Store' | 'Embedding' | 'Infrastructure'

const categories: Category[] = ['All', 'LLM', 'Vector Store', 'Embedding', 'Infrastructure']

const integrations = [

    {
        title: 'Pinecone',
        description: 'Scalable and managed vector database for high-throughput applications.',
        logo: '/pinecone.png',
        category: 'Vector Store',
        tags: ['Managed', 'Scalable'],
        className: 'rounded-lg bg-white p-1',
        featured: true
    },
    {
        title: 'Chroma',
        description: 'Open-source AI application database for building LLM apps.',
        logo: '/chroma.png',
        category: 'Vector Store',
        tags: ['Open Source', 'Local'],
        className: 'rounded-full',
        featured: false
    },
    {
        title: 'Hugging Face',
        description: 'The AI community building the future. Hub of models and datasets.',
        logo: '/huggingface.svg',
        category: 'Embedding',
        tags: ['Community', 'Hub'],
        className: '',
        featured: true
    },
    {
        title: 'DeepSeek',
        description: 'Advanced open-source LLMs with coding capabilities.',
        logo: '/deepseek-logo.png',
        category: 'LLM',
        tags: ['Open Source', 'Coding'],
        className: 'rounded-lg',
        featured: false
    },
    {
        title: 'OpenAI',
        description: 'Frontier models including GPT-4o for complex reasoning.',
        logo: '/openai.svg',
        category: 'LLM',
        tags: ['Popular', 'Frontier'],
        className: 'dark:invert',
        featured: true
    },
    {
        title: 'Anthropic',
        description: 'AI research and products that put safety at the frontier.',
        logo: '/anthropic-logo.webp',
        category: 'LLM',
        tags: ['Safety', 'Context Window'],
        className: 'rounded-lg bg-white p-1',
        featured: true
    },
    {
        title: 'Gemini',
        description: 'Multimodal AI models from Google DeepMind.',
        logo: '/google-logo.png',
        category: 'LLM',
        tags: ['Multimodal', 'Google'],
        className: 'rounded-full bg-white p-1',
        featured: true
    },
    {
        title: 'GLM',
        description: 'Open bilingual language models optimized for performance.',
        logo: '/glm-logo.png',
        category: 'LLM',
        tags: ['Bilingual', 'Open'],
        className: 'rounded-lg bg-white p-1',
        featured: false
    },
    {
        title: 'Perplexity',
        description: 'Real-time search and answer engine powered by LLMs.',
        logo: '/perplexity-logo.png',
        category: 'LLM',
        tags: ['Search', 'Real-time'],
        className: 'rounded-full',
        featured: false
    },
    {
        title: 'Krira Labs',
        description: 'End-to-end RAG infrastructure scaling to millions of documents.',
        logo: '/kriralabs-logo.png',
        category: 'Infrastructure',
        tags: ['RAG', 'Managed'],
        className: 'rounded-full bg-black p-0.5',
        featured: true
    }
]

export default function Integrations() {
    const [selectedCategory, setSelectedCategory] = useState<Category>('All')
    const [hoveredCard, setHoveredCard] = useState<string | null>(null)

    const filteredIntegrations = integrations.filter(
        item => selectedCategory === 'All' || item.category === selectedCategory
    )

    return (
        <section className="bg-zinc-50/50 py-24 md:py-32 dark:bg-black/20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-16 flex flex-col items-center text-center">
                    <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
                        Ecosystem
                    </Badge>
                    <h2 className="mb-6 space-mono-regular text-3xl font-bold tracking-tight md:text-5xl">
                        Integrate with your favorite tools
                    </h2>
                    <p className="max-w-2xl space-mono-regular text-lg text-muted-foreground">
                        Connect seamlessly with popular platforms and services to enhance your RAG workflow.
                    </p>

                    {/* Category Filter */}
                    <div className="mt-10 flex flex-wrap justify-center gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={cn(
                                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                                    selectedCategory === category
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                        : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div
                    layout
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                >
                    <AnimatePresence mode='popLayout'>
                        {filteredIntegrations.map((item) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                key={item.title}
                                className="h-full"
                            >
                                <Card
                                    className="group relative h-full overflow-hidden border-zinc-200 bg-background/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 dark:border-zinc-800 dark:hover:border-primary/20"
                                    onMouseEnter={() => setHoveredCard(item.title)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <div className="flex h-full flex-col">
                                        <div className="mb-6 flex items-start justify-between">
                                            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-background shadow-sm ring-1 ring-border">
                                                <Image
                                                    src={item.logo}
                                                    alt={item.title}
                                                    fill
                                                    className={`object-contain p-1 ${item.className}`}
                                                    unoptimized
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="mb-2 space-mono-regular text-lg font-bold group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Glassmorphism gradient effect */}
                                    <div
                                        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                        style={{
                                            background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(var(--primary-rgb), 0.05), transparent 40%)'
                                        }}
                                    />
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    )
}

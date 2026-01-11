"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

const sidebarItems = [
    {
        title: "Getting Started",
        items: [
            { name: "Introduction", href: "#introduction" },
            { name: "Installation", href: "#installation" },
            { name: "Quick Usage", href: "#quick-usage" },
        ]
    },
    {
        title: "Core Concepts",
        items: [
            { name: "Performance", href: "#performance" },
            { name: "Supported Formats", href: "#supported-formats" },
        ]
    },
    {
        title: "Examples",
        items: [
            { name: "Local RAG (Free)", href: "#local-rag" },
            { name: "Cloud Integrations", href: "#cloud-integrations" },
            { name: "Streaming Mode", href: "#streaming-mode" },
        ]
    },
    {
        title: "Reference",
        items: [
            { name: "Provider Comparison", href: "#provider-comparison" },
            { name: "Development", href: "#development" },
        ]
    }
]

export function DocsSidebar() {
    return (
        <aside className="hidden md:flex w-64 lg:w-72 flex-col fixed top-16 left-0 h-[calc(100vh-4rem)] border-r bg-muted/30">
            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-6">
                    {sidebarItems.map((group, index) => (
                        <div key={index} className="space-y-2">
                            <h4 className="font-semibold text-sm text-foreground px-3 tracking-tight">
                                {group.title}
                            </h4>
                            <ul className="space-y-1">
                                {group.items.map((item, itemIndex) => (
                                    <li key={itemIndex}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                                                "text-muted-foreground hover:text-white hover:bg-[#3a3939]"
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    )
}

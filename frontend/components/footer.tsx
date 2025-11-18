import { Logo } from '@/components/logo'
import Link from 'next/link'

const links = [
    {
        group: 'Product',
        items: [
            {
                title: 'Features',
                href: '#',
            },
            {
                title: 'Pricing',
                href: '#',
            },
            {
                title: 'Documentation',
                href: '#',
            },
            {
                title: 'API Reference',
                href: '#',
            },
            {
                title: 'Changelog',
                href: '#',
            },
        ],
    },
    {
        group: 'Company',
        items: [
            {
                title: 'About Us',
                href: '#',
            },
            {
                title: 'Blog',
                href: '#',
            },
            {
                title: 'Careers',
                href: '#',
            },
            {
                title: 'Contact',
                href: '#',
            },
            {
                title: 'Support',
                href: '#',
            },
        ],
    },
    {
        group: 'Legal',
        items: [
            {
                title: 'Privacy Policy',
                href: '#',
            },
            {
                title: 'Terms of Service',
                href: '#',
            },
            {
                title: 'Cookie Policy',
                href: '#',
            },
            {
                title: 'Security',
                href: '#',
            },
        ],
    },
]

export default function FooterSection() {
    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pt-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid gap-12 md:grid-cols-4">
                    <div className="md:col-span-1">
                        <Link
                            href="/"
                            aria-label="go home"
                            className="block size-fit mb-4">
                            <Logo />
                        </Link>
                        <p className="text-sm text-slate-600 dark:text-slate-400">AI-powered chatbots made simple</p>
                    </div>

                    <div className="grid grid-cols-3 gap-8 md:col-span-3">
                        {links.map((link, index) => (
                            <div
                                key={index}
                                className="space-y-4 text-sm">
                                <span className="block font-semibold text-slate-900 dark:text-white">{link.group}</span>
                                {link.items.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 block duration-150">
                                        <span>{item.title}</span>
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-slate-200 dark:border-slate-800 py-6">
                    <span className="text-slate-600 dark:text-slate-400 order-last block text-center text-sm md:order-first">© {new Date().getFullYear()} Krira AI. All rights reserved</span>
                    <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
                        <span className="text-slate-600 dark:text-slate-400 text-xs">🟢 All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}

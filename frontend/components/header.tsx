'use client'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const menuItems = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Documentation', href: '#' },
    { name: 'Blog', href: '#' },
]

export const HeroHeader = () => {
    const { isAuthenticated } = useAuth()
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
    const [hasMounted, setHasMounted] = React.useState(false)

    const applyTheme = React.useCallback((mode: 'light' | 'dark') => {
        if (typeof document === 'undefined') return
        const root = document.documentElement
        root.classList.toggle('dark', mode === 'dark')
        root.style.colorScheme = mode
    }, [])

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    React.useEffect(() => {
        if (typeof window === 'undefined') return
        const stored = window.localStorage.getItem('theme')
        const prefersDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
        const initialTheme: 'light' | 'dark' = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light'
        setTheme(initialTheme)
        applyTheme(initialTheme)
        setHasMounted(true)
    }, [applyTheme])

    React.useEffect(() => {
        if (!hasMounted || typeof window === 'undefined') return
        applyTheme(theme)
        window.localStorage.setItem('theme', theme)
    }, [theme, hasMounted, applyTheme])

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }

    const themeLabel = hasMounted
        ? theme === 'dark'
            ? 'Switch to light mode'
            : 'Switch to dark mode'
        : 'Toggle color mode'
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full items-center justify-between gap-2 lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleTheme}
                                    aria-label={themeLabel}
                                    aria-pressed={hasMounted ? theme === 'dark' : undefined}
                                    className="rounded-full border-border/60 bg-background/80 text-foreground shadow-sm backdrop-blur"
                                >
                                    <span className="sr-only">{themeLabel}</span>
                                    {hasMounted && theme === 'dark' ? (
                                        <Moon className="size-4" />
                                    ) : (
                                        <Sun className="size-4" />
                                    )}
                                </Button>
                                <button
                                    onClick={() => setMenuState(!menuState)}
                                    aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                    className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                    <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                    <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                                </button>
                            </div>
                        <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                            {isAuthenticated ? (
                                <Button
                                    asChild
                                    size="sm"
                                    className="w-full sm:w-auto">
                                    <Link href="/dashboard">
                                        <span>Dashboard</span>
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className={cn(isScrolled && 'lg:hidden')}>
                                        <Link href="/login">
                                            <span>Login</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        className={cn(isScrolled && 'lg:hidden')}>
                                        <Link href="/signup">
                                            <span>Sign Up</span>
                                        </Link>
                                    </Button>
                                </>
                            )}
                            {!isAuthenticated && (
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                    <Link href="/signup">
                                        <span>Get Started</span>
                                    </Link>
                                </Button>
                            )}
                        </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

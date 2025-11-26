'use client'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Menu, X, Moon, Sun, Sparkles } from 'lucide-react'
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
        let ticking = false
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > 50)
                    ticking = false
                })
                ticking = true
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
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
                className="fixed z-50 w-full px-2">
                <div className={cn(
                    'mx-auto mt-3 max-w-7xl px-6 transition-all duration-500 ease-out lg:px-12',
                    isScrolled && 'max-w-5xl rounded-2xl border border-primary/10 bg-background/80 shadow-lg shadow-primary/5 backdrop-blur-xl lg:px-5 dark:border-white/10 dark:bg-background/70'
                )}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full items-center justify-between gap-2 lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="group flex items-center space-x-2 transition-transform duration-300 hover:scale-105">
                                <Logo />
                            </Link>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-1 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link 
                                            href={item.href}
                                            className="relative px-4 py-2 text-muted-foreground transition-all duration-300 hover:text-primary rounded-lg hover:bg-primary/5 inline-flex items-center font-medium group"
                                        >
                                            <span className="relative z-10">{item.name}</span>
                                            <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={cn(
                            "bg-background/95 in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-2xl border border-primary/10 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:border-white/10 dark:bg-background/90 dark:shadow-none dark:lg:bg-transparent",
                        )}>
                            <div className="lg:hidden">
                                <ul className="space-y-1 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link 
                                                href={item.href}
                                                onClick={() => setMenuState(false)}
                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all duration-300 hover:bg-primary/5 hover:text-primary"
                                            >
                                                <span className="size-1.5 rounded-full bg-primary/40" />
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 border-t border-border/50 pt-4" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    aria-label={themeLabel}
                                    aria-pressed={hasMounted ? theme === 'dark' : undefined}
                                    className="relative size-9 rounded-lg border border-border/50 bg-transparent text-foreground shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-transparent hover:text-primary hover:shadow-md hover:shadow-primary/10"
                                >
                                    <span className="sr-only">{themeLabel}</span>
                                    <Sun className={cn(
                                        "absolute size-4 transition-all duration-500",
                                        hasMounted && theme === 'dark' ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                                    )} />
                                    <Moon className={cn(
                                        "absolute size-4 transition-all duration-500",
                                        hasMounted && theme === 'dark' ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
                                    )} />
                                </Button>
                                <button
                                    onClick={() => setMenuState(!menuState)}
                                    aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                    className="relative z-20 -m-2.5 -mr-4 flex size-10 cursor-pointer items-center justify-center rounded-full transition-all duration-300 hover:bg-primary/5 lg:hidden">
                                    <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-5 text-foreground transition-all duration-300" />
                                    <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-5 -rotate-180 scale-0 text-foreground opacity-0 transition-all duration-300" />
                                </button>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                {isAuthenticated ? (
                                    <Button
                                        asChild
                                        size="sm"
                                        className="group relative w-full overflow-hidden rounded-md bg-gradient-to-r from-primary to-blue-600 px-5 font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 sm:w-auto">
                                        <Link href="/dashboard">
                                            <span className="relative z-10 flex items-center gap-2">
                                                <Sparkles className="size-4" />
                                                Dashboard
                                            </span>
                                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "rounded-md border border-border/50 px-5 font-medium text-foreground transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
                                                isScrolled && 'lg:hidden'
                                            )}>
                                            <Link href="/login">
                                                <span>Login</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            className={cn(
                                                "group relative overflow-hidden rounded-md bg-gradient-to-r from-primary to-blue-600 px-5 font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30",
                                                isScrolled && 'lg:hidden'
                                            )}>
                                            <Link href="/signup">
                                                <span className="relative z-10">Sign Up</span>
                                                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                            </Link>
                                        </Button>
                                    </>
                                )}
                                {!isAuthenticated && (
                                    <Button
                                        asChild
                                        size="sm"
                                        className={cn(
                                            "group relative overflow-hidden rounded-md bg-gradient-to-r from-primary to-blue-600 px-5 font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30",
                                            isScrolled ? 'lg:inline-flex' : 'hidden'
                                        )}>
                                        <Link href="/signup">
                                            <span className="relative z-10">Get Started</span>
                                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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

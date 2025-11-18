"use client"
import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/lib/api/auth.service'
import GoogleAuthButton from '@/components/GoogleAuthButton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { login } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const togglePasswordVisibility = () => setShowPassword(!showPassword)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password,
            })

            if (response.success && response.user) {
                toast({
                    title: "Success",
                    description: response.message,
                    variant: "success",
                })

                // Update auth context
                login(response.user)

                // Check for redirect path
                const redirectPath = sessionStorage.getItem('redirectAfterLogin')
                if (redirectPath) {
                    sessionStorage.removeItem('redirectAfterLogin')
                    router.push(redirectPath)
                } else {
                    router.push('/dashboard')
                }
            }
        } catch (error: any) {
            toast({
                title: "Login Failed",
                description: error.message || "Invalid credentials",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <section className="flex min-h-screen bg-background px-4 py-16 md:py-18">
            <form
                onSubmit={handleSubmit}
                className="bg-card m-auto h-fit w-full max-w-md rounded-lg border p-0.5 shadow-md">
                <div className="p-8 pb-6">
                    <div>
                        <Link
                            href="/"
                            aria-label="go home">
                            <LogoIcon />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Sign In to Krira AI</h1>
                        <p className="text-muted-foreground text-sm">Welcome back! Sign in to continue</p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                        <GoogleAuthButton mode="signin" />
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="block text-sm">
                                Email
                            </Label>
                            <Input
                                type="email"
                                required
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="password"
                                    className="text-sm">
                                    Password
                                </Label>
                                <Button
                                    asChild
                                    variant="link"
                                    size="sm"
                                    className="px-0 text-sm">
                                    <Link href="/forgotpassword">
                                        Forgot your Password?
                                    </Link>
                                </Button>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password"
                                    className="pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button 
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </div>
                </div>

                <div className="bg-muted rounded-b-lg border-t p-4">
                    <p className="text-foreground text-center text-sm">
                        Do not have an account?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link href="/signup">Create account</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}
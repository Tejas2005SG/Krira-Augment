"use client"

import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { authService } from '@/lib/api/auth.service'
import GoogleAuthButton from '@/components/GoogleAuthButton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })

    const togglePasswordVisibility = () => setShowPassword(!showPassword)
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Password strength calculation
    const getPasswordStrength = (password: string) => {
        if (!password) return { strength: 0, label: 'None', color: 'bg-gray-200' }
        
        let strength = 0
        if (password.length >= 8) strength += 1
        if (/[A-Z]/.test(password)) strength += 1
        if (/[a-z]/.test(password)) strength += 1
        if (/[0-9]/.test(password)) strength += 1
        if (/[^A-Za-z0-9]/.test(password)) strength += 1

        const strengthMap = [
            { strength: 0, label: 'Very Weak', color: 'bg-red-500' },
            { strength: 1, label: 'Weak', color: 'bg-red-400' },
            { strength: 2, label: 'Fair', color: 'bg-yellow-500' },
            { strength: 3, label: 'Good', color: 'bg-yellow-400' },
            { strength: 4, label: 'Strong', color: 'bg-green-500' },
            { strength: 5, label: 'Very Strong', color: 'bg-green-600' }
        ]

        return strengthMap[Math.min(strength, 5)]
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (passwordStrength.strength < 3) {
            toast({
                title: "Weak Password",
                description: "Please use a stronger password",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            const response = await authService.signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            })

            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message,
                    variant: "success",
                })
                
                // Store email for verification page (use email from response to ensure it matches backend)
                const emailToStore = response.email || formData.email;
                sessionStorage.setItem('verificationEmail', emailToStore.toLowerCase().trim());
                
                console.log('Signup successful, email stored:', emailToStore.toLowerCase().trim());
                
                // Redirect to verification page
                router.push('/verifyemail')
            }
        } catch (error: any) {
            toast({
                title: "Signup Failed",
                description: error.message || "An error occurred during signup",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const passwordStrength = getPasswordStrength(formData.password)
    const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0

    return (
        <section className="flex min-h-screen bg-background px-4 py-16 md:py-20">
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
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Create a Tailark Account</h1>
                        <p className="text-muted-foreground text-sm">Welcome! Create an account to get started</p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                        <GoogleAuthButton mode="signup" />
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
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="fullname"
                                    className="block text-sm">
                                    Full Name
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

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
                            <Label
                                htmlFor="password"
                                className="text-sm">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    name="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Create a password"
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
                            
                            {/* Password Strength Meter */}
                            {formData.password && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Password strength:</span>
                                        <span className={`font-medium ${
                                            passwordStrength.strength <= 2 ? 'text-red-500' :
                                            passwordStrength.strength <= 3 ? 'text-yellow-500' :
                                            'text-green-500'
                                        }`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                        />
                                    </div>
                                    <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                                        <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-500' : ''}`}>
                                            <div className={`w-1 h-1 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                            At least 8 characters
                                        </li>
                                        <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : ''}`}>
                                            <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                            One uppercase letter
                                        </li>
                                        <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.password) ? 'text-green-500' : ''}`}>
                                            <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                            One number
                                        </li>
                                        <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-500' : ''}`}>
                                            <div className={`w-1 h-1 rounded-full ${/[^A-Za-z0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                            One special character
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="confirmPassword"
                                className="text-sm">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    name="confirmPassword"
                                    id="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm your password"
                                    className="pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={toggleConfirmPasswordVisibility}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {formData.confirmPassword && !passwordsMatch && (
                                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                            )}
                            {formData.confirmPassword && passwordsMatch && (
                                <p className="text-green-500 text-xs mt-1">Passwords match!</p>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full"
                            disabled={!passwordsMatch || passwordStrength.strength < 3 || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </div>
                </div>

                <div className="bg-muted rounded-b-lg border-t p-4">
                    <p className="text-foreground text-center text-sm">
                        Already have an account?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}
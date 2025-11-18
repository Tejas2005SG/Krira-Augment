"use client"

import { LogoIcon } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/lib/api/auth.service"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function ResetPassword() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const { login } = useAuth()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [resetToken, setResetToken] = useState("")

    useEffect(() => {
        // Get token from URL (assuming format: /resetpassword?token=xxx)
        const token = searchParams.get('token')
        if (token) {
            setResetToken(token)
        } else {
            // Check if token is in the path (format: /resetpassword/:token)
            const pathToken = window.location.pathname.split('/').pop()
            if (pathToken && pathToken !== 'resetpassword') {
                setResetToken(pathToken)
            } else {
                toast({
                    title: "Error",
                    description: "Invalid or missing reset token",
                    variant: "destructive",
                })
                router.push('/forgotpassword')
            }
        }
    }, [searchParams, router, toast])

    const handleSubmit = async (event) => {
        event.preventDefault()
        
        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (password.length < 8) {
            toast({
                title: "Weak Password",
                description: "Password must be at least 8 characters long",
                variant: "destructive",
            })
            return
        }

        if (!resetToken) {
            toast({
                title: "Error",
                description: "Invalid reset token",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            const response = await authService.resetPassword(resetToken, { password })

            if (response.success && response.user) {
                toast({
                    title: "Success",
                    description: response.message,
                    variant: "success",
                })

                // Update auth context (backend logs in user after reset)
                login(response.user)

                // Redirect to dashboard
                router.push('/dashboard')
            }
        } catch (error) {
            toast({
                title: "Reset Failed",
                description: error.message || "Failed to reset password",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const passwordsMatch = !password || !confirmPassword || password === confirmPassword

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
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Reset Password</h1>
                        <p className="text-muted-foreground text-sm">Create a new password for your account.</p>
                    </div>

                    <div className="mt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter your new password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    placeholder="Confirm your password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {!passwordsMatch && (
                            <p className="text-sm text-destructive">Passwords do not match.</p>
                        )}

                        <Button type="submit" className="w-full" disabled={!passwordsMatch || !password || !confirmPassword || isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update password'
                            )}
                        </Button>
                    </div>
                </div>

                <div className="bg-muted rounded-b-lg border-t p-4">
                    <p className="text-foreground text-center text-sm">
                        Remembered your password?
                        <Button asChild variant="link" className="px-2">
                            <Link href="/login">Sign in</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}
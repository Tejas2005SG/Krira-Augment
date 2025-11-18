"use client"

import { LogoIcon } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { authService } from "@/lib/api/auth.service"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function ForgotPassword() {
    const router = useRouter()
    const { toast } = useToast()
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setIsLoading(true)

        try {
            const response = await authService.forgotPassword({ email })

            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message,
                    variant: "success",
                })

                // Note: The backend sends email with reset link
                // You might want to redirect to a confirmation page
                toast({
                    title: "Check Your Email",
                    description: "We've sent you a password reset link. Please check your email.",
                    variant: "success",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to send reset email",
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
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Forgot Password</h1>
                        <p className="text-muted-foreground text-sm">
                            Enter the email linked with your account and we&apos;ll send you a reset link.
                        </p>
                    </div>

                    <div className="mt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Enter your email"
                                disabled={isLoading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send reset link'
                            )}
                        </Button>
                    </div>
                </div>

                <div className="bg-muted rounded-b-lg border-t p-4">
                    <p className="text-foreground text-center text-sm">
                        Remember your password?
                        <Button asChild variant="link" className="px-2">
                            <Link href="/login">Back to sign in</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}
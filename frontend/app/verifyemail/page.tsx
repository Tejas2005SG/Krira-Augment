"use client"

import { LogoIcon } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/lib/api/auth.service"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChangeEvent, ClipboardEvent, FormEvent, KeyboardEvent, useRef, useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

const OTP_LENGTH = 6

export default function VerifyEmail() {
    const router = useRouter()
    const { toast } = useToast()
    const { login } = useAuth()
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""))
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))

    useEffect(() => {
        // Get email from session storage
        const storedEmail = sessionStorage.getItem('verificationEmail')
        if (storedEmail) {
            setEmail(storedEmail)
        } else {
            // Redirect to signup if no email found
            router.push('/signup')
        }
    }, [router])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        
        if (!otp.every((value) => value)) {
            toast({
                title: "Error",
                description: "Please enter the complete OTP",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            const otpString = otp.join('')
            
            // Debug logging
            console.log('Verifying OTP:');
            console.log('Email:', email);
            console.log('OTP:', otpString);
            
            const response = await authService.verifyOtp({
                email,
                otp: otpString,
            })

            if (response.success && response.user) {
                toast({
                    title: "Success",
                    description: response.message,
                    variant: "success",
                })

                // Update auth context
                login(response.user)

                // Clear session storage
                sessionStorage.removeItem('verificationEmail')

                // Redirect to dashboard
                router.push('/dashboard')
            }
        } catch (error: any) {
            toast({
                title: "Verification Failed",
                description: error.message || "Invalid OTP",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        if (!email) {
            toast({
                title: "Error",
                description: "We couldn't detect an email address. Please sign up again.",
                variant: "destructive",
            })
            return
        }

        setIsResending(true)

        try {
            const response = await authService.resendOtp({ email })

            toast({
                title: response.success ? "OTP Resent" : "Unable to resend OTP",
                description: response.message,
                variant: response.success ? "success" : "destructive",
            })
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to resend OTP"
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            })
        } finally {
            setIsResending(false)
        }
    }

    const handleChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/\D/g, "")
        if (!value) {
            updateOtp(index, "")
            return
        }

        updateOtp(index, value.slice(-1))
        const nextIndex = index + 1
        if (nextIndex < OTP_LENGTH) {
            inputRefs.current[nextIndex]?.focus()
        }
    }

    const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            const prevIndex = index - 1
            updateOtp(index, "")
            inputRefs.current[prevIndex]?.focus()
        }

        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault()
            inputRefs.current[index - 1]?.focus()
        }

        if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            event.preventDefault()
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault()
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "")
        if (!pasted) {
            return
        }

        const updated = [...otp]
        for (let i = 0; i < OTP_LENGTH - index; i++) {
            const char = pasted[i]
            if (!char) break
            updated[index + i] = char
        }
        setOtp(updated)

        const focusIndex = Math.min(index + pasted.length, OTP_LENGTH - 1)
        inputRefs.current[focusIndex]?.focus()
    }

    const updateOtp = (index: number, value: string) => {
        setOtp((prev) => {
            const copy = [...prev]
            copy[index] = value
            return copy
        })
    }

    const isOtpComplete = otp.every((digit) => digit)

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
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Verify your email</h1>
                        <p className="text-muted-foreground text-sm">
                            Enter the six-digit code we sent to your email address.
                        </p>
                    </div>

                    <div className="mt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="otp-0">One-time passcode</Label>
                            <div className="flex justify-between gap-2">
                                {otp.map((value, index) => (
                                    <Input
                                        key={index}
                                        id={`otp-${index}`}
                                        ref={(element) => {
                                            inputRefs.current[index] = element
                                        }}
                                        value={value}
                                        onChange={handleChange(index)}
                                        onKeyDown={handleKeyDown(index)}
                                        onPaste={handlePaste(index)}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        className="h-12 w-11 text-center text-lg tracking-[0.25em]"
                                    />
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={!isOtpComplete || isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify code'
                            )}
                        </Button>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
                            <Button 
                                type="button" 
                                variant="link" 
                                className="px-0"
                                onClick={handleResend}
                                disabled={isResending}
                            >
                                {isResending ? 'Resending...' : 'Resend'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-muted rounded-b-lg border-t p-4">
                    <p className="text-foreground text-center text-sm">
                        Wrong email address?
                        <Button asChild variant="link" className="px-2">
                            <Link href="/signup">Try again</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}
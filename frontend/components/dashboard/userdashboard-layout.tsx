"use client"

import * as React from "react"
import { BellIcon, Loader2, LogOut } from "lucide-react"

import { AppSidebar } from "./appSidebar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

import { useAuth } from "@/contexts/AuthContext"
import { authService, ProfileResponse } from "@/lib/api/auth.service"
import { useToast } from "@/components/ui/use-toast"

import { TrainLLMTab } from "./tabs/train-llm"
import { UsageAnalyticsTab } from "./tabs/usage-analytics"
import { PreviousChatbotsTab } from "./tabs/previous-chatbots"
import { ApiKeysTab } from "./tabs/api-keys"
import { PricingTab } from "./tabs/pricing"
import { AccountProfileTab } from "./tabs/account-profile"
import { AccountBillingTab } from "./tabs/account-billing"
import { AccountSettingsTab } from "./tabs/account-settings"

type DashboardTab = {
  value: string
  label: string
  description: string
  component: React.ReactNode
  hidden?: boolean
}

const DASHBOARD_TABS: DashboardTab[] = [
  {
    value: "train-llm",
    label: "Train LLM",
    description: "Create Complete RAG pipelines with ease",
    component: <TrainLLMTab />,
  },
  {
    value: "usage-analytics",
    label: "Usage & Analytics",
    description: "Monitor performance metrics and usage trends",
    component: <UsageAnalyticsTab />,
  },
  {
    value: "previous-chatbots",
    label: "Previous Chatbots",
    description: "Review and manage your existing assistants",
    component: <PreviousChatbotsTab />,
  },
  {
    value: "api-keys",
    label: "API Keys",
    description: "Manage credentials and permissions",
    component: <ApiKeysTab />,
  },
  {
    value: "pricing",
    label: "Pricing",
    description: "Compare plans and upgrade your account",
    component: <PricingTab />,
  },
  {
    value: "account-profile",
    label: "Profile",
    description: "Manage your personal information and security details",
    component: <AccountProfileTab />,
    hidden: true,
  },
  {
    value: "account-billing",
    label: "Billing",
    description: "Review usage, invoices, and manage your subscription",
    component: <AccountBillingTab />,
    hidden: true,
  },
  {
    value: "account-settings",
    label: "Settings",
    description: "Update notifications and workspace preferences",
    component: <AccountSettingsTab />,
    hidden: true,
  },
]

type UserProfile = ProfileResponse["user"]

function formatPlanLabel(plan?: string) {
  if (!plan) return "Unknown"
  return plan
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ")
}

function getInitials(name: string) {
  if (!name) return "--"
  const parts = name.trim().split(/\s+/)
  const [first = "", second = ""] = parts
  const initials = `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
  return initials || name.charAt(0).toUpperCase()
}

function formatRole(role?: string) {
  if (!role) return "User"
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState<string>(DASHBOARD_TABS[0].value)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const openProfileTab = React.useCallback(() => setActiveTab("account-profile"), [setActiveTab])
  const openBillingTab = React.useCallback(() => setActiveTab("account-billing"), [setActiveTab])
  const openSettingsTab = React.useCallback(() => setActiveTab("account-settings"), [setActiveTab])

  React.useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) {
          setProfile(null)
          setIsProfileLoading(false)
        }
        return
      }

      if (isMounted) {
        setIsProfileLoading(true)
      }

      try {
        const response = await authService.getProfile()
        if (isMounted && response.success && response.user) {
          setProfile(response.user)
        }
      } catch (error: unknown) {
        if (isMounted) {
          const status =
            typeof error === "object" && error !== null && "status" in error
              ? (error as { status?: number }).status
              : undefined
          const message = error instanceof Error ? error.message : undefined

          if (status !== 401) {
            toast({
              title: "Unable to load account data",
              description: message ?? "Please try again.",
              variant: "destructive",
            })
          }
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [user, toast])

  const handleLogout = React.useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined
      toast({
        title: "Logout failed",
        description: message ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }, [logout, toast])

  const displayName = profile?.name ?? user?.name ?? "User"
  const displayEmail = profile?.email ?? user?.email ?? ""
  const displayRole = formatRole(profile?.role ?? user?.role)
  const planLabel = formatPlanLabel(profile?.plan ?? user?.plan)
  const initials = React.useMemo(() => getInitials(displayName), [displayName])

  const activeConfig = React.useMemo(
    () => DASHBOARD_TABS.find((tab) => tab.value === activeTab) ?? DASHBOARD_TABS[0],
    [activeTab]
  )

  return (
    <SidebarProvider>
      <AppSidebar
        activeItem={activeTab}
        onSelect={setActiveTab}
        displayName={displayName}
        displayEmail={displayEmail}
        displayRole={displayRole}
        planLabel={planLabel}
        isLoadingPlan={isProfileLoading}
        initials={initials}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
      <SidebarInset className="bg-background/50">
        <div className="flex min-h-svh flex-col">
          <DashboardHeader
            activeLabel={activeConfig.label}
            activeDescription={activeConfig.description}
            displayName={displayName}
            displayEmail={displayEmail}
            displayRole={displayRole}
            planLabel={planLabel}
            isLoadingPlan={isProfileLoading}
            initials={initials}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            onOpenProfile={openProfileTab}
            onOpenBilling={openBillingTab}
            onOpenSettings={openSettingsTab}
          />
          <div className="flex-1 space-y-6 p-6 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2">
                {DASHBOARD_TABS.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="flex flex-col items-start h-auto py-3 px-4"
                  >
                    <span className="font-medium text-sm">{tab.label}</span>
                    <span className="text-xs text-muted-foreground text-left mt-1">
                      {tab.description}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList> */}
              
              {DASHBOARD_TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="space-y-6">
                  {tab.component}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

type DashboardHeaderProps = {
  activeLabel: string
  activeDescription: string
  displayName: string
  displayEmail: string
  displayRole: string
  planLabel: string
  isLoadingPlan: boolean
  initials: string
  onLogout: () => void
  isLoggingOut: boolean
  onOpenProfile: () => void
  onOpenBilling: () => void
  onOpenSettings: () => void
}

function DashboardHeader({
  activeLabel,
  activeDescription,
  displayName,
  displayEmail,
  displayRole,
  planLabel,
  isLoadingPlan,
  initials,
  onLogout,
  isLoggingOut,
  onOpenProfile,
  onOpenBilling,
  onOpenSettings,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <SidebarTrigger className="hidden md:inline-flex" />
            <span className="font-medium text-foreground">{activeLabel}</span>
          </div>
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <p className="hidden md:block text-sm text-muted-foreground">
            {activeDescription}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="hidden sm:inline-flex" variant="outline">
            {isLoadingPlan ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading plan...
              </span>
            ) : (
              <>Current Plan: {planLabel}</>
            )}
          </Badge>
          <Button variant="ghost" size="icon" className="relative">
            <BellIcon className="h-5 w-5" />
            <span className="bg-destructive absolute right-1 top-1 flex h-2 w-2 rounded-full" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-10 items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted data-[state=open]:bg-muted"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/images/avatar.png" alt={`${displayName} avatar`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-muted-foreground text-xs">{displayEmail || displayRole}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{displayName}</span>
                  {(displayEmail || displayRole) && (
                    <span className="text-xs text-muted-foreground">{displayEmail || displayRole}</span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onOpenProfile}>Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={onOpenBilling}>Billing</DropdownMenuItem>
              <DropdownMenuItem onSelect={onOpenSettings}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(event) => {
                  event.preventDefault()
                  if (!isLoggingOut) {
                    onLogout()
                  }
                }}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
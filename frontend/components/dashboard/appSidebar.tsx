"use client"

import * as React from "react"
import {
  BarChart3,
  Brain,
  CreditCard,
  KeyIcon,
  Loader2,
  LogOut,
  MessageSquare,
  Sparkles,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SidebarItem = {
  value: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  description: string
}

const NAVIGATION_ITEMS: SidebarItem[] = [
  {
    value: "train-llm",
    label: "Train LLM",
    icon: Brain,
    description: "Configure training workflows",
  },
  {
    value: "usage-analytics",
    label: "Usage & Analytics",
    icon: BarChart3,
    description: "Track performance metrics",
  },
  {
    value: "previous-chatbots",
    label: "Previous Chatbots",
    icon: MessageSquare,
    description: "Manage deployed assistants",
  },
  {
    value: "api-keys",
    label: "API Keys",
    icon: KeyIcon,
    description: "Access credentials",
  },
  {
    value: "pricing",
    label: "Pricing",
    icon: CreditCard,
    description: "Plan comparison",
  },
]

type AppSidebarProps = {
  activeItem: string
  onSelect: (value: string) => void
  displayName: string
  displayEmail: string
  displayRole: string
  planLabel: string
  isLoadingPlan: boolean
  initials: string
  onLogout: () => void
  isLoggingOut: boolean
}

export function AppSidebar({
  activeItem,
  onSelect,
  displayName,
  displayEmail,
  displayRole,
  planLabel,
  isLoadingPlan,
  initials,
  onLogout,
  isLoggingOut,
}: AppSidebarProps) {
  const { open } = useSidebar()

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar 
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar [&[data-state=collapsed]]:w-[90px]"
      >
        {/* Header */}
        <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
          <div className="flex items-center justify-between p-2">
            {open ? (
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight text-sidebar-foreground">Krira AI</p>
                  <p className="text-xs text-muted-foreground">AI Dashboard</p>
                </div>
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md mx-auto">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="px-2 bg-sidebar">
          <SidebarGroup>
            {open && (
              <SidebarGroupLabel className="px-2 text-xs uppercase tracking-wider text-sidebar-foreground/70">
                Navigation
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeItem === item.value

                  const menuButton = (
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onSelect(item.value)}
                      tooltip={item.label}
                      className={`relative transition-all duration-200 ${
                        !open ? "h-12 w-12 p-0 justify-center mx-auto" : "px-3"
                      } ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-sidebar-primary" : ""} ${!open ? "shrink-0" : "h-4 w-4"}`} />
                      {open && <span className="flex-1 ml-2">{item.label}</span>}
                      {open && isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                      )}
                    </SidebarMenuButton>
                  )

                  return (
                    <SidebarMenuItem key={item.value} className="mb-1">
                      {!open ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                          <TooltipContent side="right" className="flex flex-col gap-1">
                            <p className="font-semibold">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        menuButton
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-sidebar-border p-2 bg-sidebar">
          {open ? (
            <>
              <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3 transition-colors">
                <Avatar className="h-10 w-10 ring-2 ring-sidebar-primary/20">
                  <AvatarImage src="/images/avatar.png" alt={`${displayName} avatar`} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <span className="text-sm font-semibold text-sidebar-foreground">{displayName}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="secondary"
                      className="h-5 bg-sidebar-primary/10 text-xs font-medium text-sidebar-primary hover:bg-sidebar-primary/20"
                    >
                      {isLoadingPlan ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading
                        </span>
                      ) : (
                        planLabel || "Plan"
                      )}
                    </Badge>
                    <span
                      className="text-xs text-muted-foreground truncate max-w-[150px]"
                      title={displayEmail || displayRole}
                    >
                      {displayEmail || displayRole}
                    </span>
                  </div>
                </div>
              </div>
              <Separator className="my-2" />
              <Button
                variant="ghost"
                className="justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full"
                size="sm"
                onClick={onLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {isLoggingOut ? "Signing out..." : "Logout"}
              </Button>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-default items-center justify-center rounded-lg bg-sidebar-accent/50 p-2">
                    <Avatar className="h-12 w-12 ring-2 ring-sidebar-primary/20">
                      <AvatarImage src="/images/avatar.png" alt={`${displayName} avatar`} />
                      <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex flex-col gap-1">
                  <p className="font-semibold">{displayName}</p>
                  <Badge
                    variant="secondary"
                    className="w-fit bg-sidebar-primary/10 text-xs text-sidebar-primary"
                  >
                    {isLoadingPlan ? "Loading" : planLabel || "Plan"}
                  </Badge>
                  {(displayEmail || displayRole) && (
                    <p className="text-xs text-muted-foreground">{displayEmail || displayRole}</p>
                  )}
                </TooltipContent>
              </Tooltip>
              
              <Separator className="my-2" />
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="justify-center h-12 w-12 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      size="sm"
                      onClick={onLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{isLoggingOut ? "Signing out..." : "Logout"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}

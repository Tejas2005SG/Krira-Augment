"use client";

import * as React from "react";
import {
  BarChart3,
  Brain,
  CreditCard,
  KeyIcon,
  Loader2,
  LogOut,
  MessageSquare,
  Home,
  Sparkles,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SidebarItem = {
  value: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
};

const NAVIGATION_ITEMS: SidebarItem[] = [
  {
    value: "usage-analytics",
    label: "Usage & Analytics",
    icon: BarChart3,
    description: "Track performance metrics",
  },
  {
    value: "train-llm",
    label: "RAG Pipeline",
    icon: Brain,
    description: "Configure training workflows",
  },


  {
    value: "previous-chatbots",
    label: "Deployments",
    icon: MessageSquare,
    description: "Manage and monitor your active RAG deployments",
  },
  {
    value: "playground",
    label: "Playground",
    icon: MessageCircle,
    description: "Chat with your chatbots",
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
];

type AppSidebarProps = {
  activeItem: string;
  onSelect: (value: string) => void;
  displayName: string;
  displayEmail: string;
  displayRole: string;
  planLabel: string;
  isLoadingPlan: boolean;
  initials: string;
  onLogout: () => void;
  isLoggingOut: boolean;
};

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
  const { open } = useSidebar();

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border/50 bg-gradient-to-b from-sidebar to-sidebar/95 [&[data-state=collapsed]]:w-[72px]"
      >
        {/* Header */}
        <SidebarHeader className="border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-3">
            {open ? (
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <Image
                    src="/krira-augment-logo3.jpeg"
                    alt="Krira Augment Logo"
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight text-sidebar-foreground space-mono-regular">
                    Krira Augment
                  </p>
                  <p className="text-[11px] text-muted-foreground fira-mono-regular">AI Dashboard</p>
                </div>
              </div>
            ) : (
              <div className="relative mx-auto flex h-8 w-8 items-center justify-center">
                <Image
                  src="/krira-augment-logo3.jpeg"
                  alt="Krira Augment Logo"
                  fill
                  className="rounded-md object-cover"
                />
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="px-2 bg-transparent">
          <SidebarGroup className="py-2">
            {open && (
              <SidebarGroupLabel className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Navigation
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.value;

                  const menuButton = (
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onSelect(item.value)}
                      tooltip={item.label}
                      className={cn(
                        "relative transition-all duration-200 group/item rounded-lg",
                        !open ? "h-10 w-10 p-0 justify-center mx-auto" : "px-3 py-2.5",
                        isActive
                          ? "bg-[var(--color-gray-medium)] text-primary"
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center rounded-md transition-colors",
                        !open ? "" : "h-7 w-7 shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover/item:text-foreground"
                      )}>
                        <Icon className={cn("transition-transform", !open ? "h-5 w-5" : "h-4 w-4")} />
                      </div>
                      {open && (
                        <>
                          <span className="flex-1 ml-2 text-sm font-medium space-mono-regular truncate whitespace-nowrap">{item.label}</span>
                          {isActive && (
                            <ChevronRight className="h-4 w-4 text-primary/60" />
                          )}
                        </>
                      )}
                    </SidebarMenuButton>
                  );

                  return (
                    <SidebarMenuItem key={item.value}>
                      {!open ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            sideOffset={8}
                            className="flex flex-col gap-1 px-3 py-2"
                          >
                            <p className="font-semibold text-sm space-mono-regular">{item.label}</p>
                            <p className="text-xs text-muted-foreground fira-mono-regular">
                              {item.description}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        menuButton
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-sidebar-border/50 p-3 bg-sidebar/50 backdrop-blur-sm">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "mb-2 w-full rounded-lg transition-colors",
                  open ? "justify-start px-3 py-2" : "justify-center h-10 w-10 p-0 mx-auto"
                )}
                asChild
              >
                <Link href="/">
                  <Home className={cn("transition-colors", open ? "mr-2 h-4 w-4" : "h-5 w-5")} />
                  {open && <span className="text-sm space-mono-regular">Home</span>}
                </Link>
              </Button>
            </TooltipTrigger>
            {!open && <TooltipContent side="right" sideOffset={8}>Home</TooltipContent>}
          </Tooltip>

          {open ? (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 p-3 ring-1 ring-border/50 transition-all hover:ring-border">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-sm">
                  <AvatarImage
                    src="/avatar.png"
                    alt={`${displayName} avatar`}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate space-mono-regular">
                    {displayName}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="secondary"
                      className="h-5 bg-primary/10 text-[10px] font-semibold text-primary hover:bg-primary/15 gap-1"
                    >
                      {isLoadingPlan ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Loading
                        </span>
                      ) : (
                        <>
                          <Sparkles className="h-2.5 w-2.5" />
                          {planLabel || "Plan"}
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator className="my-2 bg-border/50" />
              <Button
                variant="ghost"
                className="justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full rounded-lg"
                size="sm"
                onClick={onLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="text-sm space-mono-regular">{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </Button>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-default items-center justify-center rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 p-2 ring-1 ring-border/50 mx-auto">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20 shadow-sm">
                      <AvatarImage
                        src="/avatar.png"
                        alt={`${displayName} avatar`}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="px-3 py-2">
                  <p className="font-semibold text-sm">{displayName}</p>
                  <Badge
                    variant="secondary"
                    className="w-fit bg-primary/10 text-[10px] font-semibold text-primary mt-1 gap-1"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    {isLoadingPlan ? "Loading" : planLabel || "Plan"}
                  </Badge>
                  {(displayEmail || displayRole) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {displayEmail || displayRole}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>

              <Separator className="my-2 bg-border/50" />
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="justify-center h-10 w-10 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      size="sm"
                      onClick={onLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    <p className="text-sm">{isLoggingOut ? "Signing out..." : "Sign out"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

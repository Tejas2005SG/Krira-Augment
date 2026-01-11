"use client";

import * as React from "react";
import type { TooltipProps } from "recharts";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, BarChart3, Brain, HardDrive, Sparkles } from "lucide-react";

import { usageService, type UsageSummaryResponse } from "@/lib/api/usage.service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type TrendPoint = {
  date: string;
  requests: number;
  tokens: number;
};

const formatStorageValue = (mb: number) => {
  if (mb <= 0) return "0 MB";
  if (mb < 1) return `${(mb * 1024).toFixed(2)} KB`;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
};

const formatHistoryDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-sm">
        <p className="font-semibold text-foreground space-mono-regular">{label}</p>
        <p className="text-muted-foreground fira-mono-regular">Requests: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function UsageAnalyticsTab() {
  const [summary, setSummary] = React.useState<UsageSummaryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchUsage = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usageService.getSummary();
      setSummary(response);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setError('Unable to load usage data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load - only run once on mount
  React.useEffect(() => {
    fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only on mount

  // Listen for subscription changes
  React.useEffect(() => {
    const handleSubscriptionChange = () => {
      console.log('🔄 Usage Analytics: Subscription changed, reloading...');
      fetchUsage();
    };

    window.addEventListener('subscription:changed', handleSubscriptionChange);

    return () => {
      window.removeEventListener('subscription:changed', handleSubscriptionChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - listener doesn't need to change

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground mb-4 fira-mono-regular">
          {error || 'Unable to load usage metrics right now.'}
        </p>
        <button
          onClick={() => fetchUsage()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors space-mono-regular"
        >
          Retry
        </button>
      </div>
    );
  }

  const { plan, usage, trend } = summary;
  const trendData = (trend ?? []) as TrendPoint[];
  const remainingRequests = Math.max(usage.requestLimit - usage.requestsUsed, 0);
  const requestProgress = Math.min((usage.requestsUsed / usage.requestLimit) * 100, 100);

  const todayString = new Date().toDateString();
  const meaningfulHistory = trendData.filter((entry) => {
    const entryDate = new Date(entry.date).toDateString();
    return entry.requests > 0 || entryDate === todayString;
  });

  const displayHistory = meaningfulHistory.slice(-7);

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight space-mono-regular">Usage & Analytics</h2>
          <p className="text-muted-foreground fira-mono-regular">Monitor how your workspace consumes the account allowance.</p>
        </div>
        <div className="text-sm text-muted-foreground fira-mono-regular">Last refreshed {new Date().toLocaleDateString()}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Requests Card - Blue Theme */}
        <Card className="relative overflow-hidden border-blue-200/50 bg-gradient-to-br from-blue-50 via-blue-50/50 to-indigo-50 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-indigo-950/30 dark:border-blue-800/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-blue-700 dark:text-blue-300 space-mono-regular">Requests used</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent space-mono-regular">{usage.requestsUsed.toLocaleString()}</div>
            <Progress value={requestProgress} className="h-2 bg-blue-100 dark:bg-blue-900/50 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-500" />
            <p className="text-xs text-blue-600/80 dark:text-blue-400 fira-mono-regular">{remainingRequests.toLocaleString()} requests remaining</p>
          </CardContent>
        </Card>

        {/* Pipelines Card - Purple Theme (Restored as Count-Only) */}
        <Card className="relative overflow-hidden border-purple-200/50 bg-gradient-to-br from-purple-50 via-violet-50/50 to-pink-50 dark:from-purple-950/30 dark:via-violet-900/20 dark:to-pink-950/30 dark:border-purple-800/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-purple-700 dark:text-purple-300 space-mono-regular">Pipelines</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20">
                <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent space-mono-regular">{usage.pipelinesUsed}</div>
            <p className="text-xs text-purple-600/80 dark:text-purple-400 mt-2 fira-mono-regular">Unlimited pipelines available</p>
          </CardContent>
        </Card>


        {/* Storage Card - Emerald Theme */}
        <Card className="relative overflow-hidden border-emerald-200/50 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-900/20 dark:to-cyan-950/30 dark:border-emerald-800/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-emerald-700 dark:text-emerald-300 space-mono-regular">Storage</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
                <HardDrive className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent space-mono-regular">
              {formatStorageValue(usage.storageUsedMb)} / {formatStorageValue(usage.storageLimitMb)}
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-2 fira-mono-regular">Total account storage pool used</p>
          </CardContent>
        </Card>

        {/* Plan Card - Amber/Orange Theme */}
        <Card className="relative overflow-hidden border-amber-200/50 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-900/20 dark:to-yellow-950/30 dark:border-amber-800/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-amber-700 dark:text-amber-300 space-mono-regular">Plan</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent space-mono-regular">{plan.name}</div>
            <Badge className={cn("w-fit fira-mono-regular shadow-sm", plan.isFree ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0" : "bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-0")}>
              {plan.isFree ? "Free" : "Paid"}
            </Badge>
            <p className="text-xs text-amber-600/80 dark:text-amber-400 fira-mono-regular">Providers: {plan.providers.join(", ")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="space-mono-regular">Daily request volume</CardTitle>
          <CardDescription className="fira-mono-regular">Rolling 14-day window of requests.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          {trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground fira-mono-regular">
              No request data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="requests" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="space-mono-regular">Pipeline Storage Breakdown</CardTitle>
          <CardDescription className="fira-mono-regular">Storage used by each RAG pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          {!usage.pipelineBreakdown || usage.pipelineBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground fira-mono-regular">No pipelines active yet.</p>
          ) : (
            <div className="space-y-3">
              {(usage.pipelineBreakdown as any[]).map((pipeline) => (
                <div
                  key={pipeline.name}
                  className="flex items-center justify-between rounded-lg border bg-card/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground space-mono-regular">{pipeline.name}</p>
                      <p className="text-[10px] text-muted-foreground fira-mono-regular">Active RAG Pipeline</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm font-normal fira-mono-regular">
                    {formatStorageValue(pipeline.sizeMb)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="space-mono-regular">Usage history</CardTitle>
          <CardDescription className="fira-mono-regular">Exact request counts captured for each day.</CardDescription>
        </CardHeader>
        <CardContent>
          {displayHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground fira-mono-regular">No request history captured yet.</p>
          ) : (
            <div className="space-y-3">
              {displayHistory
                .slice()
                .reverse()
                .map((entry) => (
                  <div
                    key={entry.date}
                    className="flex items-center justify-between rounded-lg border bg-card/50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground space-mono-regular">{formatHistoryDate(entry.date)}</p>
                      <p className="text-xs text-muted-foreground fira-mono-regular">{new Date(entry.date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="secondary" className="text-sm font-normal fira-mono-regular">
                      {entry.requests.toLocaleString()} requests
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  );
}

"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  MoreHorizontal,
  Download,
  Search,
  Calendar as CalendarIcon,
  Bot,
} from "lucide-react";
import Image from "next/image"; // Using Next.js Image component for optimization

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Dynamic Model Logo Component ---
const ModelLogo = ({ model }: { model: string }) => {
  const m = model.toLowerCase();
  let src = "";
  let alt = "Model";

  // Determine image source based on model string content
  // ASSUMPTION: Images are stored in /public/logos/
  if (m.includes("openai") || m.includes("gpt")) {
    src = "/openai.svg";
    alt = "OpenAI";
  } else if (m.includes("anthropic") || m.includes("claude")) {
    src = "/anthropic-logo.webp";
    alt = "Anthropic";
  } else if (m.includes("google") || m.includes("gemini")) {
    src = "/google-logo.png";
    alt = "Google Gemini";
  } else if (m.includes("perplexity") || m.includes("sonar")) {
    src = "/perplexity-logo.png";
    alt = "Perplexity";
  } else if (m.includes("x-ai") || m.includes("grok")) {
    src = "/xai-logo.webp"; // or xai.png
    alt = "xAI Grok";
  } else if (m.includes("deepseek")) {
    src = "/deepseek-logo.png";
    alt = "DeepSeek";
  } else if (m.includes("z-ai") || m.includes("glm")) {
    src = "/glm-logo.png"; // or glm.png
    alt = "Z-AI";
  } else {
    // Fallback icon if no image match found
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-muted">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  // Render the image from public folder
  return (
    <div className="relative flex h-6 w-6 items-center justify-center overflow-hidden ">
      {/* Using standard img tag for simplicity with public folder, 
          or use <Image /> if you have configured Next.js dimensions */}
      <Image
        src={src}
        alt={alt}
        width={24}
        height={24}
        className="object-contain"
      />
    </div>
  );
};

// --- Mock Data ---

const overviewMetrics = [
  {
    title: "Total Queries",
    value: "18,245",
    change: 12.6,
    color: "var(--chart-1)",
    bgColor: "#f8fafc", // Very light slate/blue
  },
  {
    title: "API Calls",
    value: "9,802",
    change: 8.2,
    color: "var(--chart-2)",
    bgColor: "#f0fdf4", // Very light green/emerald
  },
  {
    title: "Active Chatbots",
    value: "5",
    change: 0,
    color: "var(--chart-3)",
    bgColor: "#fff7ed", // Very light orange
  },
  {
    title: "Avg. Response",
    value: "842ms",
    change: -6.4,
    color: "var(--chart-4)",
    bgColor: "#faf5ff", // Very light purple
  },
];

const dailyBotUsage = [
  {
    date: "Mon",
    "Support Pro": 140,
    "Sales Advisor": 90,
    "Onboarding Coach": 40,
    "Internal Ops": 20,
    "Dev Helper": 10,
  },
  {
    date: "Tue",
    "Support Pro": 230,
    "Sales Advisor": 120,
    "Onboarding Coach": 60,
    "Internal Ops": 25,
    "Dev Helper": 15,
  },
  {
    date: "Wed",
    "Support Pro": 210,
    "Sales Advisor": 160,
    "Onboarding Coach": 80,
    "Internal Ops": 30,
    "Dev Helper": 12,
  },
  {
    date: "Thu",
    "Support Pro": 280,
    "Sales Advisor": 140,
    "Onboarding Coach": 90,
    "Internal Ops": 45,
    "Dev Helper": 20,
  },
  {
    date: "Fri",
    "Support Pro": 260,
    "Sales Advisor": 200,
    "Onboarding Coach": 110,
    "Internal Ops": 50,
    "Dev Helper": 25,
  },
  {
    date: "Sat",
    "Support Pro": 150,
    "Sales Advisor": 90,
    "Onboarding Coach": 30,
    "Internal Ops": 10,
    "Dev Helper": 5,
  },
  {
    date: "Sun",
    "Support Pro": 170,
    "Sales Advisor": 85,
    "Onboarding Coach": 25,
    "Internal Ops": 5,
    "Dev Helper": 8,
  },
];

// Updated Data with your specific models
const botTableData = [
  {
    id: "bot-01",
    name: "Support Pro",
    model: "openai/gpt-5", // Using your specific model ID
    requests: 8245,
    tokens: "14.2M",
    lastActive: "2 min ago",
    status: "Active",
    color: "var(--chart-1)",
  },
  {
    id: "bot-02",
    name: "Sales Advisor",
    model: "anthropic/claude-4.5-sonnet", // Using your specific model ID
    requests: 5102,
    tokens: "5.1M",
    lastActive: "15 min ago",
    status: "Active",
    color: "var(--chart-2)",
  },
  {
    id: "bot-03",
    name: "Onboarding Coach",
    model: "google/gemini-2.5-pro", // Using your specific model ID
    requests: 3400,
    tokens: "8.9M",
    lastActive: "1 hr ago",
    status: "Active",
    color: "var(--chart-3)",
  },
  {
    id: "bot-04",
    name: "Research Assistant",
    model: "perplexity/sonar-reasoning-pro", // Using your specific model ID
    requests: 1120,
    tokens: "2.4M",
    lastActive: "4 hrs ago",
    status: "Maintenance",
    color: "var(--chart-4)",
  },
  {
    id: "bot-05",
    name: "Code Generator",
    model: "deepseek/deepseek-v3.1", // Using your specific model ID
    requests: 378,
    tokens: "1.1M",
    lastActive: "1 day ago",
    status: "Inactive",
    color: "var(--chart-5)",
  },
  {
    id: "bot-06",
    name: "Grok Analyst",
    model: "x-ai/grok-4", // Using your specific model ID
    requests: 120,
    tokens: "0.5M",
    lastActive: "2 days ago",
    status: "Active",
    color: "var(--chart-1)",
  },
];

// --- Custom Components ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover p-3 shadow-md outline-none">
        <p className="mb-2 text-sm font-medium text-popover-foreground">
          {label}
        </p>
        <div className="flex flex-col gap-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color || item.stroke }}
              />
              <span className="text-muted-foreground capitalize">
                {item.name}:
              </span>
              <span className="font-medium font-mono text-foreground">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function UsageAnalyticsTab() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const totalTokens = 10000000;
  const usedTokens = 5092450;
  const segmentCount = 80;
  const filledSegments = Math.round((usedTokens / totalTokens) * segmentCount);

  return (
    <div className="space-y-6 p-1">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Analytics
          </h2>
          <p className="text-muted-foreground">
            Monitor AI interactions, API consumption, and chatbot efficiency.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-32 justify-start text-left font-normal bg-card hover:bg-[var(--primary)]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? date.toLocaleDateString() : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
          <Button>
            <Clock className="mr-2 h-4 w-4" />
            Real-time
          </Button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <Card
            key={metric.title}
            className="overflow-hidden border-border/60 shadow-sm hover:border-border transition-all duration-300 hover:shadow-md"
            style={{
              borderLeft: `4px solid ${metric.color}`,
              backgroundColor: metric.bgColor,
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              {metric.change !== 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "font-normal text-xs",
                    metric.change > 0
                      ? "bg-emerald-50 border-emerald-700 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-400 dark:text-emerald-300"
                      : "bg-rose-50 border-rose-700 text-rose-700 dark:bg-rose-950 dark:border-rose-400 dark:text-rose-300"
                  )}
                >
                  {metric.change > 0 ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(metric.change)}%
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {metric.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Token Usage Horizontal Bar */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Free trial tokens (10,000,000)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex w-full gap-[3px] h-7">
            {Array.from({ length: segmentCount }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 rounded-[1px] transition-all duration-500",
                  index < filledSegments
                    ? "bg-[var(--primary)] dark:bg-[var(--primary)] opacity-100"
                    : "bg-muted dark:bg-muted/20"
                )}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-[1px] bg-[var(--primary)] dark:bg-[var(--primary)]" />
                <span className="text-muted-foreground">Your usage</span>
              </div>
            </div>
            <div className="font-mono font-medium text-foreground tracking-tight">
              {usedTokens.toLocaleString()} / {totalTokens.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chatbot Usage Trends */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div className="space-y-1">
            <CardTitle>Chatbot Usage Trends</CardTitle>
            <CardDescription>
              Daily query volume per chatbot over the last 7 days.
            </CardDescription>
          </div>
          <Select defaultValue="7d">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyBotUsage}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "var(--muted-foreground)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="Support Pro"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Sales Advisor"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Onboarding Coach"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Internal Ops"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Dev Helper"
                  stroke="var(--chart-5)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Usage by Assistant Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Usage by Assistant</CardTitle>
            <CardDescription>
              Detailed breakdown of consumption and status.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter bots..."
                className="pl-8 w-[200px] h-9"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-2 h-3.5 w-3.5" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px]">Assistant Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Total Requests</TableHead>
                <TableHead className="text-right">Token Consumption</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Last Active</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {botTableData.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: bot.color }}
                      ></div>
                      <span className="font-medium">{bot.name}</span>
                    </div>
                  </TableCell>

                  {/* Model Column with Dynamic Logo */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ModelLogo model={bot.model} />
                      <span className="text-muted-foreground text-xs font-mono font-medium">
                        {bot.model}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {bot.requests.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {bot.tokens}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-normal border text-xs px-2 py-0.5",
                        bot.status === "Active" &&
                          "bg-emerald-100 border-emerald-600 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-400 dark:text-emerald-300",
                        bot.status === "Inactive" &&
                          "bg-amber-100 border-amber-600 text-amber-700 dark:bg-amber-900/20 dark:border-amber-400 dark:text-amber-300",
                        bot.status === "Maintenance" &&
                          "bg-rose-100 border-rose-600 text-rose-700 dark:bg-rose-900/20 dark:border-rose-400 dark:text-rose-300"
                      )}
                    >
                      {bot.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {bot.lastActive}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Logs</DropdownMenuItem>
                        <DropdownMenuItem>Edit Settings</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Disable
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, BarChart3, Link2, LayoutDashboard, Check } from "lucide-react";
import GhostLoader from "@/components/GhostLoader";

const SETUP_STEPS = [
    { label: "Initializing workspace", Icon: Zap },
    { label: "Loading analytics engine", Icon: BarChart3 },
    { label: "Connecting data pipelines", Icon: Link2 },
    { label: "Preparing your dashboard", Icon: LayoutDashboard },
];

function StepIndicators({ activeStep }: { activeStep: number }) {
    return (
        <div className="flex items-center gap-3 mb-8">
            {SETUP_STEPS.map((step, i) => {
                const isCompleted = i < activeStep;
                const isActive = i === activeStep;
                const StepIcon = step.Icon;

                return (
                    <div key={i} className="flex items-center gap-3">
                        <motion.div
                            className="flex items-center justify-center rounded-full"
                            style={{
                                width: 32,
                                height: 32,
                                background: isCompleted
                                    ? "var(--primary)"
                                    : isActive
                                        ? "var(--primary)"
                                        : "var(--muted)",
                                opacity: isCompleted ? 0.7 : isActive ? 1 : 0.5,
                            }}
                            animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {isCompleted ? (
                                <Check size={14} style={{ color: "var(--primary-foreground)" }} strokeWidth={2.5} />
                            ) : (
                                <StepIcon
                                    size={14}
                                    style={{
                                        color: isActive
                                            ? "var(--primary-foreground)"
                                            : "var(--muted-foreground)",
                                    }}
                                    strokeWidth={2}
                                />
                            )}
                        </motion.div>
                        {i < SETUP_STEPS.length - 1 && (
                            <div
                                className="h-[2px] rounded-full"
                                style={{
                                    width: 28,
                                    background: isCompleted ? "var(--primary)" : "var(--border)",
                                    opacity: isCompleted ? 0.5 : 0.6,
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <motion.div
            className="w-full max-w-[580px] mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        >
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "var(--border)",
                    background: "var(--card)",
                    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)",
                }}
            >
                <div className="flex">
                    {/* Mini sidebar */}
                    <div
                        className="w-[130px] shrink-0 p-3.5 flex flex-col gap-2.5"
                        style={{
                            borderRightWidth: 1,
                            borderRightStyle: "solid",
                            borderRightColor: "var(--border)",
                            background: "var(--sidebar)",
                        }}
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-2 mb-3">
                            <motion.div
                                className="rounded-lg"
                                style={{ width: 24, height: 24, background: "var(--primary)", opacity: 0.15 }}
                                animate={{ opacity: [0.1, 0.2, 0.1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <motion.div
                                className="rounded-md"
                                style={{ width: 50, height: 8, background: "var(--muted)" }}
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                            />
                        </div>
                        {/* Nav items */}
                        {[
                            { w: 85, active: true },
                            { w: 65, active: false },
                            { w: 55, active: false },
                            { w: 72, active: false },
                            { w: 48, active: false },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                className="rounded-md flex items-center gap-1.5 px-2 py-1.5"
                                style={{
                                    background: item.active ? "var(--accent)" : "transparent",
                                }}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + i * 0.08, duration: 0.3 }}
                            >
                                <motion.div
                                    className="rounded"
                                    style={{
                                        width: 12,
                                        height: 12,
                                        background: item.active ? "var(--primary)" : "var(--muted)",
                                        opacity: item.active ? 0.4 : 0.3,
                                    }}
                                    animate={{ opacity: item.active ? [0.3, 0.5, 0.3] : [0.2, 0.35, 0.2] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                />
                                <motion.div
                                    className="rounded-sm"
                                    style={{
                                        width: `${item.w}%`,
                                        height: 6,
                                        background: item.active ? "var(--primary)" : "var(--muted)",
                                        opacity: item.active ? 0.3 : undefined,
                                    }}
                                    animate={{ opacity: item.active ? [0.2, 0.4, 0.2] : [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-4">
                        {/* Breadcrumb bar */}
                        <div className="flex items-center gap-2 mb-4">
                            <motion.div
                                className="rounded-md"
                                style={{ width: 100, height: 10, background: "var(--muted)" }}
                                animate={{ opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <motion.div
                                className="rounded-full"
                                style={{ width: 4, height: 4, background: "var(--muted)" }}
                                animate={{ opacity: [0.2, 0.5, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <motion.div
                                className="rounded-md"
                                style={{ width: 60, height: 10, background: "var(--muted)" }}
                                animate={{ opacity: [0.25, 0.45, 0.25] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                            />
                            <div className="flex-1" />
                            <motion.div
                                className="rounded-full"
                                style={{ width: 22, height: 22, background: "var(--muted)" }}
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                            />
                        </div>

                        {/* Stat cards row */}
                        <div className="grid grid-cols-4 gap-2.5 mb-4">
                            {[
                                { color: "oklch(0.75 0.15 30)" },
                                { color: "oklch(0.7 0.12 250)" },
                                { color: "oklch(0.72 0.14 150)" },
                                { color: "oklch(0.73 0.16 60)" },
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    className="rounded-xl p-2.5 relative overflow-hidden"
                                    style={{
                                        background: "var(--muted)",
                                        minHeight: 62,
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
                                >
                                    {/* Colored accent strip at top */}
                                    <motion.div
                                        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
                                        style={{ background: card.color, opacity: 0.4 }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: 1.1 + i * 0.1, duration: 0.4 }}
                                    />
                                    <div className="flex items-center justify-between mb-2">
                                        <motion.div
                                            className="rounded-sm"
                                            style={{ width: "60%", height: 6, background: "var(--border)" }}
                                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                                            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.12 }}
                                        />
                                        <motion.div
                                            className="rounded-full"
                                            style={{ width: 14, height: 14, background: card.color, opacity: 0.25 }}
                                            animate={{ opacity: [0.15, 0.3, 0.15] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                                        />
                                    </div>
                                    <motion.div
                                        className="rounded-sm"
                                        style={{ width: "40%", height: 16, background: "var(--border)" }}
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2.2, repeat: Infinity, delay: 0.06 + i * 0.12 }}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Chart area */}
                        <motion.div
                            className="rounded-xl overflow-hidden relative"
                            style={{
                                background: "var(--muted)",
                                height: 90,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3, duration: 0.4 }}
                        >
                            {/* Chart title */}
                            <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                                <motion.div
                                    className="rounded-sm"
                                    style={{ width: 70, height: 6, background: "var(--border)" }}
                                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <motion.div
                                    className="rounded-sm"
                                    style={{ width: 40, height: 6, background: "var(--border)" }}
                                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                                />
                            </div>
                            {/* Bars */}
                            <div className="flex items-end gap-[3px] h-[62px] px-3 pb-2.5">
                                {[30, 50, 38, 65, 45, 58, 42, 72, 55, 78, 48, 62, 40, 68].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-1 rounded-t"
                                        style={{ background: "var(--border)" }}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{
                                            delay: 1.5 + i * 0.06,
                                            duration: 0.5,
                                            ease: "easeOut",
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function DashboardLoading() {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % SETUP_STEPS.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{ background: "var(--background)" }}
        >
            {/* Subtle radial gradient overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(circle at 50% 30%, var(--accent) 0%, transparent 60%)",
                    opacity: 0.4,
                }}
            />

            <div className="relative flex flex-col items-center w-full px-6 max-w-[640px]">
                {/* Ghost Loader */}
                <motion.div
                    className="mb-5"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <GhostLoader />
                </motion.div>

                {/* Title */}
                <motion.h2
                    className="text-xl font-semibold mb-2 space-mono-bold text-center"
                    style={{ color: "var(--foreground)" }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    Setting up your dashboard
                </motion.h2>

                {/* Current step label */}
                <div className="h-6 mb-5 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={activeStep}
                            className="text-sm space-mono-regular"
                            style={{ color: "var(--muted-foreground)" }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                        >
                            {SETUP_STEPS[activeStep].label}...
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Step progress indicators */}
                <StepIndicators activeStep={activeStep} />

                {/* Dashboard skeleton */}
                <DashboardSkeleton />
            </div>
        </div>
    );
}

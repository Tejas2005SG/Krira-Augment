"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Database, Cpu, Sparkles, Zap, Shield, Clock, ExternalLink, Bot, Brain, Layers, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";
import LogoCloud from "./logo-cloud";
import Features from "./features-1";
import { AnimatedBeam } from "./ui/animated-beam";
import Pricing from "./pricing";
import FAQSection from "./faqs-3";
import Footer from "./footer";
import { motion } from "framer-motion";
import ParticleText from "./particle-text";
import { BorderBeam } from "@/components/ui/border-beam";

const IntegrationShowcase: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const knowledgeRef = React.useRef<HTMLDivElement | null>(null)
  const embeddingRef = React.useRef<HTMLDivElement | null>(null)
  const llmRef = React.useRef<HTMLDivElement | null>(null)
  const analyticsRef = React.useRef<HTMLDivElement | null>(null)

  const beamConfig = [
    {
      from: knowledgeRef,
      to: embeddingRef,
      curvature: 80,
      gradientStartColor: "#3b82f6",
      gradientStopColor: "#06b6d4",
      pathColor: "#93c5fd",
      delay: 0.3,
    },
    {
      from: embeddingRef,
      to: llmRef,
      curvature: 60,
      gradientStartColor: "#06b6d4",
      gradientStopColor: "#3b82f6",
      pathColor: "#67e8f9",
      delay: 0.6,
    },
    {
      from: llmRef,
      to: analyticsRef,
      curvature: 70,
      gradientStartColor: "#22d3ee",
      gradientStopColor: "#14b8a6",
      pathColor: "#67e8f9",
      delay: 0.9,
      reverse: true,
    },
  ]

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="relative grid gap-5 rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-slate-950/90 p-6 shadow-2xl shadow-primary/5 backdrop-blur-xl overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative grid gap-5 md:grid-cols-2">
        <motion.div
          ref={knowledgeRef}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/10">
              <Database className="size-5 text-primary" />
            </div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">Knowledge Graph</p>
          </div>
          <p className="text-xl font-bold text-foreground">Docs, SQL, Notion</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Unified ingestion with automatic chunking and metadata enrichment.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">PDF</span>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500 font-medium">CSV</span>
            <span className="px-2 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium">API</span>
          </div>
        </motion.div>

        <motion.div
          ref={embeddingRef}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-blue-50 to-white dark:from-slate-900/90 dark:to-slate-800/50 p-5 shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
              <Layers className="size-5 text-blue-500" />
            </div>
            <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold">Vector DB</p>
          </div>
          <p className="text-xl font-bold text-foreground">Pinecone · Chroma</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Managed embeddings with auto-scaling dimensions per provider.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-white dark:border-slate-900" />
              <div className="size-6 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 border-2 border-white dark:border-slate-900" />
            </div>
            <span className="text-xs text-muted-foreground">+ 5 more providers</span>
          </div>
        </motion.div>

        <motion.div
          ref={llmRef}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="group rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-blue-500/5 to-cyan-500/10 dark:from-primary/20 dark:via-blue-500/10 dark:to-cyan-500/20 p-5 shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 shadow-lg shadow-primary/30">
              <Bot className="size-5 text-white" />
            </div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">LLM Orchestration</p>
          </div>
          <p className="text-xl font-bold text-foreground">GPT · Claude · Gemini</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Deterministic routing across providers with latency-aware fallbacks.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
            </div>
            <span className="text-xs text-muted-foreground">Auto-failover enabled</span>
          </div>
        </motion.div>

        <motion.div
          ref={analyticsRef}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/50 p-5 shadow-lg hover:shadow-xl hover:border-cyan-500/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10">
              <Zap className="size-5 text-cyan-500" />
            </div>
            <p className="text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-semibold">Analytics</p>
          </div>
          <p className="text-xl font-bold text-foreground">Realtime Insights</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Latency</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                  <div className="w-1/4 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                </div>
                <span className="text-sm font-semibold text-foreground">215ms</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                  <div className="w-[94%] h-full bg-gradient-to-r from-blue-500 to-primary rounded-full" />
                </div>
                <span className="text-sm font-semibold text-foreground">94%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cost/query</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">$0.004</span>
            </div>
          </div>
        </motion.div>
      </div>

      {beamConfig.map((beam, index) => (
        <AnimatedBeam
          key={`beam-${index}`}
          containerRef={containerRef}
          fromRef={beam.from}
          toRef={beam.to}
          curvature={beam.curvature}
          pathColor={beam.pathColor}
          pathOpacity={0.35}
          gradientStartColor={beam.gradientStartColor}
          gradientStopColor={beam.gradientStopColor}
          delay={beam.delay}
          duration={6}
          reverse={beam.reverse}
          startYOffset={-10}
          endYOffset={-10}
        />
      ))}
    </motion.div>
  )
}


const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HomePage() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Smoke/Nebula Effect - Static for performance */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-l from-blue-600/8 via-purple-500/4 to-transparent blur-[100px]" />
          <div
            className="absolute top-0 right-0 h-full w-full opacity-20"
            style={{
              background: 'radial-gradient(circle at 100% 50%, rgba(59, 130, 246, 0.1), transparent 60%)',
            }}
          />
        </div>

        {/* Hero Section */}
        <section className="relative z-10 min-h-[90vh] flex flex-col justify-center py-24 overflow-hidden">
          {/* Floating Gradient Orbs - Static for performance */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-primary/15 via-blue-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-[15%] w-96 h-96 bg-gradient-to-tl from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-6 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left relative z-20">
                <AnimatedGroup variants={transitionVariants}>
                  {/* Enhanced Badge */}
                  <Link
                    href="#link"
                    className="group relative inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-blue-500/10 to-primary/10 p-1 pl-4 pr-1 shadow-lg shadow-primary/10 backdrop-blur-md transition-all hover:shadow-primary/25 hover:border-primary/40 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 mt-8 mb-8 overflow-hidden"
                  >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      Now supporting GPT 5.1 & Claude 4.5 Sonnet
                    </span>
                    <span className="h-4 w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent"></span>
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary shadow-md transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110">
                      <ArrowRight className="size-3 text-primary-foreground" />
                    </div>
                  </Link>

                  {/* Enhanced Heading */}
                  <h1 className="font-montserrat font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] mb-6 pb-2">
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="inline-block pr-4 font-black text-primary drop-shadow-sm"
                      style={{
                        letterSpacing: '0.05em',
                      }}
                    >
                      KRIRA
                    </motion.span>
                    <br />
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="relative inline-block font-medium tracking-tight"
                    >
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400 bg-[length:200%_auto] animate-gradient">
                        AUGMENT
                      </span>
                      {/* Decorative underline */}
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent origin-left"
                      />
                    </motion.span>
                  </h1>

                  {/* Enhanced Tagline */}
                  <div className="mt-8 flex flex-col items-center lg:items-start gap-5">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="relative rounded-2xl border border-primary/30 bg-primary/5 px-6 py-3 overflow-hidden w-fit backdrop-blur-sm"
                    >
                      <BorderBeam size={120} duration={8} delay={0} colorFrom="#3b82f6" colorTo="#06b6d4" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-500/5" />
                      <TextEffect
                        preset="fade-in-blur"
                        speedSegment={0.3}
                        as="span"
                        className="text-primary font-bold text-base md:text-lg relative z-10"
                      >
                        Production-Ready RAG in Minutes.
                      </TextEffect>
                    </motion.div>

                    <TextEffect
                      preset="fade-in-blur"
                      speedSegment={0.3}
                      as="p"
                      className="max-w-xl text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed lg:mx-0 mx-auto"
                      delay={1.5}
                    >
                      Automate chunking, embeddings, and retrieval with zero configuration. Ship intelligent AI features faster.
                    </TextEffect>
                  </div>

                  {/* Enhanced CTA Buttons */}
                  <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative group"
                    >
                      <Button
                        asChild
                        size="lg"
                        className="h-12 rounded-xl px-6 text-base bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-semibold transition-all duration-300"
                      >
                        <Link href="#link" className="flex items-center gap-2">
                          <Zap className="size-4" />
                          Start Building
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="h-12 rounded-xl px-6 text-base text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white hover:border-primary/50 transition-all duration-300"
                      >
                        <Link href="#link" className="flex items-center gap-2">
                          <Play className="size-4" />
                          Watch a Demo
                        </Link>
                      </Button>
                    </motion.div>
                  </div>

                  {/* Trust Indicators / Stats Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="mt-12 flex flex-wrap items-center gap-6 lg:gap-10 justify-center lg:justify-start"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-center size-8 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                        <Shield className="size-4" />
                      </div>
                      <span className="font-medium">SOC 2 Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-center size-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Clock className="size-4" />
                      </div>
                      <span className="font-medium">99.9% Uptime</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-center size-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        <Zap className="size-4" />
                      </div>
                      <span className="font-medium">&lt;200ms Latency</span>
                    </div>
                  </motion.div>
                </AnimatedGroup>
              </div>

              {/* Right Content - Visuals */}
              <div className="relative h-[550px] hidden lg:flex flex-col items-center justify-center">
                {/* Background glow effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-primary/10 via-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
                </div>

                {/* Decorative rings - CSS animations for performance */}
                <div className="absolute inset-0 rounded-full border border-dashed border-primary/20 animate-[spin_60s_linear_infinite] will-change-transform" />
                <div className="absolute inset-10 rounded-full border border-dotted border-blue-500/20 animate-[spin_40s_linear_infinite_reverse] will-change-transform" />
                <div className="absolute inset-20 rounded-full border border-dashed border-cyan-500/15 animate-[spin_50s_linear_infinite] will-change-transform" />

                {/* Central Glowing Orb - Static */}
                <div className="absolute inset-28 rounded-full bg-gradient-to-br from-primary/20 via-blue-500/15 to-cyan-500/20 blur-2xl" />

                {/* Center Icon/Logo Area */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="relative z-10 flex flex-col items-center justify-center"
                >
                  <div className="relative">
                    {/* Static glow behind logo */}
                    <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-primary/30 via-blue-500/20 to-cyan-500/30 blur-xl" />
                    
                    {/* Rotating rings - CSS for performance */}
                    <div className="absolute -inset-10 rounded-full border-2 border-dashed border-primary/30 animate-[spin_20s_linear_infinite] will-change-transform" />
                    <div className="absolute -inset-6 rounded-full border border-dotted border-blue-500/25 animate-[spin_25s_linear_infinite_reverse] will-change-transform" />
                    
                    {/* Main icon container */}
                    <div className="relative size-36 rounded-full bg-gradient-to-br from-primary via-blue-500 to-cyan-500 p-[3px] shadow-2xl shadow-primary/30">
                      <div className="size-full rounded-full bg-white dark:bg-gray-950 flex items-center justify-center overflow-hidden">
                        <Image
                          src="/krira-augment-logo.png"
                          alt="Krira Augment"
                          width={110}
                          height={110}
                          className="object-contain"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Text below icon */}
                  <p className="mt-8 text-xl font-bold bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    AI-Powered RAG
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Intelligent Document Processing
                  </p>
                </motion.div>

                {/* Floating Feature Cards - Simplified animations */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="absolute top-8 -left-4 z-20"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white/95 dark:bg-gray-900/90 backdrop-blur-lg px-4 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                      <Brain className="size-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Smart Embeddings</span>
                      <p className="text-xs text-muted-foreground">Auto-chunking & indexing</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="absolute top-24 -right-4 z-20"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-white/95 dark:bg-gray-900/90 backdrop-blur-lg px-4 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                      <Database className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Vector Database</span>
                      <p className="text-xs text-muted-foreground">Pinecone & Chroma</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="absolute bottom-28 -left-4 z-20"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-white/95 dark:bg-gray-900/90 backdrop-blur-lg px-4 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5">
                      <Layers className="size-5 text-cyan-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Semantic Search</span>
                      <p className="text-xs text-muted-foreground">Context-aware retrieval</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="absolute bottom-40 -right-4 z-20"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-white/95 dark:bg-gray-900/90 backdrop-blur-lg px-4 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5">
                      <Zap className="size-5 text-green-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Real-time Sync</span>
                      <p className="text-xs text-muted-foreground">Live data updates</p>
                    </div>
                  </div>
                </motion.div>

                {/* Presented by KriraLabs.com */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <a
                    href="https://kriralabs.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-gray-900/90 backdrop-blur-lg px-5 py-2.5 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all duration-300"
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400">Presented by</span>
                    <span className="text-sm font-semibold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-cyan-500 transition-all">kriralabs.com</span>
                    <ExternalLink className="size-3 text-gray-400 group-hover:text-primary transition-colors" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Cloud Section */}
        <section className="bg-white dark:bg-black py-6 md:py-10 lg:py-12">
          <div className="group relative m-auto max-w-5xl px-6 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            <LogoCloud />
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-background py-12 md:py-16 lg:py-20">
          <div className="m-auto max-w-6xl px-6">
            <Features />
          </div>
        </section>

        {/* Integrations Section */}
        <section className="bg-background py-12 md:py-16 lg:py-24 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
          </div>

          <div className="m-auto max-w-6xl px-6 relative">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5"
                  >
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-sm font-semibold uppercase tracking-widest text-primary">Integrations</p>
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                    Connect every knowledge stream to a{" "}
                    <span className="bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      single production RAG pipeline
                    </span>
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Krira orchestrates ingestion, embeddings, vector databases, and LLM routing with one-click deployments.
                  Visualize the entire flywheel below.
                </p>
                <div className="space-y-5">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/10 shrink-0">
                      <Database className="size-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg">Source anything</p>
                      <p className="text-muted-foreground text-sm mt-1">Sync docs, tickets, and databases with automatic schema detection.</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:border-blue-500/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 shrink-0">
                      <Cpu className="size-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg">Adaptive compute</p>
                      <p className="text-muted-foreground text-sm mt-1">Smart routing keeps latency low while honoring cost ceilings.</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:border-cyan-500/30 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 shrink-0">
                      <Shield className="size-6 text-cyan-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-lg">Enterprise security</p>
                      <p className="text-muted-foreground text-sm mt-1">SOC 2 compliant with end-to-end encryption and audit logs.</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
              <IntegrationShowcase />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-background py-8 md:py-12 lg:py-16">
          <div className="m-auto max-w-6xl px-6">
            <Pricing />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-background py-8 md:py-12 lg:py-16">
          <div className="m-auto max-w-6xl px-6">
            <FAQSection />
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-background pt-16 md:pt-20">
          <Footer />
        </footer>
      </main>
    </>
  );
}
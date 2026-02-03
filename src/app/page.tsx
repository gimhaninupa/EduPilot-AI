"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Brain, Sparkles, Zap, Layout, GraduationCap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium">
                New: AI Study Companion
              </div>
            </motion.div>
            <motion.h1
              className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Master Your Studies with <br className="hidden sm:inline" />
              <span className="text-primary">EduPilot AI</span>
            </motion.h1>
            <motion.p
              className="mx-auto max-w-[700px] text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Your personal AI tutor that generates notes, creates quizzes, and tracks your progress. Study smarter, not harder.
            </motion.p>
            <motion.div
              className="space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/login">
                <Button size="lg" className="h-12 px-8">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

            </motion.div>
          </div>
        </div>
      </section>


    </div>
  )
}

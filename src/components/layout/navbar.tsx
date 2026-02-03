"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Moon, Sun, BookOpen, User } from "lucide-react"
import { useTheme } from "next-themes"

export function Navbar() {
    const { setTheme, theme } = useTheme()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center px-4">
                <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span>EduPilot AI</span>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <Link href="/profile" className="text-sm font-medium transition-colors hover:text-primary">
                        <User className="h-5 w-5" />
                    </Link>

                </div>
            </div>
        </header>
    )
}

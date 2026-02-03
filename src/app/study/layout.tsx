"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MessageSquare, FileText, CheckSquare, BarChart2, BookOpen, Menu, LogOut, History } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"

// Keeping it simple for now without Sheet component unless I build it
// I didn't build Sheet. I'll use a simple mobile header toggle or just simple layout.
// I'll stick to provided plan: simple mobile header.

import { X } from "lucide-react"
// Removed Radix Sheet imports to use custom implementation
// import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

export default function StudyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const navItems = [
        { href: "/study", label: "Chat Assistant", icon: MessageSquare },
        { href: "/study/notes", label: "Generate Notes", icon: FileText },
        { href: "/study/quiz", label: "Quizzes", icon: CheckSquare },
        { href: "/study/history", label: "History", icon: History },

    ]

    const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
        <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 mb-4">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span>EduPilot AI</span>
                </Link>
            </div>
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onLinkClick}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                            pathname === item.href
                                ? "bg-primary/10 text-primary font-bold shadow-sm"
                                : "text-muted-foreground hover:bg-black/5 hover:text-black"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>
            <div className="mt-auto px-4 pb-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    asChild
                >
                    <Link href="/login" onClick={() => {
                        localStorage.removeItem("edupilot-auth")
                        localStorage.removeItem("edupilot-user-email")
                    }}>
                        <LogOut className="h-4 w-4" />
                        Log out
                    </Link>
                </Button>
            </div>
        </div>
    )

    return (
        <div className="flex min-h-screen">
            {/* Custom Mobile Menu Overlay - Rendered at root level */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-[9998] bg-black/80 transition-opacity md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Custom Mobile Sidebar - Rendered at root level */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-y-0 left-0 z-[9999] w-[240px] sm:w-[300px] glass p-6 animate-in slide-in-from-left duration-300 md:hidden"
                >
                    <div className="flex flex-col space-y-4 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-lg font-bold">EduPilot AI</span>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <X className="h-6 w-6" />
                                <span className="sr-only">Close menu</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden w-64 border-r glass md:block m-4 rounded-2xl h-[calc(100vh-2rem)] sticky top-4">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
                    {/* Mobile Menu Trigger */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>



                    <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <span>EduPilot AI</span>
                    </Link>
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}

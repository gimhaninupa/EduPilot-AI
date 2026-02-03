"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BookOpen, Loader2 } from "lucide-react"

// Firebase Imports
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    })

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Create the Authentication Account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            )
            const user = userCredential.user

            // 2. Create the User Profile in Firestore Database
            // This is where we save XP, Level, and Progress!
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                xp: 0,             // Start with 0 XP
                level: 1,          // Start at Level 1
                notesCreated: 0,
                quizzesTaken: 0,
                createdAt: new Date().toISOString()
            })

            // 3. Update the Auth Profile Name
            await updateProfile(user, { displayName: formData.name })

            // 4. Success! Redirect to Dashboard
            router.push("/study") // Redirect to Study Dashboard

        } catch (error: any) {
            console.error("Signup Error:", error)
            alert(error.message) // Show error to user (e.g., "Email already in use")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50 animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md"
            >
                <Card className="border-muted/50 bg-background/60 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full bg-primary/10 ring-1 ring-primary/20">
                                <BookOpen className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Create an account
                        </CardTitle>
                        <CardDescription>
                            Enter your details to get started with EduPilot AI
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignup}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    required
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="student@example.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className="bg-background/50"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Sign Up"
                                )}
                            </Button>
                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
    User, BookOpen, Trophy, Clock, Zap, Settings, Save, X, ArrowLeft, LogOut 
} from "lucide-react"

// Firebase Imports
import { auth, db } from "@/lib/firebase"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserProfile {
    uid: string
    name: string
    email: string
    level: number
    xp: number
    nextLevelXp: number // We can calculate this or store it
    studyHours: number
    quizzesTaken: number
    notesCreated: number
}

const DEFAULT_USER: UserProfile = {
    uid: "",
    name: "Guest Student",
    email: "guest@example.com",
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    studyHours: 0,
    quizzesTaken: 0,
    notesCreated: 0
}

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<UserProfile>(DEFAULT_USER)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)

    // Form state for editing
    const [editForm, setEditForm] = useState({ name: "", email: "" })

    // 1. LISTEN TO FIREBASE DATA
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                // If not logged in, send to login page
                router.push("/login")
                return
            }

            // Real-time listener for User Data
            const unsubscribeDb = onSnapshot(doc(db, "users", currentUser.uid), (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data()
                    setUser({
                        uid: currentUser.uid,
                        name: data.name || currentUser.displayName || "Student",
                        email: data.email || currentUser.email || "",
                        level: data.level || 1,
                        xp: data.xp || 0,
                        nextLevelXp: 1000, // You can make this dynamic later (e.g. level * 1000)
                        studyHours: data.studyHours || 0,
                        quizzesTaken: data.quizzesTaken || 0,
                        notesCreated: data.notesCreated || 0
                    })
                }
                setLoading(false)
            })

            return () => unsubscribeDb()
        })

        return () => unsubscribeAuth()
    }, [router])

    // 2. SAVE CHANGES TO FIREBASE
    const handleEditClick = () => {
        setEditForm({ name: user.name, email: user.email })
        setIsEditing(true)
    }

    const handleSave = async () => {
        try {
            // Update Firestore
            const userRef = doc(db, "users", user.uid)
            await updateDoc(userRef, {
                name: editForm.name,
                email: editForm.email
            })
            
            // UI Update is handled automatically by the onSnapshot listener above!
            setIsEditing(false)
        } catch (error) {
            console.error("Error updating profile:", error)
            alert("Failed to update profile.")
        }
    }

    const handleLogout = async () => {
        await signOut(auth)
        router.push("/login")
    }

    const accuracy = user.quizzesTaken > 0 ? 85 : 0; // Placeholder

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row gap-6 items-center md:items-start"
            >
                <div>
                    <Link href="/study">
                        <Button variant="ghost" size="icon" className="mb-4 md:mb-0">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                </div>
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl">
                    <User className="h-12 w-12 text-primary" />
                </div>

                <div className="text-center md:text-left space-y-2 flex-1 w-full max-w-lg">
                    {isEditing ? (
                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2 justify-center md:justify-start">
                                <Button onClick={handleSave} size="sm"><Save className="w-4 h-4 mr-2" /> Save</Button>
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}><X className="w-4 h-4 mr-2" /> Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold">{user.name}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 justify-center md:justify-start mt-2">
                                <div className="text-sm font-medium bg-secondary px-3 py-1 rounded-full">
                                    Level {user.level}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {user.xp} / {user.nextLevelXp} XP
                                </div>
                            </div>
                            <div className="w-full max-w-md mt-2">
                                <Progress value={(user.xp / user.nextLevelXp) * 100} className="h-2" />
                            </div>
                        </>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2" onClick={handleEditClick}>
                            <Settings className="h-4 w-4" /> Edit
                        </Button>
                        <Button variant="destructive" size="icon" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Study Hours", value: user.studyHours, icon: Clock, color: "text-blue-500" },
                    { label: "Notes Created", value: user.notesCreated, icon: BookOpen, color: "text-green-500" },
                    { label: "Quizzes Taken", value: user.quizzesTaken, icon: Zap, color: "text-yellow-500" },
                    { label: "Avg. Accuracy", value: `${accuracy}%`, icon: Trophy, color: "text-purple-500" }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card>
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className={`p-3 rounded-full bg-background border shadow-sm ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity / Content - (Keep your existing card logic here) */}
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Learning Journey</CardTitle>
                        <CardDescription>Your weekly validation progress</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg m-6 border-dashed border-2">
                        Chart / Activity Graph Placeholder
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Achievements</CardTitle>
                        <CardDescription>Recent badges earned</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { name: "Early Bird", desc: "Studied before 8 AM", date: "2 days ago" },
                            { name: "Quiz Master", desc: "Scored 100% on a quiz", date: "1 week ago" },
                            { name: "Note Taker", desc: "Created 10+ notes", date: "2 weeks ago" }
                        ].map((badge, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Trophy className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{badge.name}</p>
                                    <p className="text-xs text-muted-foreground">{badge.desc}</p>
                                </div>
                                <div className="ml-auto text-xs text-muted-foreground">
                                    {badge.date}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
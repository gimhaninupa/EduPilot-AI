"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart2, BookOpen, Clock, Activity } from "lucide-react"
import { useEffect, useState } from "react"

export default function ProgressPage() {
    const [stats, setStats] = useState([
        { label: "Hours Studied", value: "0", icon: Clock },
        { label: "Notes Created", value: "0", icon: BookOpen },
        { label: "Quizzes Taken", value: "0", icon: BarChart2 },
        { label: "Total XP", value: "0", icon: Activity },
    ])

    useEffect(() => {
        // Load User Data
        const savedUser = localStorage.getItem("edupilot-user")
        const savedNotes = localStorage.getItem("edupilot-notes")

        let userStats = { studyHours: 0, quizzesTaken: 0, xp: 0 }
        let notesCount = 0

        if (savedUser) {
            userStats = JSON.parse(savedUser)
        }
        if (savedNotes) {
            notesCount = JSON.parse(savedNotes).length
        }

        setStats([
            { label: "Hours Studied", value: userStats.studyHours.toString(), icon: Clock },
            { label: "Notes Created", value: notesCount.toString(), icon: BookOpen }, // Changed "Topics Covered" to "Notes Created" to match real data
            { label: "Quizzes Taken", value: userStats.quizzesTaken.toString(), icon: BarChart2 },
            { label: "Total XP", value: userStats.xp.toString(), icon: Activity }, // Changed "Average Score" to "XP" as we strictly track XP
        ])
    }, [])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Learning Progress</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                Lifetime statistics
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Subject Mastery</CardTitle>
                        <CardDescription>Based on your quiz performance (Coming Soon)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
                        Take more quizzes to unlock mastery insights!
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your latest study sessions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                            No recent activity recorded.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

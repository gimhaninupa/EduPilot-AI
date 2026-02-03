"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Trash2, Clock, ArrowRight } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, query, getDocs, deleteDoc, doc, orderBy, where, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

// Helper for time ago
const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

interface ChatSession {
    id: string
    timestamp: number
    title: string
    preview: string
}

export default function HistoryPage() {
    const router = useRouter()
    const [sessions, setSessions] = useState<ChatSession[]>([])

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Subscribe to real-time chat updates
                const q = query(collection(db, "users", user.uid, "chats"), orderBy("timestamp", "desc"));

                const unsubscribeChats = onSnapshot(q, (snapshot) => {
                    const mappedSessions = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            timestamp: data.timestamp || Date.now(),
                            title: data.title || "Untitled Chat",
                            preview: data.messages && data.messages.length > 1
                                ? (data.messages[1].content.substring(0, 100) + "...")
                                : "No preview available"
                        } as ChatSession
                    });
                    setSessions(mappedSessions);
                });

                return () => unsubscribeChats();
            } else {
                setSessions([]);
                // Optional: router.push("/login")
            }
        })

        return () => unsubscribeAuth()
    }, [router])

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault()
        e.stopPropagation()

        const user = auth.currentUser;
        if (user) {
            try {
                await deleteDoc(doc(db, "users", user.uid, "chats", id));
                // State updates automatically via onSnapshot
            } catch (error) {
                console.error("Error deleting chat:", error);
                alert("Failed to delete chat.");
            }
        }
    }

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Chat History</h1>
                <p className="text-muted-foreground">Resume your past conversations with EduPilot AI.</p>
            </div>

            {sessions.length === 0 ? (
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                        <p>No chat history found.</p>
                        <Button variant="link" onClick={() => router.push("/study")}>Start a new chat</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {sessions.map((session) => (
                        <Card
                            key={session.id}
                            className="group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => router.push(`/study?sessionId=${session.id}`)}
                        >
                            <CardContent className="p-6 flex items-start justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                            {session.title}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {session.preview}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                        <Clock className="h-3 w-3" />
                                        {timeAgo(session.timestamp)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-background/80 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={(e) => handleDelete(e, session.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

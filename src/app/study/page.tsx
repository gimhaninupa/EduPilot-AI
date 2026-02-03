"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
// REMOVED: import { generateResponse } from "@/lib/ai" 
import { Send, User, Bot, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

// Define the Message type right here to avoid import errors
type Message = {
    id: string
    role: "system" | "user" | "assistant"
    content: string
}

export default function StudyPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const sessionId = searchParams.get("sessionId")

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load Session
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && sessionId) {
                try {
                    const docRef = doc(db, "users", user.uid, "chats", sessionId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setMessages(docSnap.data().messages);
                    } else {
                        // Session not found, maybe redirect or just start new?
                        // router.push("/study") // Optional
                    }
                } catch (error) {
                    console.error("Error loading chat:", error);
                }
            } else if (!sessionId) {
                // Default welcome message for new session
                setMessages([
                    { id: "1", role: "assistant", content: "Hi! I'm your AI study assistant. Ask me anything or tell me what topic you're studying." }
                ])
            }
        });
        return () => unsubscribe();
    }, [sessionId, router])

    // Save Session
    useEffect(() => {
        const saveSession = async () => {
            if (messages.length > 1) {
                const user = auth.currentUser;
                if (user) {
                    const currentId = sessionId || messages[1]?.id || Date.now().toString()

                    const sessionData = {
                        id: currentId,
                        timestamp: Date.now(), // Update timestamp on new message
                        title: messages.find(m => m.role === "user")?.content.substring(0, 40) || "New Chat",
                        messages: messages
                    }

                    try {
                        await setDoc(doc(db, "users", user.uid, "chats", currentId), sessionData, { merge: true });
                    } catch (error) {
                        console.error("Error saving chat:", error);
                    }
                }
            }
        }

        // Debounce saving slightly or just save on every change (simplest for now)
        const timeoutId = setTimeout(saveSession, 1000);
        return () => clearTimeout(timeoutId);

    }, [messages, sessionId])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        // 1. Prepare the new User Message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        }

        // 2. Add it to the UI immediately
        const newHistory = [...messages, userMessage]
        setMessages(newHistory)
        setInput("")
        setIsLoading(true)

        try {
            // 3. FETCH the Real AI from your new Backend Route
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newHistory }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to reach EduPilot API");
            }

            const data = await response.json();

            // 4. Add the AI's response to the UI
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.text
            }
            setMessages((prev) => [...prev, botMessage])

        } catch (error) {
            console.error("AI Error:", error)
            // Optional: Show an error message bubble to the user
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "⚠️ I'm having trouble connecting to the server. Please check your API key."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="flex flex-col h-[calc(100vh-8rem)] glass shadow-2xl border-white/40">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-message`}>
                        <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-zinc-900 text-zinc-50'
                            )}>
                                {m.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                            </div>
                            <div className={cn(
                                "rounded-lg p-3 text-sm shadow-sm",
                                m.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-black dark:text-white border'
                            )}>
                                {m.role === 'assistant' ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="break-words lowercase first-letter:uppercase">{m.content}</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div className="rounded-lg p-3 bg-card border">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-muted/20">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question about your studies..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="hover-expensive transition-all duration-300">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    EduPilot AI can make mistakes. Check important info.
                </p>
            </div>
        </Card>
    )
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Plus, Save, Trash2, Download } from "lucide-react"
import { jsPDF } from "jspdf"
import { cn } from "@/lib/utils"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc, increment, collection, query, onSnapshot, setDoc, deleteDoc, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

interface Note {
    id: string
    title: string
    content: string
    date: string
}
type Message = {
    role: "user" | "model" | "assistant" | "system";
    content: string;
};

export default function NotesPage() {
    const [topic, setTopic] = useState("")
    const [wordCount, setWordCount] = useState(500)
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentNote, setCurrentNote] = useState<Note | null>(null)
    const [savedNotes, setSavedNotes] = useState<Note[]>([])
    const [view, setView] = useState<"list" | "edit">("list")

    // Load notes from Firestore
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(collection(db, "users", user.uid, "notes"), orderBy("date", "desc"));
                const unsubscribeNotes = onSnapshot(q, (snapshot) => {
                    const notes = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Note[];
                    setSavedNotes(notes);
                });
                return () => unsubscribeNotes();
            } else {
                setSavedNotes([]);
            }
        });
        return () => unsubscribeAuth();
    }, [])

    // REMOVED: Saving to localStorage effect

    const handleGenerate = async () => {
        if (!topic.trim()) return

        setIsGenerating(true)
        try {
            const prompt = `Generate comprehensive study notes for the topic: ${topic}. The notes should be approximately ${wordCount} words long. Format with clear headings, bullet points, and key concepts. Output pure Markdown.`

            // Call the API route
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: "user", content: prompt }]
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to generate notes");
            }

            const data = await response.json();

            const newNote: Note = {
                id: Date.now().toString(),
                title: topic,
                content: data.text,
                date: new Date().toLocaleDateString()
            }

            setCurrentNote(newNote)
            setView("edit")
        } catch (error) {
            console.error("Failed to generate notes:", error)
            // Optional: You could add a toast notification here
            alert("Failed to generate notes. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSave = async () => {
        if (!currentNote) return

        const user = auth.currentUser
        if (user) {
            try {
                // Check if it's new by seeing if it's already in the saved list (simple check)
                const isNew = !savedNotes.find(n => n.id === currentNote.id)

                // Save to Firestore
                await setDoc(doc(db, "users", user.uid, "notes", currentNote.id), {
                    title: currentNote.title,
                    content: currentNote.content,
                    date: currentNote.date || new Date().toLocaleDateString(),
                    timestamp: Date.now()
                }, { merge: true })

                if (isNew) {
                    const userRef = doc(db, "users", user.uid)
                    await updateDoc(userRef, {
                        notesCreated: increment(1),
                        xp: increment(50)
                    })
                }
            } catch (error) {
                console.error("Error saving note to Firestore:", error)
            }
        }

        setView("list")
        setTopic("")
    }

    const handleDelete = async (id: string) => {
        const user = auth.currentUser
        if (user) {
            try {
                await deleteDoc(doc(db, "users", user.uid, "notes", id))
            } catch (error) {
                console.error("Failed to delete note:", error)
            }
        }

        if (currentNote?.id === id) {
            setCurrentNote(null)
            setView("list")
        }
    }

    const handleDownloadPDF = () => {
        if (!currentNote) return

        const doc = new jsPDF()

        // Title
        doc.setFontSize(22)
        doc.text(currentNote.title, 20, 20)

        // Date
        doc.setFontSize(10)
        doc.text(currentNote.date, 20, 30)

        // Content
        doc.setFontSize(12)

        // Split text to fit page width
        const splitText = doc.splitTextToSize(currentNote.content, 170)

        // Add text and handle pagination automatically (basic generic text)
        // For better markdown rendering in PDF, complex logic is needed, 
        // but for now we stick to simple text dump as requested.
        // We start printing at Y=40
        let y = 40

        // Simple pagination loop
        const pageHeight = doc.internal.pageSize.height

        splitText.forEach((line: string) => {
            if (y > pageHeight - 20) {
                doc.addPage()
                y = 20
            }
            doc.text(line, 20, y)
            y += 7
        })

        doc.save(`${currentNote.title.replace(/\s+/g, '_')}_notes.pdf`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Study Notes</h1>
                {view === "list" && (
                    <Button onClick={() => { setCurrentNote({ id: Date.now().toString(), title: "New Note", content: "", date: new Date().toLocaleDateString() }); setView("edit"); }}>
                        <Plus className="mr-2 h-4 w-4" /> New Note
                    </Button>
                )}
                {view === "edit" && (
                    <Button variant="outline" onClick={() => setView("list")}>
                        Back to List
                    </Button>
                )}
            </div>

            {view === "list" && (
                <div className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate New Notes</CardTitle>
                            <CardDescription>Enter a topic and let AI create structured notes for you.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <Input
                                placeholder="e.g., Photosynthesis, World War II, Calculus Limits"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                disabled={isGenerating}
                            />
                            <div className="w-[180px]">
                                <Input
                                    type="number"
                                    placeholder="Words (approx)"
                                    value={wordCount}
                                    onChange={(e) => setWordCount(parseInt(e.target.value) || 500)}
                                    min={100}
                                    max={5000}
                                    disabled={isGenerating}
                                    title="Approximate Word Count"
                                />
                            </div>
                            <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Generate
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {savedNotes.length === 0 ? (
                            <div className="col-span-full text-center text-muted-foreground py-12">
                                No notes saved yet. Generate or create one!
                            </div>
                        ) : (
                            savedNotes.map(note => (
                                <Card key={note.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => { setCurrentNote(note); setView("edit"); }}>
                                    <CardHeader>
                                        <CardTitle className="truncate">{note.title}</CardTitle>
                                        <CardDescription>{note.date}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
                                            {note.content}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            )}

            {view === "edit" && currentNote && (
                <Card className="h-[calc(100vh-12rem)] flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                        <Input
                            value={currentNote.title}
                            onChange={(e) => setCurrentNote(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                            className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 w-1/2"
                        />
                        <div className="flex gap-2">
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(currentNote.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" onClick={handleDownloadPDF}>
                                <Download className="mr-2 h-4 w-4" /> PDF
                            </Button>
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" /> Save
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <Textarea
                            value={currentNote.content}
                            onChange={(e) => setCurrentNote(prev => prev ? ({ ...prev, content: e.target.value }) : null)}
                            className="h-full resize-none border-0 rounded-none focus-visible:ring-0 p-6 text-base font-mono leading-relaxed"
                            placeholder="Start typing or generating notes..."
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

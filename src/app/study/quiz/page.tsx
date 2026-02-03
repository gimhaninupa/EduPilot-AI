"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Trophy, RefreshCw, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc, increment, collection, addDoc } from "firebase/firestore"

interface Question {
    id: number
    question: string
    options: string[]
    answer: number // index
}



export default function QuizPage() {
    const [topic, setTopic] = useState("")
    const [numQuestions, setNumQuestions] = useState(5)
    const [difficulty, setDifficulty] = useState("Medium")
    const [isGenerating, setIsGenerating] = useState(false)
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
    const [showResults, setShowResults] = useState(false)

    const handleGenerate = async () => {
        if (!topic.trim()) return
        setIsGenerating(true)
        setQuestions([])
        setShowResults(false)
        setUserAnswers({})
        setCurrentQuestionIndex(0)

        try {
            const response = await fetch("/api/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, amount: numQuestions, difficulty })
            })

            if (!response.ok) throw new Error("Failed to generate quiz")

            const data = await response.json()
            setQuestions(data)
        } catch (error) {
            console.error("Quiz generation failed:", error)
            // Optional: Add toast notification here
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAnswer = (value: string) => {
        const answerIndex = parseInt(value)
        setUserAnswers(prev => ({
            ...prev,
            [questions[currentQuestionIndex].id]: answerIndex
        }))
    }

    // Function to update user stats
    const updateStats = async (currentScore: number) => {
        const user = auth.currentUser
        if (user) {
            try {
                // Logic: 50 XP per correct answer, 10 XP per quiz completion
                const xpGained = (currentScore * 50) + 10

                // 1. Update User Profile Stats
                const userRef = doc(db, "users", user.uid)
                await updateDoc(userRef, {
                    xp: increment(xpGained),
                    quizzesTaken: increment(1),
                    // We can't easily calculate level here without reading, 
                    // but we can trust the Profile page to recalculate level based on XP later?
                    // Or we just update XP and letting the UI derive level.
                })

                // 2. Save Quiz Result
                await addDoc(collection(db, "users", user.uid, "quizzes"), {
                    topic: topic,
                    difficulty: difficulty,
                    score: currentScore,
                    totalQuestions: numQuestions,
                    date: new Date().toISOString(),
                    timestamp: Date.now()
                })

            } catch (error) {
                console.error("Error updating quiz stats:", error)
            }
        }
    }

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            // Calculate final score before showing results
            // Note: userAnswers isn't fully updated yet inside this render cycle for the LAST question if we just clicked.
            // But handleAnswer updates state. Wait, handleNext is called AFTER selecting.
            // Actually, calculateScore iterates userAnswers.
            // We need to ensure the last answer is recorded. It is recorded by handleAnswer before we click Next/Finish.

            setShowResults(true)

            // Calculate score immediately to save stats
            let finalScore = 0
            questions.forEach(q => {
                if (userAnswers[q.id] === q.answer) finalScore++
            })
            updateStats(finalScore)
        }
    }

    const calculateScore = () => {
        let score = 0
        questions.forEach(q => {
            if (userAnswers[q.id] === q.answer) score++
        })
        return score
    }

    const resetQuiz = () => {
        setQuestions([])
        setTopic("")
        setShowResults(false)
        setUserAnswers({})
        setCurrentQuestionIndex(0)
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-8 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Quiz Generator</h1>
                    <p className="text-muted-foreground">Test your knowledge on any subject. Enter a topic below.</p>
                </div>
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Create New Quiz</CardTitle>
                        <CardDescription>Topic details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="topic">Topic</Label>
                            <Input
                                id="topic"
                                placeholder="e.g. Organic Chemistry, React Hooks, World History"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="numQuestions">Number of Questions (1-20)</Label>
                                <Input
                                    id="numQuestions"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Difficulty Level</Label>
                                <RadioGroup defaultValue="Medium" value={difficulty} onValueChange={setDifficulty} className="flex space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Easy" id="r1" />
                                        <Label htmlFor="r1">Easy</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Medium" id="r2" />
                                        <Label htmlFor="r2">Medium</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Hard" id="r3" />
                                        <Label htmlFor="r3">Hard</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleGenerate} disabled={isGenerating || !topic.trim()}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Generate Quiz
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (showResults) {
        const score = calculateScore()
        const percentage = Math.round((score / questions.length) * 100)

        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 max-w-2xl mx-auto">
                <Card className="w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="flex flex-col items-center gap-2">
                            <Trophy className={cn("h-12 w-12", percentage >= 70 ? "text-yellow-500" : "text-muted-foreground")} />
                            Quiz Complete!
                        </CardTitle>
                        <CardDescription>
                            You scored {score} out of {questions.length} ({percentage}%)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="text-sm border-b pb-4 last:border-0">
                                <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                                <div className="space-y-1 pl-4">
                                    <div className={cn("flex items-center gap-2", q.answer === userAnswers[q.id] ? "text-green-600 font-medium" : "text-red-500")}>
                                        {q.answer === userAnswers[q.id] ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        Your Answer: {q.options[userAnswers[q.id]] || "Skipped"}
                                    </div>
                                    {q.answer !== userAnswers[q.id] && (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Correct Answer: {q.options[q.answer]}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={resetQuiz}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Take Another Quiz
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Topic: <span className="font-medium text-foreground">{topic}</span></span>
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                    className="bg-primary h-full transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-xl">
                        {currentQuestion.question}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={userAnswers[currentQuestion.id]?.toString() ?? ""}
                        onValueChange={handleAnswer}
                        className="space-y-3"
                    >
                        {currentQuestion.options.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-normal text-base">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={userAnswers[currentQuestion.id] === undefined}
                    >
                        {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

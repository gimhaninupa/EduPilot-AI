import { model } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { topic, amount, difficulty } = await req.json();

        const prompt = `Generate a ${difficulty} difficulty quiz about "${topic}" with ${amount} questions. 
    Strictly return a valid JSON array of objects. 
    Each object must have:
    - "id": number (1 to ${amount})
    - "question": string
    - "options": array of 4 strings
    - "answer": number (0-3, index of the correct option)

    Example format:
    [
      {
        "id": 1,
        "question": "What is ...?",
        "options": ["A", "B", "C", "D"],
        "answer": 0
      }
    ]
    
    Do NOT include any markdown code blocks or text outside the JSON array.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown formatting if the model adds it
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const quizData = JSON.parse(cleanText);

        return NextResponse.json(quizData);
    } catch (error: any) {
        console.error("Quiz Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
    }
}

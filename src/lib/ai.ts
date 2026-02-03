import { GoogleGenerativeAI } from "@google/generative-ai";

// Securely access your API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  // System instructions steer the model toward its "EduPilot" role
  systemInstruction: `You are EduPilot AI, a professional study assistant. 
    1. Provide clear, step-by-step solutions.
    2. Use Markdown for formatting (bold headers, bullet points).
    3. Use LaTeX for math formulas (e.g., $E = mc^2$).
    4. If the user mentions "quiz", generate a 3-question multiple choice quiz.`
});
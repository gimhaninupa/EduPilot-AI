import { model } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Get the most recent user message from your chat history
    const lastMessage = messages[messages.length - 1].content;

    // Retry logic for 429 errors
    const maxRetries = 3;
    let retryCount = 0;

    while (true) {
      try {
        const result = await model.generateContent(lastMessage);
        const response = await result.response;
        const text = response.text();
        return NextResponse.json({ text });
      } catch (error: any) {
        if (error?.status === 429 && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000 + 1000; // 2s, 4s, 8s...
          console.log(`⚠️ Rate limit hit. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error Full Details:", error);

    // Check for specific error types if possible, or return the message
    const errorMessage = error?.message || "Unknown AI Error";
    return NextResponse.json({ error: `Failed to reach AI: ${errorMessage}` }, { status: 500 });
  }
}
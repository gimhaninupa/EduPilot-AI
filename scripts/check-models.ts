import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Manually parse .env.local to avoid adding dependencies
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), ".env.local");
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, "utf-8");
            content.split("\n").forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^"(.*)"$/, "$1"); // remove quotes
                    process.env[key] = value;
                }
            });
        } else {
            console.log("⚠️ .env.local not found at", envPath);
        }
    } catch (e) {
        console.error("Error loading .env.local", e);
    }
}

loadEnv();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ No API Key found in .env.local");
        return;
    }

    console.log("Checking models with key ending in:", apiKey.slice(-4));

    try {
        // 1. Try listing via API directly
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        console.log("Fetching:", url.replace(apiKey, "HIDDEN_KEY"));

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response:", text);
            return;
        }

        const data = await response.json();
        console.log("\n✅ Available Models:");
        if (data.models) {
            data.models.forEach((m: any) => {
                // Filter for models that support generating content
                if (m.supportedGenerationMethods?.includes("generateContent")) {
                    console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
                }
            });
        } else {
            console.log("No models returned in list.");
            console.log("Full response:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

checkModels();

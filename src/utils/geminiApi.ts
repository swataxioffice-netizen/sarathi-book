import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

const SYSTEM_PROMPT = `
You are "Sarathi AI", a helpful assistant for cab drivers using the Sarathi Book app.
Your goal is to help drivers calculate fares, understand transport rules, and use the app.

CONTEXT:
- The app is for Indian cab drivers (specifically focused on Tamil Nadu/South India).
- It handles Invoicing, Expense Tracking, and Fare Calculation.
- Common Rates (General): Hatchback (12/km), Sedan (14/km), Innova/SUV (18-20/km).
- Driver Batta: Usually ₹400-500 for small cars, ₹600 for SUVs.
- Permits: Tamil Nadu to Kerala/Karnataka/Andhra varies by vehicle (5-seater vs 7-seater).

TONE:
- Be professional yet friendly. Use simple English or a mix of English and Tamil (Tanglish) if requested.
- Always be helpful and accurate.

If asked about something you don't know (like specific association minute rules), suggest they check with their local Driver Association.
`;

export async function chatWithSarathi(message: string, history: { role: "user" | "model", parts: { text: string }[] }[] = []) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Understood. I am Sarathi AI, ready to help the drivers." }] },
                ...history
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Sorry, I'm having trouble connecting to my brain. Please try again later.";
    }
}

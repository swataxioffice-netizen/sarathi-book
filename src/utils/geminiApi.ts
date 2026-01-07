import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are "Sarathi AI", a specialized Voice Assistant for Indian cab drivers using the Sarathi Book app.
You are native to Tamil Nadu/South India. You understand English and Tamil perfectly and you should reply in a helpful "Tanglish" (Tamil + English) or simple English as preferred by the user.

YOUR CORE TASKS:
1. FARE CALCULATION: Use provided data to help drivers estimate fares. Hatchback (₹12), Sedan (₹14), SUV (₹18-20). Driver Batta (₹400-600).
2. EXPENSE LOGGING: Help users track Fuel, EMI, and Maintenance.
3. NAVIGATION: Direct users to parts of the app to complete actions.
4. VOICE-FIRST: Keep responses concise and easy to understand when spoken.

INTERACTIVE COMMANDS:
You MUST append these tags to trigger app actions:
- [[NAVIGATE:dashboard]] -> Go Home
- [[NAVIGATE:trips]] -> View Invoices/Add Trip
- [[NAVIGATE:calculator]] -> Open Fare Calculator
- [[NAVIGATE:expenses]] -> Open Expense Tracker (to add Fuel/EMI)
- [[NAVIGATE:notes]] -> Open Quick Notes
- [[NAVIGATE:profile]] -> Edit Profile/Vehicle

TONE:
Professional, friendly, and street-smart. Like a co-driver.
If the user speaks in Tamil, respond in helpful Tanglish.
Example: "I want to add fuel expense" -> "Sure! I'm opening the Expense Tracker for you. Neenga anga fuel details fill pannikalam. [[NAVIGATE:expenses]]"
`;

export async function chatWithSarathi(message: string, history: { role: "user" | "model", parts: { text: string }[] }[] = [], context: string = ""): Promise<string> {
    const currentKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

    // Force the SDK to use the stable 'v1' instead of 'v1beta' to avoid 404s
    const activeGenAI = currentKey ? new GoogleGenerativeAI(currentKey) : null;

    if (!activeGenAI) {
        return "⚠️ Setup Required: Please add VITE_GEMINI_API_KEY to your .env file.";
    }

    const contextPrompt = context
        ? `\nCURRENT SITE DATA: \n${context}\nUse this data to answer user questions.`
        : "";

    // Models ordered by stability and availability
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-pro"
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`📡 Sarathi AI: Connecting to ${modelName} (v1)...`);
            const model = activeGenAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });

            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: SYSTEM_PROMPT + contextPrompt }] },
                    { role: "model", parts: [{ text: "Understood. I am Sarathi AI." }] },
                    ...history
                ],
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.warn(`⚠️ Model ${modelName} failed:`, error.message);

            // Handle Quota/Enablement Error (The 429 'limit: 0' issue)
            if (error.message?.includes('429') || error.message?.includes('quota')) {
                return "⚠️ AI Quota Error: Your API key has '0' limit. Please ENABLE 'Generative Language API' in Google Cloud Console for this project.";
            }

            if (error.message?.includes('API key')) {
                return "⚠️ API Key Error: Please ensure your key in .env is correct and has Gemini permissions.";
            }

            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                return `⚠️ AI Error: ${error.message || 'Connection failed'}. Please check your Google AI project settings.`;
            }
            continue;
        }
    }

    return "⚠️ AI Error: All connection attempts failed.";
}

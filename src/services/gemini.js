import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(API_KEY);

export async function parseReceiptImage(imageFile) {
    if (!API_KEY) {
        console.error("Gemini API Key is missing!");
        throw new Error("OCR configuration error (API Key missing).");
    }

    try {
        // 1. Convert file to base64
        const base64Data = await fileToGenerativePart(imageFile);

        // 2. Prepare Model with JSON mode
        // Standard model name. If this fails with 404, we try a fallback.
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // 3. Prompt for Receipt Extraction
        const prompt = `
            Extract items from this receipt image. 
            Return a JSON array of objects with exactly these keys: "name", "price", "quantity".
            "price" must be a number (no currency symbols).
            "quantity" must be an integer.
            If quantity is not clearly visible, use 1.
            Exclude tax, service charge, and total.
        `;

        // 4. Call API
        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        // 5. Parse JSON
        try {
            const parsed = JSON.parse(text);
            const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || []);

            // 6. Ensure types are correct for the frontend/DB
            const cleanItems = rawItems.map(item => ({
                name: String(item.name || "Unknown Item"),
                price: Number(item.price) || 0,
                quantity: parseInt(item.quantity) || 1
            }));

            return cleanItems;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw Text:", text);
            // Fallback: try to extract JSON with regex if it somehow failed JSON mode
            const match = text.match(/\[[\s\S]*\]/);
            if (match) return JSON.parse(match[0]);
            throw new Error("AI returned an invalid format. Please try a clearer picture.");
        }

    } catch (error) {
        console.error("OCR Service Error Trace:", error);

        const errorMsg = error.message || "";
        if (errorMsg.includes("400")) {
            throw new Error("Bad Request (400). The image might be too large or in an unsupported format.");
        }
        if (errorMsg.includes("404")) {
            throw new Error("Gemini Model not found (404). Please ensure the Gemini API is enabled in your Google Cloud Project.");
        }
        if (errorMsg.includes("429")) {
            throw new Error("Quota exceeded (429). You are scanning too many receipts too fast! Wait a minute and try again.");
        }
        if (errorMsg.includes("401") || errorMsg.includes("403")) {
            throw new Error("Authentication failed (401/403). Your API Key might be invalid or restricted.");
        }
        if (errorMsg.includes("SAFETY")) {
            throw new Error("The image was blocked by safety filters. (Contains sensitive or restricted content).");
        }

        throw new Error(error.message || "Something went wrong while scanning the receipt.");
    }
}

// Helper: File to Base64/Part
async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

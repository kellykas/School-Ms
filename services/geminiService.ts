
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Note: In a real environment, verify API_KEY exists.
// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY}); as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAnnouncement = async (topic: string, tone: string): Promise<string> => {
  if (!process.env.API_KEY) return "AI Service Unavailable: Missing API Key.";

  try {
    const prompt = `Write a school announcement about "${topic}". The tone should be ${tone}. Keep it concise (under 100 words).`;
    
    // Fix: Update model to 'gemini-3-flash-preview' for basic text tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Failed to generate text.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service.";
  }
};

export const analyzeStudentPerformance = async (studentName: string, grades: string): Promise<string> => {
  if (!process.env.API_KEY) return "AI Service Unavailable: Missing API Key.";

  try {
    const prompt = `
      Analyze the performance for student ${studentName} based on these grades: ${grades}.
      Provide a constructive summary for the parent (max 3 sentences).
      Highlight strengths and areas for improvement.
    `;
    
    // Fix: Update model to 'gemini-3-flash-preview' for complex reasoning/analysis as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing performance.";
  }
};

import { GoogleGenAI } from "@google/genai";

// Lazy-initialization helper to prevent crashes if process.env is wonky at load time
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateAnnouncement = async (topic: string, tone: string): Promise<string> => {
  const ai = getAIInstance();
  if (!ai) return "AI Service Unavailable: Missing API Key.";

  try {
    const prompt = `Write a school announcement about "${topic}". The tone should be ${tone}. Keep it concise (under 100 words).`;
    
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
  const ai = getAIInstance();
  if (!ai) return "AI Service Unavailable: Missing API Key.";

  try {
    const prompt = `
      Analyze the performance for student ${studentName} based on these grades: ${grades}.
      Provide a constructive summary for the parent (max 3 sentences).
      Highlight strengths and areas for improvement.
    `;
    
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
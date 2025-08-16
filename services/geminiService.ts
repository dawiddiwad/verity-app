
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ResumeData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    candidateName: {
      type: Type.STRING,
      description: "The full name of the candidate as extracted from the resume. If no name can be reasonably identified, return the original file name."
    },
    matchScore: {
      type: Type.INTEGER,
      description: "A score from 0-100 representing the resume's match to the job description based on skills, experience, and keywords."
    },
    summary: {
      type: Type.STRING,
      description: "A concise, professional summary (2-3 sentences) of the resume's fit for the role."
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of the top 3-5 key strengths from the resume that directly match the job description's most important requirements."
    },
    areasForImprovement: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 concrete areas where the resume could be improved to better align with the job description (e.g., missing skills, unclear accomplishments)."
    },
    keywordAnalysis: {
      type: Type.OBJECT,
      properties: {
        matchingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of important keywords and skills from the job description that are also present in the resume."
        },
        missingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of crucial keywords and skills from the job description that are absent from the resume."
        },
      },
      required: ["matchingKeywords", "missingKeywords"]
    }
  },
  required: ['candidateName', 'matchScore', 'summary', 'strengths', 'areasForImprovement', 'keywordAnalysis']
};

export const analyzeResume = async (resumeData: ResumeData, jobDesc: string): Promise<AnalysisResult> => {
  try {
    const instructionPrompt = `
You are an expert career coach and professional resume writer. Your task is to analyze a resume against a given job description and provide a structured, actionable critique.
The resume is provided in the next part, either as text or as an image. The job description is also provided below.
Analyze the resume and compare it against the job description.

CRITICAL INSTRUCTIONS:
1. First, identify and extract the candidate's full name from the resume. The name should be formatted nicely (e.g., "John Doe"). If you cannot identify a name, use the resume's filename, which is: '${resumeData.fileName}'.
2. Your entire response MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any text, explanations, or markdown formatting outside of the JSON object.
3. If the resume is an image, perform OCR and analyze the extracted text content.

JOB DESCRIPTION:
---
${jobDesc}
---

Now, generate the JSON output based on your analysis of the provided resume.
`;

    const promptPart = { text: instructionPrompt };
    let resumeContentPart;

    if (resumeData.image) {
      resumeContentPart = {
        inlineData: {
          mimeType: resumeData.image.mimeType,
          data: resumeData.image.base64,
        },
      };
    } else if (resumeData.text) {
      resumeContentPart = { text: `\n\nRESUME TEXT:\n---\n${resumeData.text}\n---` };
    } else {
        throw new Error("No resume content (text or image) was provided.");
    }

    const contents = {
        parts: [promptPart, resumeContentPart]
    };


    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0,
        }
    });
    
    const jsonText = response.text.trim();
    // In strict mode, Gemini often wraps the JSON in ```json ... ```
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const result: AnalysisResult = JSON.parse(cleanedJsonText);
    
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get analysis from AI: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
};
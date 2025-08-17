import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ResumeData } from '../types';

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
    gaps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 concrete areas where the resume is lacking compared to the job description (e.g., missing skills, unclear accomplishments)."
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
  required: ['candidateName', 'matchScore', 'summary', 'strengths', 'gaps', 'keywordAnalysis']
};

export const analyzeResume = async (resumeData: ResumeData, jobDesc: string, apiKey: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("API key is not provided.");
  }
  const ai = new GoogleGenAI({ apiKey });

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
        // Propagate specific error messages for better handling upstream
        if (error.message.includes('API key not valid')) {
            throw new Error('API key not valid. Please check your key.');
        }
        throw new Error(`Failed to get analysis from AI: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
};


const jobParsingSchema = {
  type: Type.OBJECT,
  properties: {
    jobTitle: { 
      type: Type.STRING, 
      description: 'The extracted job title. Should be concise and accurate.' 
    },
    jobDescription: { 
      type: Type.STRING, 
      description: 'The full, clean, and well-formatted job description text, including responsibilities, qualifications, etc. Use newline characters for paragraphs.' 
    }
  },
  required: ['jobTitle', 'jobDescription']
};

export const parseJobDescriptionFromUrl = async (url: string, apiKey: string): Promise<{ jobTitle: string; jobDescription: string }> => {
  if (!apiKey) {
    throw new Error("API key is not provided.");
  }
  
  let htmlText;
  try {
    // Public CORS proxies can be unreliable. Switching to a different one to improve stability.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL via proxy with status: ${response.status} ${response.statusText}`);
    }
    
    htmlText = await response.text();
    
    if (!htmlText) {
        throw new Error('Could not retrieve valid HTML content from the URL.');
    }

  } catch (error) {
    console.error("Error fetching URL via proxy:", error);
    throw new Error("Could not fetch content from the URL. The site may be blocking automated requests, or the URL may be invalid. Please try a different URL or paste the description manually.");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  
  // A more generic approach to capture all text. Instead of trying to manually remove
  // elements like headers or footers (which can be error-prone on complex sites),
  // we now extract all visible text from the page body.
  // We then rely on Gemini's powerful parsing capabilities to sift through the noise
  // and find the actual job description. `innerText` is used over `textContent`
  // because it better preserves layout and formatting (like paragraphs), which provides
  // crucial context for the AI.
  const cleanText = (doc.body as HTMLElement).innerText.trim();

  if (!cleanText) {
    throw new Error("Could not extract any text content from the provided URL.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const instructionPrompt = `
You are an AI assistant specializing in parsing job postings. Your task is to meticulously extract the job title and the complete job description from the raw text of a webpage provided below.

Please follow these guidelines:
1.  **Identify Job Title**: Extract the most accurate and specific job title.
2.  **Extract Full Description**: Capture the entire body of the job description. This includes all relevant details like responsibilities, qualifications, preferred skills, benefits, and company information. Be thorough and do not omit sections.
3.  **Clean and Format**: The final description should be cleaned of any remaining irrelevant text (like navigation links or footer text that might have been missed) and formatted for readability with appropriate paragraph breaks (using '\\n').
4.  **JSON Output**: Your response must be a single, valid JSON object that strictly adheres to the provided schema. Do not add any commentary before or after the JSON.

RAW WEBPAGE TEXT (first 200,000 characters):
---
${cleanText.substring(0, 200000)} 
---

Generate the JSON output.
`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: instructionPrompt }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: jobParsingSchema,
            temperature: 0,
        }
    });

    const jsonText = response.text.trim();
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const result: { jobTitle: string; jobDescription: string } = JSON.parse(cleanedJsonText);
    
    return result;

  } catch (error) {
    console.error("Error calling Gemini API for job parsing:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error('API key not valid. Please check your key.');
    }
    throw new Error(`AI failed to parse the job description: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

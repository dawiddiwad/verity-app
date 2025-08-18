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
You are a highly experienced recruiting manager with extensive expertise in talent acquisition and candidate evaluation. Your task is to analyze a candidate's resume in relation to a specific job description and provide a structured, actionable evaluation.

**Instructions:**
- Carefully review the resume (provided as text or image) and the job description (provided below).
- Your response must be a single, valid JSON object that strictly conforms to the provided schema. Do not include any text, commentary, or formatting outside of the JSON object.
- If the resume is an image, perform OCR to extract and analyze the text.
- Extract the candidate's full name from the resume. Format the name professionally (e.g., "Jane Smith"). If a name cannot be confidently identified, use the resume's filename: '${resumeData.fileName}'.
- Ensure your analysis is objective, concise, and directly references the job requirements. Be mindfull about any restrictions on the job, such as location, hours, etc.
- Populate all required fields in the schema. If information is missing, use reasonable defaults or leave the field empty, but do not omit required fields.

**Job Description:**
---
${jobDesc}
---

Generate your response as a single JSON object that strictly matches the schema, with no extra text or formatting.
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
You are an expert AI assistant for extracting structured job information from unstructured web page text. Your task is to accurately identify and extract the job title and the full job requirements from the provided raw webpage text.

**Instructions:**
- **Job Title**: Find and extract the most precise and relevant job title for the position being advertised. Avoid generic or company-wide titles.
- **Job Description**: Extract only the requirements for the candidate and the job itself. This includes all sections that describe what is required from the candidate, such as responsibilities, required and preferred skills, qualifications, experience, education, and technical or soft skills. If there are any restrictions on the job, such as location, hours, or other restrictions, include them in the job description.  
  - **Exclude**: Do NOT include any sections or content about benefits, compensation, what the company offers, perks, company culture, about the company, or any information not directly related to what is required from the candidate.
  - If the requirements are spread across multiple sections (e.g., "Responsibilities", "Requirements", "Qualifications", "Skills"), combine them into a single, clean, readable text.
- **Noise Removal**: Exclude any irrelevant content such as navigation menus, footers, headers, copyright notices, unrelated links, and any non-requirement sections.
- **Formatting**: Present the job description as clean, readable text. Use '\\n' for paragraph breaks to preserve structure and readability.
- **Output Format**: Return only a single, valid JSON object that matches the schema. Do not include any explanations, comments, or text outside the JSON object.

Below is the raw webpage text (first 200,000 characters):

---
${cleanText.substring(0, 200000)}
---

Extract and return the JSON object as specified above.
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

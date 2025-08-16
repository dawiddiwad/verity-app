export interface Job {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
}

export interface ResumeData {
  fileName: string;
  text: string | null;
  image: {
    base64: string;
    mimeType: string;
  } | null;
  fileBlob: Uint8Array;
  fileMimeType: string;
}

export interface KeywordAnalysis {
  matchingKeywords: string[];
  missingKeywords: string[];
}

export interface AnalysisResult {
  candidateName: string;
  matchScore: number;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  keywordAnalysis: KeywordAnalysis;
}

export type AnalysisResultWithError = AnalysisResult | { error: string };

export interface StoredAnalysis {
  id: number;
  jobId: number;
  jobTitle: string;
  fileName: string;
  resumeHash: string;
  jobDescHash: string;
  jobDescription: string;
  resumeData: ResumeData;
  analysis: AnalysisResultWithError;
  createdAt: Date;
}
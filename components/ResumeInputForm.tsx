import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LoaderIcon, SparklesIcon, ArrowDownTrayIcon, DocumentTextIcon, XMarkIcon, PhotoIcon, BriefcaseIcon, TrashIcon, ChevronDownIcon, CheckIcon, PencilIcon } from './Icons';
import { ResumeData, Job } from '../types';
import { parseJobDescriptionFromUrl } from '../services/geminiService';


interface ResumeInputFormProps {
  jobs: Job[];
  selectedJobId: number | null;
  onJobSelectionChange: (selection: 'new' | number) => void;
  isCreatingJob: boolean;
  isJobEditing: boolean;
  setIsJobEditing: (isEditing: boolean) => void;
  hasJobChanged: boolean;
  jobTitle: string;
  jobDescription: string;
  setJobTitle: (title: string) => void;
  setJobDescription: (description: string) => void;
  onSaveNewJob: (title: string, description: string) => Promise<Job | null>;
  onUpdateJob: (id: number, title: string, description: string) => Promise<void>;
  onCancelEdit: () => void;
  onDeleteJob: (id: number) => void;
  resumeFiles: ResumeData[];
  setResumeFiles: (data: ResumeData[]) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  isAnalyzing: boolean;
  analysisProgress: string | null;
  setError: (message: string | null) => void;
  apiKey: string | null;
  isApiKeyModalOpen: boolean;
  onRequestApiKey: () => void;
  hasAnalysesForJob: boolean;
  warning: string | null;
}

const ResumeInputForm: React.FC<ResumeInputFormProps> = ({
  jobs,
  selectedJobId,
  onJobSelectionChange,
  isCreatingJob,
  isJobEditing,
  setIsJobEditing,
  hasJobChanged,
  jobTitle,
  jobDescription,
  setJobTitle,
  setJobDescription,
  onSaveNewJob,
  onUpdateJob,
  onCancelEdit,
  onDeleteJob,
  resumeFiles,
  setResumeFiles,
  onAnalyze,
  isLoading,
  isAnalyzing,
  analysisProgress,
  setError,
  apiKey,
  isApiKeyModalOpen,
  onRequestApiKey,
  hasAnalysesForJob,
  warning,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [jobUrl, setJobUrl] = useState('');
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [isUrlParsingPending, setIsUrlParsingPending] = useState(false);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const jobDropdownRef = useRef<HTMLDivElement>(null);

  const isJobEditable = isCreatingJob || isJobEditing;
  const isJobSelected = !!selectedJobId && !isCreatingJob;
  const hasResumes = resumeFiles.length > 0;
  
  const showReanalyzeWarning = warning && warning.includes("re-analyzing");

  let currentStep: number;
  if (showReanalyzeWarning && !isJobEditing && hasAnalysesForJob) {
    currentStep = 3;
  } else if (isCreatingJob || isJobEditing) {
    currentStep = 1;
  } else if (isJobSelected) {
    if (hasResumes) {
      currentStep = 3; // Job selected, resumes are present, ready to analyze.
    } else {
      // No resumes uploaded.
      if (hasAnalysesForJob) {
        currentStep = 4; // Job has history, and no new resumes are staged. All done.
      } else {
        currentStep = 2; // Job is selected, no history, ready for resumes.
      }
    }
  } else {
    // Initial state: no job selected, not creating one.
    currentStep = 1;
  }
  
  const steps = [
      { id: 1, name: 'Select or Create Job' },
      { id: 2, name: 'Upload Resumes' },
      { id: 3, name: 'Analyze Resumes' },
  ];
  
  const anyLoading = isLoading || isProcessingFile || isSavingJob || isParsingUrl;
  const showOverlay = isParsingUrl || isProcessingFile || isAnalyzing;

  let overlayTitle = '';
  let overlayMessage = '';
  if (isParsingUrl) {
      overlayTitle = 'Loading Job Details...';
      overlayMessage = 'Fetching content from URL.';
  } else if (isProcessingFile) {
      overlayTitle = 'Processing Files...';
      overlayMessage = 'Extracting text and preparing resumes.';
  } else if (isAnalyzing) {
      overlayTitle = 'Analyzing Resumes...';
      overlayMessage = analysisProgress || 'This may take a few moments.';
  }
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target as Node)) {
        setIsJobDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveJob = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
        setError("Job title and description cannot be empty.");
        return;
    }
    setIsSavingJob(true);
    setError(null);
    try {
        await onSaveNewJob(jobTitle, jobDescription);
    } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save job.");
    } finally {
        setIsSavingJob(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!selectedJobId || !jobTitle.trim() || !jobDescription.trim()) {
        setError("Job title and description cannot be empty.");
        return;
    }
    setIsSavingJob(true);
    setError(null);
    try {
        await onUpdateJob(selectedJobId, jobTitle, jobDescription);
    } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update job.");
    } finally {
        setIsSavingJob(false);
    }
  };
  
  const performUrlParse = useCallback(async () => {
    if (!jobUrl.trim() || !apiKey) {
      return;
    }

    setIsParsingUrl(true);
    setError(null);
    try {
      const { jobTitle: parsedTitle, jobDescription: parsedDescription } = await parseJobDescriptionFromUrl(jobUrl, apiKey);
      setJobTitle(parsedTitle);
      setJobDescription(parsedDescription);
      setJobUrl('');
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred while parsing the URL.");
    } finally {
      setIsParsingUrl(false);
    }
  }, [apiKey, jobUrl, setError, setJobTitle, setJobDescription]);

  const handleParseUrl = () => {
    if (!jobUrl.trim()) {
      setError("Please enter a URL to parse.");
      return;
    }
    if (!apiKey) {
      setIsUrlParsingPending(true);
      onRequestApiKey();
      return;
    }
    performUrlParse();
  };
  
  useEffect(() => {
    // Automatically parse if an API key was requested and is now available
    if (isUrlParsingPending && apiKey) {
      setIsUrlParsingPending(false);
      performUrlParse();
    }
  }, [isUrlParsingPending, apiKey, performUrlParse]);

  useEffect(() => {
    // If the modal is closed and a parse was pending, but we still don't have a key,
    // it means the user cancelled. Reset the pending state.
    if (!isApiKeyModalOpen && isUrlParsingPending && !apiKey) {
      setIsUrlParsingPending(false);
    }
  }, [isApiKeyModalOpen, isUrlParsingPending, apiKey]);


  const processFile = useCallback(async (file: File): Promise<ResumeData | null> => {
    if (!file) return null;

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = {
        text: ['.txt', '.md'],
        pdf: ['.pdf'],
        docx: ['.docx'],
        image: ['.png', '.jpg', '.jpeg']
    };
    const allAllowed = Object.values(allowed).flat();

    if (!allAllowed.includes(fileExtension)) {
      setError(`Invalid file type for ${file.name}. Please upload PDF, DOCX, PNG, JPG, TXT, or MD files.`);
      return null;
    }
    
    let newResumeData: ResumeData | null = null;
    try {
        const fileArrayBuffer = await file.arrayBuffer();
        const fileBlob = new Uint8Array(fileArrayBuffer);
        const fileMimeType = file.type || 'application/octet-stream';

        if (allowed.text.includes(fileExtension)) {
            const text = await file.text();
            newResumeData = { fileName: file.name, text, image: null, fileBlob, fileMimeType };
        } else if (allowed.pdf.includes(fileExtension)) {
            const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
            pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

            const pdf = await pdfjs.getDocument(fileArrayBuffer.slice(0)).promise;
            let textContent = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                textContent += content.items.map((item: any) => item.str).join(' ');
            }
            newResumeData = { fileName: file.name, text: textContent, image: null, fileBlob, fileMimeType };

        } else if (allowed.docx.includes(fileExtension)) {
            const mammoth = await import('mammoth');
            const { value } = await mammoth.extractRawText({ arrayBuffer: fileArrayBuffer.slice(0) });
            newResumeData = { fileName: file.name, text: value, image: null, fileBlob, fileMimeType };

        } else if (allowed.image.includes(fileExtension)) {
            const reader = new FileReader();
            await new Promise<void>((resolve, reject) => {
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    newResumeData = { fileName: file.name, text: null, image: { base64: base64String, mimeType: file.type }, fileBlob, fileMimeType };
                    resolve();
                };
                reader.onerror = () => reject(new Error("Could not read image file."));
                reader.readAsDataURL(file);
            });
        }
    } catch (e) {
        console.error("Error processing file:", e);
        setError(`Failed to read file ${file.name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        return null;
    }

    return newResumeData;
  }, [setError]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingFile(true);
    setError(null);

    const existingFileNames = new Set(resumeFiles.map(rf => rf.fileName));
    const uniqueFilesToProcess: File[] = [];
    const duplicateFileNames: string[] = [];

    for (const file of Array.from(files)) {
      if (existingFileNames.has(file.name)) {
        duplicateFileNames.push(file.name);
      } else {
        uniqueFilesToProcess.push(file);
        existingFileNames.add(file.name); // Add to set to handle duplicates within the same selection
      }
    }

    if (duplicateFileNames.length > 0) {
      setError(`Ignored duplicate files: ${duplicateFileNames.join(', ')}.`);
    }

    if (uniqueFilesToProcess.length === 0) {
      setIsProcessingFile(false);
      return;
    }

    try {
      const processingPromises = uniqueFilesToProcess.map(file => processFile(file));
      const processedResults = await Promise.all(processingPromises);
      const newValidResumes = processedResults.filter((result): result is ResumeData => result !== null);

      if (newValidResumes.length > 0) {
        setResumeFiles([...resumeFiles, ...newValidResumes]);
      }
    } finally {
      setIsProcessingFile(false);
    }
  }, [resumeFiles, processFile, setError, setResumeFiles]);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!anyLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (anyLoading) return;
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setResumeFiles(resumeFiles.filter(f => f.fileName !== fileName));
  };

  const isAnalyzeButtonDisabled = anyLoading || resumeFiles.length === 0 || !selectedJobId || isJobEditing;
  const buttonText = `Analyze ${resumeFiles.length > 1 ? `${resumeFiles.length} Resumes` : 'Resume'}`;

  return (
    <div className="space-y-8 bg-base-200 dark:bg-[#1C1C1E] p-8 rounded-2xl shadow-sm border border-base-300 dark:border-[#2C2C2E]">
        
      <div className="mb-12">
        <div className="flex items-start">
        {steps.map((step, index) => (
            <React.Fragment key={step.id}>
            <div className="flex flex-col items-center text-center w-28">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${
                    step.id < currentStep 
                        ? 'bg-brand-primary border-brand-primary text-white' 
                        : step.id === currentStep 
                        ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
                        : 'border-base-300 dark:border-[#2C2C2E] text-content-200 dark:text-[#8D8D92]'
                }`}>
                {step.id < currentStep ? <CheckIcon className="w-5 h-5" /> : step.id}
                </div>
                <p className={`mt-2 text-xs font-semibold ${
                    step.id <= currentStep ? 'text-content-100 dark:text-white' : 'text-content-200 dark:text-[#8D8D92]'
                }`}>{step.name}</p>
            </div>
            {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mt-5 transition-colors duration-300 ${
                    step.id < currentStep ? 'bg-brand-primary' : 'bg-base-300 dark:bg-[#2C2C2E]'
                }`}></div>
            )}
            </React.Fragment>
        ))}
        </div>
      </div>

      {/* Job Details & Resume Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {showOverlay && (
            <div className="absolute inset-0 bg-base-200/90 dark:bg-[#1C1C1E]/90 backdrop-blur-sm flex flex-col justify-center items-center z-10 rounded-lg animate-fade-in">
                <LoaderIcon className="h-8 w-8 animate-spin text-brand-primary" />
                <p className="mt-4 text-base font-semibold text-content-100 dark:text-white">{overlayTitle}</p>
                <p className="mt-1 text-sm text-content-200 dark:text-[#8D8D92]">{overlayMessage}</p>
            </div>
        )}

        {/* Left Column: Job Management */}
        <div className="flex flex-col space-y-6">
            <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <label htmlFor="job-title-control" className="block text-sm font-medium text-content-200 dark:text-[#8D8D92]">
                        <span className="font-bold text-content-100 dark:text-white">Step 1:</span> {isJobEditable ? 'Enter Job Title' : 'Select or Create Job'}
                    </label>
                    {!isCreatingJob && selectedJobId && !isJobEditing && (
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsJobEditing(true)}
                                disabled={anyLoading}
                                className="p-1.5 rounded-full text-content-200 dark:text-[#8D8D92] hover:text-brand-primary hover:bg-base-300 dark:hover:bg-[#2C2C2E] transition-colors disabled:opacity-50"
                                title="Edit selected job"
                            >
                                <PencilIcon className="h-5 w-5"/>
                            </button>
                             <button 
                                type="button" 
                                onClick={() => onDeleteJob(selectedJobId)}
                                disabled={anyLoading}
                                className="p-1.5 rounded-full text-content-200 dark:text-[#8D8D92] hover:text-danger-text hover:bg-danger-bg/80 transition-colors disabled:opacity-50"
                                title="Delete selected job"
                            >
                                <TrashIcon className="h-5 w-5"/>
                            </button>
                        </div>
                    )}
                </div>
                 <div className="relative" ref={jobDropdownRef}>
                    {isJobEditable ? (
                        <div className="relative w-full">
                            <input
                                type="text"
                                id="job-title-control"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                disabled={anyLoading}
                                placeholder="Job Title (e.g. Senior Frontend Engineer)"
                                className="block w-full rounded-lg border border-base-300 dark:border-[#2C2C2E] bg-base-100 dark:bg-[#121212] py-2.5 pl-4 pr-10 text-content-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm"
                                autoFocus
                            />
                             <button
                                type="button"
                                onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
                                disabled={anyLoading}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 pl-3 text-content-200 dark:text-[#8D8D92] hover:text-content-100 dark:hover:text-white"
                                title="Select a job"
                            >
                                <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isJobDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            id="job-title-control"
                            onClick={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
                            disabled={anyLoading}
                            className="flex items-center justify-between w-full rounded-lg border border-base-300 dark:border-[#2C2C2E] bg-base-100 dark:bg-[#121212] py-2.5 px-4 text-content-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm transition-all text-left"
                        >
                            <span className="truncate pr-2">
                                {jobTitle || '-- Select a Job --'}
                            </span>
                            <ChevronDownIcon className={`h-5 w-5 text-content-200 dark:text-[#8D8D92] transition-transform duration-200 shrink-0 ${isJobDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                    )}
                    {isJobDropdownOpen && (
                        <div className="absolute z-20 mt-1 w-full rounded-md bg-base-200 dark:bg-[#1C1C1E] shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none animate-fade-in" style={{ animationDuration: '0.1s'}}>
                            <ul className="max-h-60 overflow-y-auto py-1">
                                {jobs.map(job => (
                                    <li key={job.id}>
                                        <button
                                            onClick={() => {
                                                onJobSelectionChange(job.id);
                                                setIsJobDropdownOpen(false);
                                            }}
                                            className={`flex items-center w-full px-4 py-2 text-sm text-left truncate ${selectedJobId === job.id ? 'font-semibold text-brand-primary' : 'text-content-100 dark:text-white'} hover:bg-base-300 dark:hover:bg-[#2C2C2E]`}
                                        >
                                            {job.title}
                                        </button>
                                    </li>
                                ))}
                                <li>
                                    <button
                                        onClick={() => {
                                            onJobSelectionChange('new');
                                            setIsJobDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-sm text-left font-semibold text-content-100 dark:text-white hover:bg-base-300 dark:hover:bg-[#2C2C2E]`}
                                    >
                                        [+] Create a New Job
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {isJobEditable && (
                <div className="space-y-2">
                    <label htmlFor="job-url" className="text-xs font-medium text-content-200 dark:text-[#8D8D92]">Load from URL</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="url"
                            id="job-url"
                            value={jobUrl}
                            onChange={(e) => setJobUrl(e.target.value)}
                            disabled={anyLoading}
                            placeholder="https://example.com/job/posting"
                            className="block w-full rounded-lg border border-base-300 dark:border-[#2C2C2E] bg-base-100 dark:bg-[#121212] py-2.5 px-4 text-content-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleParseUrl}
                            disabled={!jobUrl.trim() || anyLoading}
                            className="p-2.5 bg-base-100 dark:bg-[#121212] border border-base-300 dark:border-[#2C2C2E] rounded-lg text-brand-primary hover:bg-base-300 dark:hover:bg-[#2C2C2E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Fetch and Parse Job Description"
                        >
                            {isParsingUrl ? <LoaderIcon className="h-5 w-5 animate-spin"/> : <SparklesIcon className="h-5 w-5"/>}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col flex-1 space-y-6">
                 {isJobEditable && (
                    <p className="text-xs font-medium text-content-200 dark:text-[#8D8D92] -mb-4">
                        or fill details manually
                    </p>
                )}
                <div className="flex flex-col flex-grow">
                  <textarea
                    id="job-description"
                    rows={isCreatingJob || isJobEditing ? 10 : 14}
                    className="block w-full flex-grow rounded-lg border border-base-300 dark:border-[#2C2C2E] bg-base-100 dark:bg-[#121212] py-2.5 px-4 text-content-100 dark:text-white placeholder:text-content-200/70 dark:placeholder:text-[#8D8D92]/70 read-only:bg-base-200 dark:read-only:bg-[#1C1C1E] read-only:text-content-200/70 dark:read-only:text-[#8D8D92]/70 read-only:cursor-default focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm"
                    placeholder={(isCreatingJob || isJobSelected) ? "Paste the job description you are targeting..." : "Select a job to see its description."}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={anyLoading}
                    readOnly={!isJobEditable}
                  />
                </div>
                {isCreatingJob && (
                    <button
                        type="button"
                        onClick={handleSaveJob}
                        disabled={anyLoading || !jobTitle.trim() || !jobDescription.trim()}
                        className="w-full flex justify-center items-center rounded-lg bg-base-300 dark:bg-[#2C2C2E] px-4 py-2.5 text-sm font-semibold text-content-100 dark:text-white shadow-sm hover:bg-base-200 dark:hover:bg-[#1C1C1E] disabled:opacity-50 transition-colors"
                    >
                        {isSavingJob ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Saving...</> : 'Save Job'}
                    </button>
                )}
                {isJobEditing && (
                    <div className="flex items-center gap-2">
                         <button
                            type="button"
                            onClick={onCancelEdit}
                            disabled={anyLoading}
                            className="w-full flex justify-center items-center rounded-lg bg-base-100 dark:bg-[#121212] px-4 py-2.5 text-sm font-semibold text-content-100 dark:text-white shadow-sm hover:bg-base-300 dark:hover:bg-[#2C2C2E] disabled:opacity-50 transition-colors border border-base-300 dark:border-[#2C2C2E]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateJob}
                            disabled={anyLoading || !jobTitle.trim() || !jobDescription.trim() || !hasJobChanged}
                            className="w-full flex justify-center items-center rounded-lg bg-base-300 dark:bg-[#2C2C2E] px-4 py-2.5 text-sm font-semibold text-content-100 dark:text-white shadow-sm hover:bg-base-200 dark:hover:bg-[#1C1C1E] disabled:opacity-50 transition-colors"
                        >
                            {isSavingJob ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Saving...</> : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Resume Upload */}
        <div className="flex flex-col space-y-3">
           <label className="block text-sm font-medium text-content-200 dark:text-[#8D8D92]">
            <span className="font-bold text-content-100 dark:text-white">Step 2:</span> Upload Resumes
          </label>
           <div className="flex-grow flex flex-col" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg,.txt,.md" disabled={anyLoading || isCreatingJob || isJobEditing} multiple />
            {resumeFiles.length === 0 ? (
              <div
                onClick={() => !anyLoading && !isCreatingJob && !isJobEditing && fileInputRef.current?.click()}
                className={`relative flex flex-col flex-grow justify-center items-center w-full rounded-lg border border-dashed border-base-300 dark:border-[#2C2C2E] px-6 text-center transition-colors h-full min-h-[300px] ${
                  isDragging ? 'bg-brand-primary/10 border-brand-primary' : 'bg-base-100 dark:bg-[#121212] hover:border-content-200 dark:hover:border-[#8D8D92]'
                } ${(isCreatingJob || anyLoading || isJobEditing) ? 'cursor-not-allowed bg-base-100/50 dark:bg-[#121212]/50' : 'cursor-pointer'}`}
              >
                <ArrowDownTrayIcon className="mx-auto h-10 w-10 text-content-200 dark:text-[#8D8D92]" />
                <div className="mt-4 flex text-sm leading-6 text-content-200 dark:text-[#8D8D92]">
                    <p className="pl-1">
                        { isJobEditing ? 'Save or cancel changes to upload resumes' : !isCreatingJob && selectedJobId ? <>Drag & drop files or <span className="font-semibold text-brand-primary">browse</span></> : 'Please save or select a job first' }
                    </p>
                </div>
                <p className="text-xs leading-5 text-content-200/70 dark:text-[#8D8D92]/70 mt-1">PDF, DOCX, PNG, JPG, TXT, MD</p>
              </div>
            ) : (
                <div className="flex flex-col flex-grow w-full rounded-lg border border-base-300 dark:border-[#2C2C2E] bg-base-100 dark:bg-[#121212] p-3 h-full min-h-[300px]">
                    <div className="flex-grow space-y-2 overflow-y-auto pr-1">
                        {resumeFiles.map(fileData => (
                            <div key={fileData.fileName} className="flex items-center gap-3 bg-base-200 dark:bg-[#1C1C1E] p-2.5 rounded-lg">
                                {fileData.image ? <PhotoIcon className="h-6 w-6 text-brand-primary flex-shrink-0" /> : <DocumentTextIcon className="h-6 w-6 text-brand-primary flex-shrink-0" />}
                                <div className="flex-grow overflow-hidden">
                                    <p className="text-sm font-medium text-content-100 dark:text-white truncate" title={fileData.fileName}>{fileData.fileName}</p>
                                </div>
                                <button type="button" onClick={() => handleRemoveFile(fileData.fileName)} className="p-1 text-content-200 dark:text-[#8D8D92] hover:text-danger-text rounded-full hover:bg-danger-bg disabled:opacity-50" aria-label={`Remove ${fileData.fileName}`} disabled={anyLoading}>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={() => !anyLoading && !isCreatingJob && !isJobEditing && fileInputRef.current?.click()} disabled={anyLoading || isCreatingJob || isJobEditing} className="mt-3 w-full flex justify-center items-center rounded-lg bg-base-200 dark:bg-[#1C1C1E] px-3 py-2 text-sm font-semibold text-content-100 dark:text-white shadow-sm hover:bg-base-300 dark:hover:bg-[#2C2C2E] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        Add More Files
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzeButtonDisabled}
          className="w-full flex justify-center items-center rounded-lg bg-brand-primary px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ResumeInputForm;
import React, { useState, useRef, useCallback } from 'react';
import { LoaderIcon, SparklesIcon, ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon, PhotoIcon, BriefcaseIcon, TrashIcon, ChevronDownIcon } from './Icons';
import { ResumeData, Job } from '../types';

interface ResumeInputFormProps {
  jobs: Job[];
  selectedJobId: number | null;
  onJobSelectionChange: (selection: 'new' | number) => void;
  isCreatingJob: boolean;
  jobTitle: string;
  jobDescription: string;
  setJobTitle: (title: string) => void;
  setJobDescription: (description: string) => void;
  onSaveNewJob: (title: string, description: string) => Promise<Job>;
  onDeleteJob: (id: number) => void;
  resumeFiles: ResumeData[];
  setResumeFiles: (data: ResumeData[]) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  setError: (message: string | null) => void;
}

const ResumeInputForm: React.FC<ResumeInputFormProps> = ({
  jobs,
  selectedJobId,
  onJobSelectionChange,
  isCreatingJob,
  jobTitle,
  jobDescription,
  setJobTitle,
  setJobDescription,
  onSaveNewJob,
  onDeleteJob,
  resumeFiles,
  setResumeFiles,
  onAnalyze,
  isLoading,
  setError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingJob, setIsSavingJob] = useState(false);

  const handleJobSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      onJobSelectionChange('new');
    } else {
      onJobSelectionChange(Number(value));
    }
  };

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
    if (!isLoading && !isProcessingFile) setIsDragging(true);
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
    if (isLoading || isProcessingFile) return;
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

  const isAnalyzeButtonDisabled = isLoading || isProcessingFile || resumeFiles.length === 0 || !selectedJobId;
  const buttonText = `Analyze ${resumeFiles.length > 1 ? `${resumeFiles.length} Resumes` : 'Resume'}`;
  const anyLoading = isLoading || isProcessingFile || isSavingJob;

  return (
    <div className="space-y-6 bg-base-200 p-6 rounded-lg shadow-lg">
        {/* Job Management Section */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-content-100 flex items-center gap-2">
                <BriefcaseIcon className="h-6 w-6 text-brand-secondary"/>
                1. Select or Create a Job
            </h3>
            <div className="flex items-center gap-2">
                <div className="relative w-full">
                    <select
                        id="job-selection"
                        value={isCreatingJob ? 'new' : selectedJobId ?? ''}
                        onChange={handleJobSelectionChange}
                        disabled={anyLoading}
                        className="appearance-none block w-full rounded-md border-0 bg-base-100 py-2 pl-3 pr-10 text-content-100 shadow-sm ring-1 ring-inset ring-base-300 placeholder:text-content-200/50 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 transition-all"
                    >
                        <option value="" disabled>-- Select a Job --</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                        <option value="new" className="font-bold text-brand-primary">[+] Create a New Job</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-200">
                        <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                    </div>
                </div>
                {!isCreatingJob && selectedJobId && (
                    <button 
                        type="button" 
                        onClick={() => onDeleteJob(selectedJobId)}
                        disabled={anyLoading}
                        className="p-2 text-content-200 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                        title="Delete selected job"
                    >
                        <TrashIcon className="h-5 w-5"/>
                    </button>
                )}
            </div>
        </div>

      {/* Job Details & Resume Upload Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col flex-1 space-y-4">
            <div>
              <label htmlFor="job-title" className="block text-sm font-medium text-content-200 mb-2">
                Job Title
              </label>
              <input
                type="text"
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                readOnly={!isCreatingJob}
                disabled={anyLoading}
                placeholder={isCreatingJob ? "e.g. Senior Frontend Engineer" : ""}
                className="block w-full rounded-md border-0 bg-base-100 py-2 px-3 text-content-100 shadow-sm ring-1 ring-inset ring-base-300 read-only:bg-base-300/30 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm"
              />
            </div>
            <div className="flex flex-col flex-grow">
              <label htmlFor="job-description" className="block text-sm font-medium text-content-200 mb-2">
                Job Description
              </label>
              <textarea
                id="job-description"
                rows={10}
                className="block w-full flex-grow rounded-md border-0 bg-base-100 py-2 px-3 text-content-100 shadow-sm ring-1 ring-inset ring-base-300 placeholder:text-content-200/50 read-only:bg-base-300/30 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 transition-all"
                placeholder={isCreatingJob ? "Paste the job description you are targeting..." : "Select a job to see its description."}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                readOnly={!isCreatingJob}
                disabled={anyLoading}
              />
            </div>
            {isCreatingJob && (
                <button
                    type="button"
                    onClick={handleSaveJob}
                    disabled={isSavingJob || !jobTitle.trim() || !jobDescription.trim()}
                    className="w-full flex justify-center items-center rounded-md bg-brand-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                    {isSavingJob ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Saving Job...</> : 'Save Job'}
                </button>
            )}
        </div>

        <div className="flex flex-col flex-1">
          <label className="block text-sm font-medium text-content-200 mb-2">
            Upload Resume(s) for "{isCreatingJob ? 'New Job' : jobTitle || 'No Job Selected'}"
          </label>
           <div className="flex-grow flex flex-col" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg,.txt,.md" disabled={anyLoading || isCreatingJob} multiple />
            {resumeFiles.length === 0 ? (
              <div
                onClick={() => !anyLoading && !isCreatingJob && fileInputRef.current?.click()}
                className={`relative flex flex-col flex-grow justify-center items-center w-full rounded-md border-2 border-dashed border-base-300 px-6 text-center transition-colors h-full min-h-[300px] ${
                  isDragging ? 'bg-brand-primary/10 border-brand-primary' : 'hover:border-content-200'
                } ${(isCreatingJob || anyLoading) ? 'cursor-not-allowed bg-base-100/50' : 'cursor-pointer'}`}
              >
                {isProcessingFile ? (
                    <div className="absolute inset-0 bg-base-200/80 flex flex-col justify-center items-center z-10 rounded-md">
                        <LoaderIcon className="h-10 w-10 animate-spin text-brand-primary" />
                        <p className="mt-3 text-sm font-semibold">Processing files...</p>
                    </div>
                ) : (
                    <>
                        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-content-200" />
                        <div className="mt-4 flex text-sm leading-6 text-content-200">
                            <p className="pl-1">
                                { !isCreatingJob ? <>Drag & drop or <span className="font-semibold text-brand-primary">browse</span></> : 'Please save the job first' }
                            </p>
                        </div>
                        <p className="text-xs leading-5 text-content-200/70">PDF, DOCX, PNG, JPG, TXT, MD</p>
                    </>
                )}
              </div>
            ) : (
                <div className="flex flex-col flex-grow w-full rounded-md border border-base-300 bg-base-100 p-3 h-full min-h-[300px]">
                    <div className="flex-grow space-y-2 overflow-y-auto pr-1">
                        {resumeFiles.map(fileData => (
                            <div key={fileData.fileName} className="flex items-center gap-3 bg-base-200 p-2 rounded-md">
                                {fileData.image ? <PhotoIcon className="h-7 w-7 text-brand-primary flex-shrink-0" /> : <DocumentTextIcon className="h-7 w-7 text-brand-primary flex-shrink-0" />}
                                <div className="flex-grow overflow-hidden">
                                    <p className="text-sm font-medium text-content-100 truncate" title={fileData.fileName}>{fileData.fileName}</p>
                                </div>
                                <button type="button" onClick={() => handleRemoveFile(fileData.fileName)} className="p-1.5 text-content-200 hover:text-white rounded-full hover:bg-red-500/50 disabled:opacity-50" aria-label={`Remove ${fileData.fileName}`} disabled={anyLoading}>
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={() => !anyLoading && !isCreatingJob && fileInputRef.current?.click()} disabled={anyLoading || isCreatingJob} className="mt-3 w-full flex justify-center items-center rounded-md bg-base-300 px-3 py-2 text-sm font-semibold text-content-100 shadow-sm hover:bg-base-200/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
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
          className="w-full flex justify-center items-center rounded-md bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (<><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />Analyzing...</>) 
            : isProcessingFile ? (<><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />Processing...</>) 
            : (<><SparklesIcon className="-ml-1 mr-2 h-5 w-5" />{buttonText}</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResumeInputForm;
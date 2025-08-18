
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StoredAnalysis, ResumeData, AnalysisResultWithError, Job } from './types';
import { analyzeResume } from './services/geminiService';
import * as dbService from './services/dbService';
import Header from './components/Header';
import ResumeInputForm from './components/ResumeInputForm';
import AnalysisDisplay from './components/AnalysisDisplay';
import ErrorMessage from './components/ErrorMessage';
import AnalysisSummaryTable from './components/AnalysisSummaryTable';
import DatabaseSetup from './components/DatabaseSetup';
import ApiKeyModal from './components/ApiKeyModal';
import { LoaderIcon } from './components/Icons';

type DbState = 'uninitialized' | 'initializing' | 'needs-choice' | 'ready';
export type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [resumeFiles, setResumeFiles] = useState<ResumeData[]>([]);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');

  const [analysisResults, setAnalysisResults] = useState<StoredAnalysis[]>([]);
  const [selectedResult, setSelectedResult] = useState<StoredAnalysis | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dbState, setDbState] = useState<DbState>('uninitialized');

  const [apiKey, setApiKey] = useState<string | null>(() => sessionStorage.getItem('gemini-api-key'));
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAnalysisPending, setIsAnalysisPending] = useState(false);
  
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);


  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem('gemini-api-key', apiKey);
    } else {
      sessionStorage.removeItem('gemini-api-key');
    }
  }, [apiKey]);
  
  const loadAllData = useCallback(async () => {
    try {
      const [loadedJobs, loadedAnalyses] = await Promise.all([dbService.getAllJobs(), dbService.getAllAnalyses()]);
      setJobs(loadedJobs);
      setAnalysisResults(loadedAnalyses);
      if (loadedJobs.length === 0) {
        setIsCreatingJob(true);
        setSelectedJobId(null);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load stored data from the database.');
    }
  }, []);

  useEffect(() => {
    const initializeDatabase = async () => {
      setDbState('initializing');
      try {
        const { dbExists } = await dbService.initDB();
        if (dbExists) {
          await loadAllData();
          setDbState('ready');
        } else {
          setDbState('needs-choice');
        }
      } catch (err) {
        console.error("DB Init Error:", err);
        setError("Could not initialize the application database. It may not be supported in your browser.");
      }
    };
    initializeDatabase();
  }, [loadAllData]);


  useEffect(() => {
    const selectedJobExists = jobs.some(j => j.id === selectedJobId);

    if (jobs.length === 0) {
      setIsCreatingJob(true);
      setSelectedJobId(null);
    } else if (!selectedJobExists && !isCreatingJob) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId, isCreatingJob]);

  useEffect(() => {
    if (isCreatingJob) {
      setJobTitle('');
      setJobDescriptionText('');
      setSelectedResult(null);
    } else {
      const selectedJob = jobs.find(j => j.id === selectedJobId);
      if (selectedJob) {
        setJobTitle(selectedJob.title);
        setJobDescriptionText(selectedJob.description);
        setSelectedResult(null);
      }
    }
  }, [selectedJobId, jobs, isCreatingJob]);

  const handleAnalysis = useCallback(async () => {
    const selectedJob = jobs.find(j => j.id === selectedJobId);
    if (resumeFiles.length === 0 || !selectedJob || !apiKey) {
      setError('Please select a job, provide a resume, and set your API key.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSelectedResult(null);

    try {
      const jobDescHash = await dbService.createHash(selectedJob.description);
      const existingResumeHashes = await dbService.getAnalysisHashesForJob(selectedJob.id);
      const existingHashes = new Set(existingResumeHashes);

      for (let i = 0; i < resumeFiles.length; i++) {
        const file = resumeFiles[i];
        setAnalysisProgress(`Processing ${i + 1} of ${resumeFiles.length}: ${file.fileName}`);
        
        const resumeContent = file.text || file.image?.base64 || '';
        if (!resumeContent) continue;

        const resumeHash = await dbService.createHash(resumeContent);
        if (existingHashes.has(resumeHash)) {
          console.log(`Skipping duplicate resume '${file.fileName}' for this job.`);
          continue;
        }
        
        setAnalysisProgress(`Analyzing ${i + 1} of ${resumeFiles.length}: ${file.fileName}`);
        let analysis: AnalysisResultWithError;
        try {
            analysis = await analyzeResume(file, selectedJob.description, apiKey);
        } catch(e) {
            const message = e instanceof Error ? e.message : 'Unknown analysis error';
            if (message.toLowerCase().includes('api key not valid')) {
                setError("Your API key is invalid. Please provide a valid key to continue.");
                setApiKey(null);
                setIsApiKeyModalOpen(true);
                setIsLoading(false);
                setAnalysisProgress(null);
                return; // Stop the entire analysis process
            }
            analysis = { error: message };
        }
        
        await dbService.addAnalysis({
            jobId: selectedJob.id,
            jobTitle: selectedJob.title,
            fileName: file.fileName,
            resumeData: file,
            jobDescription: selectedJob.description,
            resumeHash,
            jobDescHash,
            analysis
        });
      }

      await loadAllData(); 

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    } finally {
      setIsLoading(false);
      setAnalysisProgress(null);
      setResumeFiles([]);
    }
  }, [resumeFiles, selectedJobId, jobs, loadAllData, apiKey]);

  const triggerAnalysis = () => {
    if (!apiKey) {
      setIsAnalysisPending(true);
      setIsApiKeyModalOpen(true);
    } else {
      handleAnalysis();
    }
  };

  useEffect(() => {
    if (isAnalysisPending && apiKey) {
      setIsAnalysisPending(false);
      handleAnalysis();
    }
  }, [isAnalysisPending, apiKey, handleAnalysis]);
  
  const handleSaveApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const handleSetResumes = (files: ResumeData[]) => {
    setResumeFiles(files);
  };
  
  const handleViewDetails = (result: StoredAnalysis) => {
    setSelectedResult(result);
  };

  const handleDeleteResult = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await dbService.deleteAnalysis(id);
        await loadAllData();
      } catch (err) {
        setError('Failed to delete the analysis result.');
      }
    }
  };
  
  const handleDeleteAllResultsForJob = async () => {
    if (!selectedJobId) return;
    if (window.confirm(`Are you sure you want to delete ALL analysis results for "${jobTitle}"? This action cannot be undone.`)) {
      try {
        await dbService.clearAllAnalyses(selectedJobId);
        await loadAllData();
        setSelectedResult(null);
      } catch (err) {
        setError('Failed to clear analysis results for this job.');
      }
    }
  };

  const handleExportDatabase = async () => {
    setError(null);
    try {
      await dbService.exportDBFile();
    } catch (err) {
      setError("Failed to export database.");
      console.error(err);
    }
  };

  const handleImportDatabase = async (dbFile: File) => {
    setError(null);
    setIsImporting(true);
    try {
      await dbService.importDBFile(dbFile);
      await loadAllData();
      setDbState('ready'); // Mark DB as ready after successful import
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during import.");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleCreateNewDatabase = async () => {
    setError(null);
    try {
        await dbService.createNewDB();
        await loadAllData();
        setDbState('ready');
    } catch (err) {
        setError("Failed to create a new database.");
        console.error(err);
    }
  }

  const handleSaveNewJob = async (newTitle: string, newDescription: string): Promise<Job> => {
      const newJob = await dbService.addJob(newTitle, newDescription);
      await loadAllData();
      setIsCreatingJob(false);
      setSelectedJobId(newJob.id);
      return newJob;
  };

  const handleDeleteJob = async (jobId: number) => {
      const jobToDelete = jobs.find(j => j.id === jobId);
      if(!jobToDelete) return;

      if (window.confirm(`Are you sure you want to permanently delete the job "${jobToDelete.title}" and all its associated analyses? This cannot be undone.`)) {
          await dbService.deleteJobAndAnalyses(jobId);
          await loadAllData();
      }
  };

  const handleJobSelection = (selection: 'new' | number) => {
    if (selection === 'new') {
        setIsCreatingJob(true);
        setSelectedJobId(null);
    } else {
        setIsCreatingJob(false);
        setSelectedJobId(selection);
    }
  };

  const filteredAnalysisResults = useMemo(() => {
    if (!selectedJobId) return [];
    return analysisResults.filter(r => r.jobId === selectedJobId);
  }, [analysisResults, selectedJobId]);

  const anyLoading = isLoading || isImporting;
  const isExportDisabled = anyLoading || jobs.length === 0;
  
  if (dbState === 'uninitialized' || dbState === 'initializing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100 dark:bg-[#121212] text-content-100 dark:text-white">
        <div className="text-center">
          <LoaderIcon className="mx-auto h-12 w-12 animate-spin text-brand-primary" />
          <p className="mt-4 text-lg font-semibold text-content-200 dark:text-[#8D8D92]">Initializing Application...</p>
        </div>
      </div>
    );
  }

  if (dbState === 'needs-choice') {
    return <DatabaseSetup onCreate={handleCreateNewDatabase} onImport={handleImportDatabase} />;
  }


  return (
    <div className="min-h-screen bg-base-100 dark:bg-[#121212] text-content-100 dark:text-white font-sans leading-relaxed">
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => {
            setIsApiKeyModalOpen(false);
            setIsAnalysisPending(false);
        }}
        onSave={handleSaveApiKey}
      />
      <Header 
        onImport={handleImportDatabase}
        onExport={handleExportDatabase}
        isExportDisabled={isExportDisabled}
        isLoading={anyLoading}
        onManageApiKey={() => setIsApiKeyModalOpen(true)}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <ResumeInputForm
            jobs={jobs}
            selectedJobId={selectedJobId}
            onJobSelectionChange={handleJobSelection}
            isCreatingJob={isCreatingJob}
            jobTitle={jobTitle}
            jobDescription={jobDescriptionText}
            setJobTitle={setJobTitle}
            setJobDescription={setJobDescriptionText}
            onSaveNewJob={handleSaveNewJob}
            onDeleteJob={handleDeleteJob}
            resumeFiles={resumeFiles}
            setResumeFiles={handleSetResumes}
            onAnalyze={triggerAnalysis}
            isLoading={anyLoading}
            isAnalyzing={isLoading}
            analysisProgress={analysisProgress}
            setError={setError}
            apiKey={apiKey}
            isApiKeyModalOpen={isApiKeyModalOpen}
            onRequestApiKey={() => setIsApiKeyModalOpen(true)}
          />
          
          {error && !anyLoading && <ErrorMessage message={error} />}
          
          {isImporting && (
             <div className="text-center p-8 bg-base-200 dark:bg-[#1C1C1E] rounded-2xl animate-fade-in border border-base-300 dark:border-[#2C2C2E]">
                <LoaderIcon className="mx-auto h-8 w-8 animate-spin text-brand-primary" />
                <h2 className="mt-4 text-lg font-semibold text-content-100 dark:text-white">Importing Database...</h2>
                <p className="mt-2 text-sm text-content-200 dark:text-[#8D8D92]">Please wait while we load the new database.</p>
            </div>
          )}
            
          {selectedResult ? (
            <div className="animate-fade-in">
              <button
                onClick={() => setSelectedResult(null)}
                className="mb-6 inline-flex items-center gap-2 rounded-full bg-base-200 dark:bg-[#1C1C1E] px-4 py-2 text-sm font-semibold text-content-100 dark:text-white shadow-sm hover:bg-base-300 dark:hover:bg-[#2C2C2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
                Back to Summary
              </button>
              <AnalysisDisplay result={selectedResult} />
            </div>
          ) : (
            <AnalysisSummaryTable 
              results={filteredAnalysisResults}
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelectResult={handleViewDetails} 
              onDeleteResult={handleDeleteResult}
              onDeleteAll={handleDeleteAllResultsForJob}
              isLoading={anyLoading}
            />
          )}
        </div>
      </main>
      <footer className="text-center py-8 text-xs text-content-200 dark:text-[#8D8D92]">
        <p>Powered by Google Gemini. For informational purposes only.</p>
      </footer>
    </div>
  );
};

export default App;

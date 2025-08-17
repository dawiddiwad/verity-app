import React, { useRef, useState } from 'react';
import { StoredAnalysis, AnalysisResult, Job } from '../types';
import ScoreDonutChart from './ScoreDonutChart';
import { ExclamationTriangleIcon, TrashIcon, SparklesIcon, BriefcaseIcon } from './Icons';
import AnalysisPreviewModal from './AnalysisPreviewModal';

interface AnalysisSummaryTableProps {
  results: StoredAnalysis[];
  jobs: Job[];
  selectedJobId: number | null;
  onSelectResult: (result: StoredAnalysis) => void;
  onDeleteResult: (id: number) => void;
  onDeleteAll: () => void;
  isLoading: boolean;
}

const EmptyState: React.FC<{icon: React.ReactNode; title: string; children: React.ReactNode}> = ({icon, title, children}) => (
    <div className="text-center py-20 px-6 bg-base-200 dark:bg-[#1C1C1E] rounded-2xl animate-fade-in border border-base-300 dark:border-[#2C2C2E]">
        <div className="mx-auto h-14 w-14 text-content-200 dark:text-[#8D8D92] flex items-center justify-center">
            {icon}
        </div>
        <h2 className="mt-4 text-xl font-semibold text-content-100 dark:text-white">{title}</h2>
        <div className="mt-2 text-base text-content-200 dark:text-[#8D8D92] max-w-lg mx-auto">
            {children}
        </div>
    </div>
);

const AnalysisSummaryTable: React.FC<AnalysisSummaryTableProps> = ({ results, jobs, selectedJobId, onSelectResult, onDeleteResult, onDeleteAll, isLoading }) => {
  const [hoveredResult, setHoveredResult] = useState<{ result: StoredAnalysis; position: DOMRect } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>, result: StoredAnalysis) => {
    if ('error' in result.analysis || !e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredResult({
      result,
      position: rect,
    });
  };

  const handleMouseLeave = () => {
    setHoveredResult(null);
  };


  if (jobs.length === 0 && !isLoading) {
    return (
        <EmptyState 
            icon={<BriefcaseIcon className="h-12 w-12"/>}
            title="Welcome to Verity"
        >
            <p>Your database is ready. To get started, create your first job description above.</p>
        </EmptyState>
    );
  }

  if (results.length === 0 && !isLoading) {
    const selectedJob = jobs.find(j => j.id === selectedJobId);
    return (
      <EmptyState
        icon={<SparklesIcon className="h-12 w-12"/>}
        title={selectedJob ? `Ready to analyze resumes for "${selectedJob.title}"?` : "No Job Selected"}
      >
        <p>
          {selectedJob ? 'Upload one or more resumes above to see the analysis history here.' : 'Select a job from the dropdown to view its history.'}
        </p>
         <p className="mt-2 text-sm text-content-200 dark:text-[#8D8D92]">
            You can also import a full analysis history using the 'Import' button in the header.
        </p>
      </EmptyState>
    );
  }

  const sortedResults = [...results].sort((a, b) => {
    const aHasError = 'error' in a.analysis;
    const bHasError = 'error' in b.analysis;

    if (aHasError && !bHasError) return 1;
    if (!aHasError && bHasError) return -1;
    
    if (aHasError && bHasError) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    const aScore = (a.analysis as AnalysisResult).matchScore;
    const bScore = (b.analysis as AnalysisResult).matchScore;

    if (bScore !== aScore) {
      return bScore - aScore;
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const selectedJobTitle = jobs.find(j => j.id === selectedJobId)?.title || "History";
  
  return (
    <>
      <div className="bg-base-200 dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-base-300 dark:border-[#2C2C2E] animate-fade-in">
        <div className="p-5 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-content-100 dark:text-white">Analysis History for "{selectedJobTitle}"</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onDeleteAll}
              disabled={isLoading || results.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-danger-text bg-danger-bg rounded-md hover:bg-danger-text/20 disabled:opacity-50"
              title={`Clear history for "${selectedJobTitle}"`}
            >
              <TrashIcon className="h-4 w-4" /> Clear Job History
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-content-100 dark:text-white">
            <thead className="border-b border-base-300 dark:border-[#2C2C2E]">
              <tr>
                <th scope="col" className="py-3.5 px-6 font-semibold">Candidate</th>
                <th scope="col" className="py-3.5 px-6 font-semibold text-center">Match Score</th>
                <th scope="col" className="py-3.5 px-6 font-semibold">AI Summary</th>
                <th scope="col" className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300 dark:divide-[#2C2C2E]">
              {sortedResults.map((result) => {
                const isError = 'error' in result.analysis;
                const candidateDisplayName = !isError ? (result.analysis as AnalysisResult).candidateName : result.fileName;

                return (
                <tr key={result.id} className="hover:bg-base-300 dark:hover:bg-[#2C2C2E] transition-colors duration-150">
                  <td className="py-4 px-6 font-medium whitespace-nowrap">
                      <div className="flex flex-col">
                          <span className="font-semibold" title={result.fileName}>{candidateDisplayName}</span>
                          <span className="text-xs text-content-200 dark:text-[#8D8D92]">{new Date(result.createdAt).toLocaleString()}</span>
                      </div>
                  </td>
                  {isError ? (
                    <td colSpan={2} className="py-4 px-6 text-danger-text">
                      <div className="flex items-center gap-2 max-w-sm">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold">Analysis failed:</span>
                          <p className="line-clamp-2" title={(result.analysis as { error: string }).error}>{(result.analysis as { error: string }).error}</p>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td 
                        className="py-4 px-6"
                        onMouseEnter={(e) => handleMouseEnter(e, result)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="w-20 h-20 mx-auto cursor-pointer">
                          <ScoreDonutChart score={(result.analysis as AnalysisResult).matchScore} />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-content-200 dark:text-[#8D8D92] max-w-sm">
                        <p className="line-clamp-3 leading-relaxed">{(result.analysis as AnalysisResult).summary}</p>
                      </td>
                    </>
                  )}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!('error' in result.analysis) && (
                        <button 
                          onClick={() => onSelectResult(result)}
                          className="font-semibold text-brand-primary hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`View details for ${result.fileName}`}
                          disabled={isLoading}
                        >
                          Details &rarr;
                        </button>
                      )}
                      <button
                          onClick={() => onDeleteResult(result.id)}
                          className="p-2 text-content-200 dark:text-[#8D8D92] hover:text-danger-text hover:bg-danger-bg rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Delete analysis for ${result.fileName}`}
                          disabled={isLoading}
                      >
                          <TrashIcon className="h-5 w-5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
      <AnalysisPreviewModal data={hoveredResult} />
    </>
  );
};

export default AnalysisSummaryTable;
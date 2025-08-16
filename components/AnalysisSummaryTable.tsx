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
        <div className="text-center py-16 px-6 bg-base-200 rounded-lg animate-fade-in border border-dashed border-base-300">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-brand-secondary" />
            <h2 className="mt-4 text-2xl font-semibold text-content-100">Welcome to Verity App</h2>
            <p className="mt-2 text-md text-content-200">
                Your database is ready. To get started, create your first job description above.
            </p>
        </div>
    );
  }

  if (results.length === 0 && !isLoading) {
    const selectedJob = jobs.find(j => j.id === selectedJobId);
    return (
      <div className="text-center py-16 px-6 bg-base-200 rounded-lg animate-fade-in border border-dashed border-base-300">
        <SparklesIcon className="mx-auto h-12 w-12 text-brand-secondary" />
        <h2 className="mt-4 text-2xl font-semibold text-content-100">
            {selectedJob ? `Ready to analyze resumes for "${selectedJob.title}"?` : "No Job Selected"}
        </h2>
        <p className="mt-2 text-md text-content-200">
          {selectedJob ? 'Upload one or more resumes above to see the analysis history here.' : 'Select a job from the dropdown to view its history.'}
        </p>
         <p className="mt-2 text-sm text-content-200">
            You can also import a full analysis history using the 'Import Database' button in the header.
        </p>
      </div>
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
      <div className="bg-base-200 rounded-lg shadow-lg animate-fade-in">
        <div className="p-5 border-b border-base-300 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-content-100">Analysis History for "{selectedJobTitle}"</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onDeleteAll}
              disabled={isLoading || results.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20 disabled:opacity-50"
              title={`Clear history for "${selectedJobTitle}"`}
            >
              <TrashIcon className="h-4 w-4" /> Clear Job History
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-content-100">
            <thead className="border-b border-base-300 bg-base-100/30">
              <tr>
                <th scope="col" className="p-4 font-semibold">Candidate</th>
                <th scope="col" className="p-4 font-semibold text-center">Match Score</th>
                <th scope="col" className="p-4 font-semibold">AI Summary</th>
                <th scope="col" className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {sortedResults.map((result) => {
                const isError = 'error' in result.analysis;
                const candidateDisplayName = !isError ? (result.analysis as AnalysisResult).candidateName : result.fileName;

                return (
                <tr key={result.id} className="hover:bg-base-100/50 transition-colors duration-150">
                  <td className="p-4 font-medium whitespace-nowrap">
                      <div className="flex flex-col">
                          <span className="font-semibold" title={result.fileName}>{candidateDisplayName}</span>
                          <span className="text-xs text-content-200">{new Date(result.createdAt).toLocaleString()}</span>
                      </div>
                  </td>
                  {isError ? (
                    <td colSpan={2} className="p-4 text-red-400">
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
                        className="p-4"
                        onMouseEnter={(e) => handleMouseEnter(e, result)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="w-20 h-20 mx-auto cursor-pointer">
                          <ScoreDonutChart score={(result.analysis as AnalysisResult).matchScore} />
                        </div>
                      </td>
                      <td className="p-4 text-content-200 max-w-sm">
                        <p className="line-clamp-3">{(result.analysis as AnalysisResult).summary}</p>
                      </td>
                    </>
                  )}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!('error' in result.analysis) && (
                        <button 
                          onClick={() => onSelectResult(result)}
                          className="font-semibold text-brand-primary hover:text-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`View details for ${result.fileName}`}
                          disabled={isLoading}
                        >
                          Details &rarr;
                        </button>
                      )}
                      <button
                          onClick={() => onDeleteResult(result.id)}
                          className="p-2 text-content-200 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
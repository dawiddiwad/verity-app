import React, { useState } from 'react';
import { StoredAnalysis } from '../types';
import AnalysisCard from './AnalysisCard';
import KeywordPill from './KeywordPill';
import ScoreDonutChart from './ScoreDonutChart';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon, PencilIcon, DocumentChartBarIcon, DocumentTextIcon, BriefcaseIcon, ArrowDownTrayIcon } from './Icons';
import ErrorMessage from './ErrorMessage';
import FilePreview from './FilePreview';

interface AnalysisDisplayProps {
  result: StoredAnalysis;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isJobDescExpanded, setIsJobDescExpanded] = useState(false);

  if ('error' in result.analysis) {
     return <ErrorMessage message={`Analysis failed for ${result.fileName}: ${result.analysis.error}`} />;
  }

  const analysis = result.analysis;

  const handleDownload = () => {
    if (!result.resumeData.fileBlob || !result.resumeData.fileMimeType) {
      console.error("No file data available for download.");
      return;
    }
    const blob = new Blob([result.resumeData.fileBlob], { type: result.resumeData.fileMimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const CollapsibleSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    setIsExpanded: (isExpanded: boolean) => void;
    children: React.ReactNode;
    extraControls?: React.ReactNode;
  }> = ({ title, icon, isExpanded, setIsExpanded, children, extraControls }) => (
    <div className="bg-base-200 dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-base-300 dark:border-[#2C2C2E] overflow-hidden">
      <div
          className="p-5 flex justify-between items-center cursor-pointer hover:bg-base-300 dark:hover:bg-[#2C2C2E] transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded)}}
      >
          <h2 className="text-xl font-semibold text-content-100 dark:text-white flex items-center gap-3">
              <span className="h-6 w-6">{icon}</span>
              {title}
          </h2>
          <div className="flex items-center gap-4">
            {extraControls}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-6 h-6 text-content-200 dark:text-[#8D8D92] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </div>
      </div>
      {isExpanded && (
          <div className="p-5 border-t border-base-300 dark:border-[#2C2C2E]">
              {children}
          </div>
      )}
    </div>
  );


  return (
    <div className="space-y-8 animate-fade-in">
      <AnalysisCard title="Overall Match Score" icon={<DocumentChartBarIcon/>}>
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 md:gap-8">
            <div className="w-40 h-40 flex-shrink-0">
                <ScoreDonutChart score={analysis.matchScore} />
            </div>
            <div className="flex-1 text-center md:text-left">
                <p className="text-base text-content-200 dark:text-[#8D8D92] leading-relaxed">{analysis.summary}</p>
            </div>
        </div>
      </AnalysisCard>
      
       <CollapsibleSection
        title={`Analyzed Against: ${result.jobTitle}`}
        icon={<BriefcaseIcon/>}
        isExpanded={isJobDescExpanded}
        setIsExpanded={setIsJobDescExpanded}
      >
        <div className="bg-base-100 dark:bg-[#121212] p-4 rounded-lg max-h-72 overflow-y-auto">
          <p className="text-sm text-content-200 dark:text-[#8D8D92] leading-relaxed whitespace-pre-wrap selection:bg-brand-primary/20">
              {result.jobDescription}
          </p>
        </div>
      </CollapsibleSection>
      
      <CollapsibleSection
        title="Original Resume"
        icon={<DocumentTextIcon/>}
        isExpanded={isPreviewExpanded}
        setIsExpanded={setIsPreviewExpanded}
        extraControls={result.resumeData.fileBlob && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-content-200 bg-base-200 hover:bg-base-300 dark:text-[#8D8D92] dark:bg-[#1C1C1E] dark:hover:bg-[#2C2C2E] rounded-md disabled:opacity-50 transition-colors z-10"
                title={`Download ${result.fileName}`}
            >
                <ArrowDownTrayIcon className="h-4 w-4" /> Download
            </button>
        )}
      >
        {result.resumeData.fileBlob && result.resumeData.fileMimeType ? (
            <FilePreview
                fileBlob={result.resumeData.fileBlob}
                fileMimeType={result.resumeData.fileMimeType}
            />
        ) : (
            <div className="bg-base-100 dark:bg-[#121212] p-6 rounded-lg">
                <p className="text-content-200 dark:text-[#8D8D92]">No original file data available to display a preview.</p>
            </div>
        )}
      </CollapsibleSection>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalysisCard title="Strengths" icon={<CheckCircleIcon className="text-success-text" />}>
          <ul className="space-y-3 list-disc list-inside text-content-200 dark:text-[#8D8D92]">
            {analysis.strengths.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </AnalysisCard>
        <AnalysisCard title="Gaps" icon={<PencilIcon className="text-warning-text" />}>
          <ul className="space-y-3 list-disc list-inside text-content-200 dark:text-[#8D8D92]">
            {analysis.gaps.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </AnalysisCard>
      </div>

      <AnalysisCard title="Keyword Analysis" icon={<LightBulbIcon />}>
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-semibold text-content-100 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-success-text"/> Matching Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.matchingKeywords.length > 0 ? (
                analysis.keywordAnalysis.matchingKeywords.map((keyword, index) => (
                  <KeywordPill key={`match-${index}`} keyword={keyword} type="match" />
                ))
              ) : <p className="text-sm text-content-200 dark:text-[#8D8D92]">No matching keywords found.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold text-content-100 dark:text-white mb-3 flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 text-warning-text"/> Missing Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.missingKeywords.length > 0 ? (
                analysis.keywordAnalysis.missingKeywords.map((keyword, index) => (
                  <KeywordPill key={`miss-${index}`} keyword={keyword} type="miss" />
                ))
              ) : <p className="text-sm text-content-200 dark:text-[#8D8D92]">All important keywords seem to be included. Great!</p>}
            </div>
          </div>
        </div>
      </AnalysisCard>

    </div>
  );
};

export default AnalysisDisplay;
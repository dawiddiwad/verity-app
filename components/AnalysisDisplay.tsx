
import React from 'react';
import { StoredAnalysis } from '../types';
import AnalysisCard from './AnalysisCard';
import KeywordPill from './KeywordPill';
import ScoreDonutChart from './ScoreDonutChart';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon, PencilIcon, DocumentChartBarIcon, DocumentTextIcon, BriefcaseIcon, SparklesIcon, ArrowDownTrayIcon } from './Icons';
import ErrorMessage from './ErrorMessage';
import FilePreview from './FilePreview';

interface AnalysisDisplayProps {
  result: StoredAnalysis;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
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

  return (
    <div className="space-y-8 animate-fade-in">
      <AnalysisCard title="Overall Match Score" icon={<DocumentChartBarIcon/>}>
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 md:gap-8">
            <div className="w-48 h-48">
                <ScoreDonutChart score={analysis.matchScore} />
            </div>
            <div className="flex-1 text-center md:text-left">
                <p className="text-lg text-content-100">{analysis.summary}</p>
            </div>
        </div>
      </AnalysisCard>

      <AnalysisCard title={`Analyzed Against: ${result.jobTitle}`} icon={<BriefcaseIcon />}>
        <div className="bg-base-100 p-4 rounded-lg max-h-60 overflow-y-auto">
          <p className="text-sm text-content-200 leading-relaxed whitespace-pre-wrap selection:bg-brand-primary/20">
            {result.jobDescription}
          </p>
        </div>
      </AnalysisCard>
      
      <AnalysisCard title="Original Resume" icon={<DocumentTextIcon />}>
        <div className="flex justify-end mb-4 border-b border-base-100 pb-4">
            {result.resumeData.fileBlob && (
                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-content-100 bg-base-300/70 border border-base-300 rounded-md hover:bg-base-300"
                    title={`Download ${result.fileName}`}
                >
                    <ArrowDownTrayIcon className="h-4 w-4" /> Download Original
                </button>
            )}
        </div>
        {result.resumeData.fileBlob && result.resumeData.fileMimeType ? (
            <FilePreview
                fileBlob={result.resumeData.fileBlob}
                fileMimeType={result.resumeData.fileMimeType}
            />
        ) : (
            <div className="bg-base-100 p-6 rounded-lg">
                <p className="text-content-200">No original file data available to display a preview.</p>
            </div>
        )}
      </AnalysisCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnalysisCard title="Strengths" icon={<CheckCircleIcon className="text-green-400" />}>
          <ul className="space-y-2 list-disc list-inside text-content-100">
            {analysis.strengths.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </AnalysisCard>
        <AnalysisCard title="Areas for Improvement" icon={<PencilIcon className="text-yellow-400" />}>
          <ul className="space-y-2 list-disc list-inside text-content-100">
            {analysis.areasForImprovement.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </AnalysisCard>
      </div>

      <AnalysisCard title="Keyword Analysis" icon={<LightBulbIcon />}>
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-semibold text-content-100 mb-2 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-400"/> Matching Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.matchingKeywords.length > 0 ? (
                analysis.keywordAnalysis.matchingKeywords.map((keyword, index) => (
                  <KeywordPill key={`match-${index}`} keyword={keyword} type="match" />
                ))
              ) : <p className="text-sm text-content-200">No matching keywords found.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-md font-semibold text-content-100 mb-2 flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 text-yellow-400"/> Missing Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.missingKeywords.length > 0 ? (
                analysis.keywordAnalysis.missingKeywords.map((keyword, index) => (
                  <KeywordPill key={`miss-${index}`} keyword={keyword} type="miss" />
                ))
              ) : <p className="text-sm text-content-200">All important keywords seem to be included. Great!</p>}
            </div>
          </div>
        </div>
      </AnalysisCard>

      <AnalysisCard title="Tailored Suggestions" icon={<SparklesIcon />}>
          <p className="text-content-100 whitespace-pre-wrap leading-relaxed">{analysis.tailoredSuggestions}</p>
      </AnalysisCard>

    </div>
  );
};

export default AnalysisDisplay;

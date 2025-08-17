import React from 'react';
import ReactDOM from 'react-dom';
import { StoredAnalysis } from '../types';
import { CheckCircleIcon, XCircleIcon } from './Icons';
import KeywordPill from './KeywordPill';

interface AnalysisPreviewModalProps {
  data: {
    result: StoredAnalysis;
    position: DOMRect;
  } | null;
}

const modalRoot = document.getElementById('modal-root');

const AnalysisPreviewModal: React.FC<AnalysisPreviewModalProps> = ({ data }) => {
  if (!data || !modalRoot || 'error' in data.result.analysis) {
    return null;
  }

  const analysis = data.result.analysis;
  const targetRect = data.position;
  const GAP = 10;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${window.scrollY + targetRect.top - GAP}px`,
    left: `${window.scrollX + targetRect.left + targetRect.width / 2}px`,
    transform: 'translateX(-50%) translateY(-100%)',
    animation: 'fadeIn 0.2s ease-out forwards',
    zIndex: 50,
  };

  const modalContent = (
    <div
      className="p-5 bg-base-200 dark:bg-[#1C1C1E] rounded-xl shadow-2xl w-full max-w-sm border border-base-300 dark:border-[#2C2C2E]"
      style={style}
    >
      <h3 className="text-lg font-bold text-content-100 dark:text-white mb-4">{analysis.candidateName}</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-content-200 dark:text-[#8D8D92] flex items-center gap-2 mb-2">
            <CheckCircleIcon className="h-4 w-4 text-success-text" />
            Matching Keywords
          </h4>
          {analysis.keywordAnalysis.matchingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.matchingKeywords.map((keyword, index) => (
                <KeywordPill key={`match-${keyword}-${index}`} keyword={keyword} type="match" />
              ))}
            </div>
          ) : (
             <p className="text-xs text-content-200/70 dark:text-[#8D8D92]/70">No matching keywords found.</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-content-200 dark:text-[#8D8D92] flex items-center gap-2 mb-2">
            <XCircleIcon className="h-4 w-4 text-warning-text" />
            Missing Keywords
          </h4>
          {analysis.keywordAnalysis.missingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.keywordAnalysis.missingKeywords.map((item, index) => (
                <KeywordPill key={`miss-${item}-${index}`} keyword={item} type="miss" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-content-200/70 dark:text-[#8D8D92]/70">None! Great job.</p>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AnalysisPreviewModal;
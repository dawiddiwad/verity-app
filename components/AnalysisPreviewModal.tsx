import React, { useLayoutEffect, useRef, useState } from 'react';
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
const MAX_KEYWORDS_PER_LIST = 5;

const AnalysisPreviewModal: React.FC<AnalysisPreviewModalProps> = ({ data }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (data && modalRef.current && modalRoot) {
      const targetRect = data.position;
      const modalRect = modalRef.current.getBoundingClientRect();
      const GAP = 10;
      const PADDING = 10;

      const pos = { top: 0, left: 0, transform: '' };

      // Vertical positioning
      const spaceAbove = targetRect.top;
      if (spaceAbove > modalRect.height + GAP) {
        pos.top = targetRect.top - GAP;
        pos.transform = 'translateY(-100%)'; // Position above
      } else {
        pos.top = targetRect.bottom + GAP; // Position below
      }
      
      // Horizontal positioning
      let newLeft = targetRect.left + targetRect.width / 2; // Ideal center point
      
      if (newLeft - modalRect.width / 2 < PADDING) {
          newLeft = modalRect.width / 2 + PADDING;
      }
      if (newLeft + modalRect.width / 2 > window.innerWidth - PADDING) {
          newLeft = window.innerWidth - modalRect.width / 2 - PADDING;
      }
      pos.left = newLeft;
      pos.transform += ' translateX(-50%)'; // Center horizontally

      setStyle({
        position: 'absolute',
        top: `${window.scrollY + pos.top}px`,
        left: `${window.scrollX + pos.left}px`,
        transform: pos.transform,
        opacity: 1,
      });
    }
  }, [data]);

  if (!data || !modalRoot || 'error' in data.result.analysis) {
    return null;
  }

  const { analysis } = data.result;
  const { matchingKeywords, missingKeywords } = analysis.keywordAnalysis;

  const renderKeywordList = (keywords: string[], type: 'match' | 'miss') => {
    const displayedKeywords = keywords.slice(0, MAX_KEYWORDS_PER_LIST);
    const remainingCount = keywords.length - displayedKeywords.length;

    return (
      <>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayedKeywords.map((keyword, index) => (
              <KeywordPill key={`${type}-${keyword}-${index}`} keyword={keyword} type={type} />
            ))}
            {remainingCount > 0 && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-base-300 dark:bg-[#2C2C2E] text-content-200 dark:text-[#8D8D92]">
                + {remainingCount} more
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-content-200/70 dark:text-[#8D8D92]/70">
            {type === 'match' ? 'No matching keywords found.' : 'None! Great job.'}
          </p>
        )}
      </>
    );
  };
  
  const modalContent = (
    <div
      ref={modalRef}
      className="p-5 bg-base-200 dark:bg-[#1C1C1E] rounded-xl shadow-2xl w-full max-w-lg border border-base-300 dark:border-[#2C2C2E] transition-opacity duration-200"
      style={{
        ...style,
        opacity: Object.keys(style).length > 0 ? 1 : 0, // Fade in after position is calculated
        animation: 'fadeIn 0.2s ease-out forwards',
        zIndex: 50,
      }}
    >
      <h3 className="text-lg font-bold text-content-100 dark:text-white mb-4 truncate">{analysis.candidateName}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <h4 className="text-sm font-semibold text-content-200 dark:text-[#8D8D92] flex items-center gap-2 mb-2">
            <CheckCircleIcon className="h-4 w-4 text-success-text" />
            Matching Keywords
          </h4>
          {renderKeywordList(matchingKeywords, 'match')}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-content-200 dark:text-[#8D8D92] flex items-center gap-2 mb-2">
            <XCircleIcon className="h-4 w-4 text-warning-text" />
            Missing Keywords
          </h4>
          {renderKeywordList(missingKeywords, 'miss')}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AnalysisPreviewModal;
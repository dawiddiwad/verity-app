import React from 'react';

interface KeywordPillProps {
  keyword: string;
  type: 'match' | 'miss';
}

const KeywordPill: React.FC<KeywordPillProps> = ({ keyword, type }) => {
  const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
  const typeClasses = {
    match: "bg-success-bg text-success-text",
    miss: "bg-warning-bg text-warning-text",
  };

  return (
    <span className={`${baseClasses} ${typeClasses[type]}`}>
      {keyword}
    </span>
  );
};

export default KeywordPill;
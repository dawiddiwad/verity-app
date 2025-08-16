
import React from 'react';

interface KeywordPillProps {
  keyword: string;
  type: 'match' | 'miss';
}

const KeywordPill: React.FC<KeywordPillProps> = ({ keyword, type }) => {
  const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
  const typeClasses = {
    match: "bg-green-500/20 text-green-300",
    miss: "bg-yellow-500/20 text-yellow-300",
  };

  return (
    <span className={`${baseClasses} ${typeClasses[type]}`}>
      {keyword}
    </span>
  );
};

export default KeywordPill;

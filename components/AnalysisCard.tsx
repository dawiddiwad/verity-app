
import React from 'react';

interface AnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-base-200 rounded-lg shadow-lg overflow-hidden">
      <div className="p-5 border-b border-base-300">
        <h2 className="text-xl font-semibold text-content-100 flex items-center gap-3">
            <span className="h-6 w-6">{icon}</span>
            {title}
        </h2>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

export default AnalysisCard;

import React from 'react';

interface AnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-base-200 dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-base-300 dark:border-[#2C2C2E] overflow-hidden">
      <div className="p-5 border-b border-base-300 dark:border-[#2C2C2E]">
        <h2 className="text-xl font-semibold text-content-100 dark:text-white flex items-center gap-3">
            <span className="h-6 w-6">{icon}</span>
            {title}
        </h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default AnalysisCard;
import React from 'react';
import { InformationCircleIcon } from './Icons';

interface WarningMessageProps {
  message: string;
}

const WarningMessage: React.FC<WarningMessageProps> = ({ message }) => {
  return (
    <div className="bg-base-200 dark:bg-[#1C1C1E] border-l-4 border-warning-text text-content-200 dark:text-[#8D8D92] pl-4 pr-3 py-3 rounded-r-lg relative mt-6 animate-fade-in" role="status">
      <div className="flex items-start">
        <InformationCircleIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-warning-text" />
        <div>
          <strong className="font-semibold text-content-100 dark:text-white">Notice</strong>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default WarningMessage;
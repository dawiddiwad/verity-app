import React from 'react';
import { InformationCircleIcon, XMarkIcon } from './Icons';

interface WarningMessageProps {
  message: string;
  onDismiss?: () => void;
}

const WarningMessage: React.FC<WarningMessageProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-base-200 dark:bg-[#1C1C1E] border-l-4 border-warning-text text-content-200 dark:text-[#8D8D92] pl-4 pr-3 py-3 rounded-r-lg relative mt-6 animate-fade-in" role="status">
      <div className="flex items-center">
        <InformationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0 text-warning-text" />
        <div className={`flex-1 ${onDismiss ? 'pr-8' : ''}`}>
          <strong className="font-semibold text-content-100 dark:text-white">Notice</strong>
          <p className="text-sm">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-1/2 right-3.5 -translate-y-1/2 p-1 rounded-full text-content-200/70 dark:text-[#8D8D92]/70 hover:text-content-100 dark:hover:text-white hover:bg-base-300 dark:hover:bg-[#2C2C2E] transition-colors"
          aria-label="Dismiss notice"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default WarningMessage;
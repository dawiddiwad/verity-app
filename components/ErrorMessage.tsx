import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from './Icons';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-danger-bg border border-danger-text/30 text-danger-text px-4 py-3 rounded-xl relative mt-6 animate-fade-in" role="alert">
      <div className="flex items-center">
        <ExclamationTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
        <div className={`flex-1 ${onDismiss ? 'pr-8' : ''}`}>
          <strong className="font-semibold">Error</strong>
          <p className="text-sm">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-1/2 right-3.5 -translate-y-1/2 p-1 rounded-full text-danger-text/70 hover:text-danger-text hover:bg-danger-text/20 transition-colors"
          aria-label="Dismiss error"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
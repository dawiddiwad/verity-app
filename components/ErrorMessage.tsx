import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-danger-bg border border-danger-text/30 text-danger-text px-4 py-3 rounded-xl relative mt-6 animate-fade-in" role="alert">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <strong className="font-semibold">Error</strong>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
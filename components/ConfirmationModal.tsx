import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary' | 'default';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  confirmVariant = 'default',
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = {
    danger: 'bg-danger-text text-white hover:bg-danger-text/90',
    primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
    default: 'bg-base-300 dark:bg-[#2C2C2E] text-content-100 dark:text-white hover:bg-base-200 dark:hover:bg-[#1C1C1E]',
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        className="bg-base-200 dark:bg-[#1C1C1E] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-base-300 dark:border-[#2C2C2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
            {confirmVariant === 'danger' && (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-danger-bg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-danger-text" aria-hidden="true" />
              </div>
            )}
            <div className="flex-1">
                <h2 id="confirmation-modal-title" className="text-2xl font-bold text-content-100 dark:text-white">{title}</h2>
                <div className="mt-2 text-content-200 dark:text-[#8D8D92] text-sm">
                    {children}
                </div>
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-base-100 dark:bg-[#121212] text-content-100 dark:text-white hover:bg-base-300 dark:hover:bg-[#2C2C2E] font-semibold text-sm transition-colors border border-base-300 dark:border-[#2C2C2E]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${confirmButtonClasses[confirmVariant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

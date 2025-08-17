import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [key, setKey] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setKey(''); // Reset key input when modal is closed
    }
  }, [isOpen]);

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
        onClick={onClose}
    >
      <div 
        className="bg-base-200 dark:bg-[#1C1C1E] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-base-300 dark:border-[#2C2C2E]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 text-content-100 dark:text-white">Set Google Gemini API Key</h2>
        <p className="text-content-200 dark:text-[#8D8D92] mb-6 text-sm">
          To use the analysis feature, please provide an API key for Google Gemini. Your key is stored in your browser's session storage and is never sent anywhere else.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your API key"
          className="w-full rounded-lg border border-base-300 dark:border-[#2C2C2E] bg-base-100 dark:bg-[#121212] py-2.5 px-4 text-content-100 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary sm:text-sm"
          autoFocus
        />
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-base-100 dark:bg-[#121212] text-content-100 dark:text-white hover:bg-base-300 dark:hover:bg-[#2C2C2E] font-semibold text-sm transition-colors border border-base-300 dark:border-[#2C2C2E]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!key.trim()} className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 font-semibold text-sm disabled:opacity-50 transition-colors">
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
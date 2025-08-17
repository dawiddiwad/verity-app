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
        className="fixed inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-base-200 p-6 rounded-lg shadow-2xl w-full max-w-md border border-base-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-content-100">Set Google Gemini API Key</h2>
        <p className="text-content-200 mb-4 text-sm">
          To use the analysis feature, you need to provide an API key for Google Gemini. Your key is stored in your browser's session storage and is never sent anywhere else.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your API key"
          className="w-full rounded-md border-0 bg-base-100 py-2 px-3 text-content-100 shadow-sm ring-1 ring-inset ring-base-300 focus:ring-2 focus:ring-inset focus:ring-brand-primary"
          autoFocus
        />
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-base-300 text-content-100 hover:bg-base-300/80 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!key.trim()} className="px-4 py-2 rounded-md bg-brand-primary text-white hover:bg-sky-500 disabled:opacity-50 transition-colors">
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;

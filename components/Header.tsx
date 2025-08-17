import React, { useRef } from 'react';
import { DocumentTextIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, KeyIcon } from './Icons';

interface HeaderProps {
    onImport: (file: File) => void;
    onExport: () => void;
    isExportDisabled: boolean;
    isLoading: boolean;
    onManageApiKey: () => void;
}

const Header: React.FC<HeaderProps> = ({ onImport, onExport, isExportDisabled, isLoading, onManageApiKey }) => {
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    event.target.value = ''; // Reset input
  };

  return (
    <header className="bg-base-200/50 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-8 w-8 text-brand-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-content-100">
                Verity
            </h1>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onManageApiKey}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-content-100 bg-base-300/70 border border-base-300 rounded-md hover:bg-base-300 disabled:opacity-50"
                    title="Manage Google Gemini API Key"
                >
                    <KeyIcon className="h-4 w-4" /> Manage API Key
                </button>
                <input type="file" ref={importInputRef} className="hidden" accept=".db" onChange={handleFileImport} />
                <button
                onClick={handleImportClick}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-content-100 bg-base-300/70 border border-base-300 rounded-md hover:bg-base-300 disabled:opacity-50"
                title="Import from a .db file"
                >
                <ArrowUpTrayIcon className="h-4 w-4" /> Import Database
                </button>
                <button
                onClick={onExport}
                disabled={isExportDisabled}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-content-100 bg-base-300/70 border border-base-300 rounded-md hover:bg-base-300 disabled:opacity-50"
                title="Export the entire database to a .db file"
                >
                <ArrowDownTrayIcon className="h-4 w-4" /> Export Database
                </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

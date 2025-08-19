import React, { useRef } from 'react';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, KeyIcon, VerityLogo } from './Icons';
import ThemeSwitcher from './ThemeSwitcher';
import { Theme } from '../App';


interface HeaderProps {
    onImport: (file: File) => void;
    onExport: () => void;
    isExportDisabled: boolean;
    isLoading: boolean;
    onManageApiKey: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ onImport, onExport, isExportDisabled, isLoading, onManageApiKey, theme, setTheme }) => {
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

  const buttonClasses = "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-content-200 bg-base-200 hover:bg-base-300 dark:text-[#8D8D92] dark:bg-[#1C1C1E] dark:hover:bg-[#2C2C2E] rounded-md disabled:opacity-50 transition-colors";

  return (
    <header className="bg-base-200/80 dark:bg-[#121212]/80 backdrop-blur-xl sticky top-0 z-20 border-b border-base-300 dark:border-[#2C2C2E]">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
                <VerityLogo className="h-7 w-7 text-content-100 dark:text-white" />
                <span className="text-xl font-semibold tracking-tight text-content-100 dark:text-white">
                    Verity
                </span>
            </div>
            <div className="flex items-center gap-2">
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
                <button
                    onClick={onManageApiKey}
                    disabled={isLoading}
                    className={buttonClasses}
                    title="Manage Google Gemini API Key"
                >
                    <KeyIcon className="h-4 w-4" /> 
                    <span className="hidden sm:inline">API Key</span>
                </button>
                <input type="file" ref={importInputRef} className="hidden" accept=".db" onChange={handleFileImport} />
                <button
                    onClick={handleImportClick}
                    disabled={isLoading}
                    className={buttonClasses}
                    title="Import from a .db file"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" /> 
                    <span className="hidden sm:inline">Import</span>
                </button>
                <button
                    onClick={onExport}
                    disabled={isExportDisabled}
                    className={buttonClasses}
                    title="Export the entire database to a .db file"
                >
                    <ArrowUpTrayIcon className="h-4 w-4" /> 
                    <span className="hidden sm:inline">Export</span>
                </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
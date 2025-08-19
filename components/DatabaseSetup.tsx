import React, { useRef } from 'react';
import { VerityLogo, ArrowDownTrayIcon } from './Icons';

interface DatabaseSetupProps {
    onCreate: () => void;
    onImport: (file: File) => void;
}

const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onCreate, onImport }) => {
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
        <div className="flex items-center justify-center min-h-screen bg-base-100 dark:bg-[#121212] text-content-100 dark:text-white font-sans animate-fade-in p-4">
            <div className="max-w-xl mx-auto text-center p-8 sm:p-12 bg-base-200 dark:bg-[#1C1C1E] rounded-2xl shadow-lg border border-base-300 dark:border-[#2C2C2E]">
                <VerityLogo className="mx-auto h-16 w-16 text-brand-primary" />
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-content-100 dark:text-white">
                    Welcome to Verity
                </h1>
                <p className="mt-4 text-lg text-content-200 dark:text-[#8D8D92]">
                    To begin, create a local database to store your jobs and analysis results.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                     <input
                        type="file"
                        ref={importInputRef}
                        className="hidden"
                        accept=".db"
                        onChange={handleFileImport}
                    />

                    <button
                        onClick={onCreate}
                        className="flex-1 rounded-lg bg-brand-primary px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary transition-all"
                    >
                        Create New Database
                    </button>

                    <button
                        onClick={handleImportClick}
                        className="flex flex-1 items-center justify-center gap-3 rounded-lg bg-base-100 dark:bg-[#121212] px-6 py-3 text-base font-semibold text-content-100 dark:text-white shadow-sm hover:bg-base-300 dark:hover:bg-[#2C2C2E] transition-all border border-base-300 dark:border-[#2C2C2E]"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Import (.db)
                    </button>
                </div>
                <p className="mt-8 text-xs text-content-200/70 dark:text-[#8D8D92]/70">
                    All data is stored locally in your browser. No information is ever sent to a server.
                </p>
            </div>
        </div>
    );
};

export default DatabaseSetup;
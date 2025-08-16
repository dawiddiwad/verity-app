import React, { useRef } from 'react';
import { DocumentTextIcon, ArrowUpTrayIcon } from './Icons';

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
        <div className="flex items-center justify-center min-h-screen bg-base-100 text-content-100 font-sans animate-fade-in">
            <div className="max-w-xl mx-auto text-center p-8 bg-base-200 rounded-lg shadow-2xl border border-base-300">
                <DocumentTextIcon className="mx-auto h-16 w-16 text-brand-primary" />
                <h1 className="mt-6 text-3xl font-bold tracking-tight text-content-100">
                    Welcome to the AI Resume Analyzer
                </h1>
                <p className="mt-4 text-lg text-content-200">
                    To begin, you need a database to store your jobs and analysis results.
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
                        className="flex-1 rounded-md bg-brand-primary px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary transition-all"
                    >
                        Create a New Database
                    </button>

                    <button
                        onClick={handleImportClick}
                        className="flex flex-1 items-center justify-center gap-3 rounded-md bg-base-300 px-6 py-3 text-lg font-semibold text-content-100 shadow-sm hover:bg-base-300/80 transition-all"
                    >
                        <ArrowUpTrayIcon className="h-6 w-6" />
                        Import Existing (.db)
                    </button>
                </div>
                <p className="mt-6 text-xs text-content-200/70">
                    All data is stored locally in your browser. No information is sent to a server.
                </p>
            </div>
        </div>
    );
};

export default DatabaseSetup;
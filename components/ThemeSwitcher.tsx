import React, { useState, useEffect, useRef } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon, ChevronDownIcon } from './Icons';
import { Theme } from '../App';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <SunIcon className="h-5 w-5" /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon className="h-5 w-5" /> },
    { value: 'system', label: 'System', icon: <ComputerDesktopIcon className="h-5 w-5" /> },
  ];

  const currentThemeIcon = themeOptions.find(opt => opt.value === theme)?.icon || <ComputerDesktopIcon className="h-4 w-4" />;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-content-200 bg-base-200 hover:bg-base-300 dark:text-[#8D8D92] dark:bg-[#1C1C1E] dark:hover:bg-[#2C2C2E] rounded-md transition-colors"
        title="Change theme"
      >
        {React.cloneElement(currentThemeIcon, { className: 'h-4 w-4' })}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-md bg-base-200 dark:bg-[#1C1C1E] shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none animate-fade-in" style={{ animationDuration: '0.1s'}}>
          <div className="py-1">
            {themeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value as Theme);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left ${
                  theme === option.value
                    ? 'font-semibold text-brand-primary'
                    : 'text-content-100 dark:text-white'
                } hover:bg-base-300 dark:hover:bg-[#2C2C2E]`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;

import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { Globe, Plus, Moon, Sun, Database } from 'lucide-react';

interface HeaderProps {
  currentTab: 'chat' | 'image' | 'database' | 'personas';
  onSelectTab: (tab: 'chat' | 'image' | 'database' | 'personas') => void;
  language: Language;
  onToggleLanguage: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNewSession: () => void;
  dbStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  language,
  onToggleLanguage,
  isDarkMode,
  onToggleDarkMode,
  onNewSession,
  dbStatus = 'Connected'
}) => {
  const t = translations[language];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectTab('chat')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2.5 hover:opacity-85 transition-opacity"
        >
          <img
            src="/src/assets/images/ai_studio_avatar_1793783476686.jpg"
            alt="AI Studio Emblem"
            className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/30"
          />
          <span>{t.appTitle}</span>
        </button>
        <span className="hidden sm:inline-block text-xs font-mono text-slate-500 dark:text-slate-400">
          SQLite 3 · {dbStatus}
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => onSelectTab('chat')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'chat'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t.navChat}
        </button>
        <button
          onClick={() => onSelectTab('image')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'image'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t.navImageLab}
        </button>
        <button
          onClick={() => onSelectTab('database')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'database'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t.navDatabase}
        </button>
        <button
          onClick={() => onSelectTab('personas')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'personas'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {t.navPersonas}
        </button>
      </nav>

      {/* Zone 3: Actions & Toggles */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Language switch */}
        <button
          onClick={onToggleLanguage}
          title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'th' ? 'TH' : 'EN'}</span>
        </button>

        {/* Theme switch */}
        <button
          onClick={onToggleDarkMode}
          title="Toggle Dark/Light Mode"
          className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.newChat}</span>
        </button>
      </div>
    </header>
  );
};

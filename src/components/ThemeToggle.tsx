import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onChange: (theme: 'light' | 'dark') => void;
}

export default function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={() => onChange(theme === 'light' ? 'dark' : 'light')}
      className="p-2.5 rounded-xl glass hover:bg-neutral-100/10 dark:hover:bg-slate-800/40 transition-all text-neutral-800 dark:text-slate-100 cursor-pointer shadow-sm flex items-center justify-center"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-indigo-600" id="moon-icon" />
      ) : (
        <Sun className="w-5 h-5 text-amber-400" id="sun-icon" />
      )}
    </button>
  );
}

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
        </button>
    );
};

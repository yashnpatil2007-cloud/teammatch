import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('tm-theme') || 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('tm-theme', theme);
  }, [theme]);
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  return <ThemeContext.Provider value={{ theme, toggle, isDark: theme==='dark' }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

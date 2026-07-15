import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Helper: apply the right class to <html> based on stored preference
const applyThemeToDoc = (value) => {
  const root = window.document.documentElement;
  if (value === 'dark') {
    root.classList.add('dark');
  } else if (value === 'light') {
    root.classList.remove('dark');
  } else {
    // 'system' — follow OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('medicycle-theme') || 'system';
  });

  // Apply theme whenever it changes
  useEffect(() => {
    applyThemeToDoc(theme);
  }, [theme]);

  // Listen for OS-level changes when theme is 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsChange = () => {
      if (theme === 'system') applyThemeToDoc('system');
    };
    mediaQuery.addEventListener('change', handleOsChange);
    return () => mediaQuery.removeEventListener('change', handleOsChange);
  }, [theme]);

  const setTheme = (value) => {
    localStorage.setItem('medicycle-theme', value);
    setThemeState(value);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

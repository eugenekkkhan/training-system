import React, { createContext, useContext, useState } from 'react';

export const ALL_COLOR_VARS = [
  '--primary', '--primary-dark', '--primary-light',
  '--bg', '--card-bg', '--input-bg', '--surface-2', '--hover-bg',
  '--text', '--text-muted',
  '--border',
  '--success', '--danger', '--warning',
  '--sidebar-bg', '--sidebar-text',
  '--hint-bg', '--hint-text-color', '--hint-border',
  '--alert-error-bg', '--alert-error-text', '--alert-error-border',
  '--alert-success-bg', '--alert-success-border',
];

interface ThemeContextValue {
  customColors: Record<string, string>;
  setCustomColors: (colors: Record<string, string>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyCustomColors(colors: Record<string, string>) {
  for (const key of ALL_COLOR_VARS) {
    if (colors[key]) {
      document.documentElement.style.setProperty(key, colors[key]);
    } else {
      document.documentElement.style.removeProperty(key);
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [customColors, setCustomColorsState] = useState<Record<string, string>>({});

  const setCustomColors = (colors: Record<string, string>) => {
    applyCustomColors(colors);
    setCustomColorsState(colors);
  };

  return (
    <ThemeContext.Provider value={{ customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

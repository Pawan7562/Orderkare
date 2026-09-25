import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'white-emerald' | 'clean-light-emerald' | 'forest-mint' | 'titanium-neon-green';

interface ThemeDefinition {
  id: AppTheme;
  name: string;
  description: string;
  dotColor: string;
  gradient: string;
  isLight?: boolean;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'white-emerald',
    name: 'White & Emerald (Dark Pro)',
    description: 'Crisp white typography with vibrant emerald green & teal accents',
    dotColor: '#10B981',
    gradient: 'from-emerald-500 to-teal-400',
    isLight: false,
  },
  {
    id: 'clean-light-emerald',
    name: 'Pure White & Green (Light)',
    description: 'Clean bright white canvas with rich deep emerald & mint badges',
    dotColor: '#059669',
    gradient: 'from-emerald-600 to-teal-600',
    isLight: true,
  },
  {
    id: 'forest-mint',
    name: 'Deep Forest & Mint White',
    description: 'Nordic forest backdrop with crystalline white and mint glow',
    dotColor: '#34D399',
    gradient: 'from-emerald-400 to-green-500',
    isLight: false,
  },
  {
    id: 'titanium-neon-green',
    name: 'Titanium & Vivid Green',
    description: 'Industrial titanium charcoal with high-contrast lime emerald',
    dotColor: '#22C55E',
    gradient: 'from-green-500 to-emerald-400',
    isLight: false,
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  currentThemeConfig: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('nexify_theme');
    if (saved && ['white-emerald', 'clean-light-emerald', 'forest-mint', 'titanium-neon-green'].includes(saved)) {
      return saved as AppTheme;
    }
    return 'white-emerald'; // Default to White & Emerald
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexify_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentThemeConfig = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

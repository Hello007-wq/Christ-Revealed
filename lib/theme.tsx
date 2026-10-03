import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initLocalDb, run } from '@/lib/local-db';

export type ThemeMode = 'light' | 'dark';

const palette = {
  light: {
    mode: 'light' as ThemeMode,
    background: '#FFFFFF',
    mutedBackground: '#EEF4FF',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FBFF',
    text: '#222222',
    mutedText: '#6F7A8A',
    border: '#D9E6FF',
    primary: '#186BFF',
    accent: '#FF8A02',
    success: '#28A745',
    error: '#DC3545',
    tabBar: '#FFFFFF',
    header: '#186BFF',
    headerText: '#FFFFFF',
  },
  dark: {
    mode: 'dark' as ThemeMode,
    background: '#0B1020',
    mutedBackground: '#121A2B',
    surface: '#172033',
    surfaceAlt: '#1E2940',
    text: '#F8FAFC',
    mutedText: '#A7B4C8',
    border: '#27324A',
    primary: '#6AA1FF',
    accent: '#FFAA47',
    success: '#46C97A',
    error: '#FF7575',
    tabBar: '#141D2F',
    header: '#10192B',
    headerText: '#F8FAFC',
  },
};

type ThemeContextValue = {
  mode: ThemeMode;
  colors: typeof palette.light;
  toggleTheme: () => Promise<void>;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      await initLocalDb();
      await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, ['theme_mode', 'light']);
      setReady(true);
    };
    load().catch(() => setReady(true));
  }, []);

  const toggleTheme = async () => {
    await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, ['theme_mode', 'light']);
  };

  const value = useMemo(
    () => ({
      mode,
      colors: palette[mode],
      toggleTheme,
      ready,
    }),
    [mode, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside ThemeProvider');
  return ctx;
}

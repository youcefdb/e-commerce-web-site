'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled>
        <span className="sr-only">Toggle theme</span>
        <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
      </Button>
    );
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative h-9 w-9 rounded-full transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle theme"
    >
      <Sun className={`h-5 w-5 transition-all duration-300 ${isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
      <Moon className={`absolute h-5 w-5 transition-all duration-300 ${isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

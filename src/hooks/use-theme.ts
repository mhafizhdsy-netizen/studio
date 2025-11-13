
"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { themes, type ThemeName, type Theme } from "@/lib/themes";

const defaultTheme = themes.find(t => t.name === 'default-dark')!;

export function useTheme() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeTheme, setActiveTheme] = useState<Theme>(defaultTheme);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  const preferencesDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'preferences', user.uid);
  }, [firestore, user]);
  
  const { data: preferences, isLoading: isLoadingPreferences } = useDoc<{theme: ThemeName}>(preferencesDocRef);

  useEffect(() => {
    setIsLoadingTheme(isUserLoading || isLoadingPreferences);
  }, [isUserLoading, isLoadingPreferences]);

  useEffect(() => {
    if (!isLoadingTheme) {
        const savedThemeName = preferences?.theme;
        const savedTheme = themes.find(t => t.name === savedThemeName);
        if (savedTheme) {
          applyTheme(savedTheme);
        } else {
          applyTheme(defaultTheme);
        }
    }
  }, [preferences, isLoadingTheme]);
  

  const applyTheme = (theme: Theme) => {
    setActiveTheme(theme);
    const root = document.documentElement;
    Object.entries(theme.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };

  const setTheme = useCallback((themeName: ThemeName) => {
    const newTheme = themes.find(t => t.name === themeName);
    if (newTheme) {
      applyTheme(newTheme);
      if (preferencesDocRef) {
        setDocumentNonBlocking(preferencesDocRef, { theme: themeName }, { merge: true });
      }
    }
  }, [preferencesDocRef]);

  return {
    theme: activeTheme.name,
    setTheme,
    isLoadingTheme,
  };
}

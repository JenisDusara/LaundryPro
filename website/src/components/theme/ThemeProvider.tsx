"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Hydrate from the pre-paint script (see layout.tsx) / system preference.
  useEffect(() => {
    const stored = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(stored);
  }, []);

  const apply = useCallback((next: Theme) => {
    setTheme(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("lp-theme", next);
    } catch {}
  }, []);

  const toggle = useCallback(
    () => apply(theme === "dark" ? "light" : "dark"),
    [theme, apply]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

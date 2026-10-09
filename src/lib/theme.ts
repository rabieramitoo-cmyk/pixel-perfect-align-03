import { useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("tb-theme", next ? "dark" : "light"); } catch {}
  };
  return { dark, toggle };
}

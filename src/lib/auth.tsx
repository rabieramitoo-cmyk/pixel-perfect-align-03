import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { session: Session | null; loading: boolean };
const AuthContext = createContext<AuthState>({ session: null, loading: true });

const IDLE_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ session, loading: false });
    });
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, loading: false }));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Auto-logout after 30 minutes idle
  useEffect(() => {
    if (!state.session) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => supabase.auth.signOut(), IDLE_MS);
    };
    const events = ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [state.session]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

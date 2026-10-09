import { createFileRoute, Navigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Crown, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Backdrop, MagneticButton } from "@/components/tb/primitives";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — The Billionaire" },
      { name: "description", content: "Private access to The Billionaire command center." },
      { property: "og:title", content: "Sign in — The Billionaire" },
      { property: "og:description", content: "Private access to The Billionaire command center." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const { session } = useAuth();
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("owner_exists").then(({ data }) => setOwnerExists(!!data));
  }, []);

  if (session) return <Navigate to="/" />;
  const setup = ownerExists === false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    if (setup) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) setMsg({ kind: "err", text: error.message });
      else if (!data.session) setMsg({ kind: "ok", text: "Check your inbox to confirm your email, then sign in." });
      setOwnerExists(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ kind: "err", text: "Invalid credentials." });
    }
    setBusy(false);
  };

  return (
    <div className="relative grid min-h-screen place-items-center bg-background px-4">
      <Backdrop />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative z-10 w-full max-w-sm rounded-[28px] p-8 shadow-card"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient shadow-glow">
          <Crown className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="mt-5 text-center font-display text-2xl font-semibold">THE <span className="text-gold-gradient">BILLIONAIRE</span></h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{setup ? "Create the owner account" : "Private access only"}</p>

        <label className="mt-7 flex h-12 items-center gap-3 rounded-[14px] border bg-background/40 px-3 focus-within:border-gold">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" className="flex-1 bg-transparent text-sm outline-none" />
        </label>
        <label className="mt-3 flex h-12 items-center gap-3 rounded-[14px] border bg-background/40 px-3 focus-within:border-gold">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete={setup ? "new-password" : "current-password"} className="flex-1 bg-transparent text-sm outline-none" />
        </label>

        {msg && <p className={msg.kind === "err" ? "mt-3 text-sm text-danger" : "mt-3 text-sm text-success"}>{msg.text}</p>}

        <MagneticButton type="submit" disabled={busy || ownerExists === null} className="mt-6 w-full">
          {busy ? "…" : setup ? "Create account" : "Enter"}
        </MagneticButton>
      </motion.form>
    </div>
  );
}

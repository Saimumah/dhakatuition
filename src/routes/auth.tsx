import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Login — Dhaka Tuition Hub" },
      { name: "description", content: "ঢাকা টিউশন হাব staff-দের জন্য secure login।" },
      { property: "og:title", content: "Admin Login — Dhaka Tuition Hub" },
      { property: "og:description", content: "ঢাকা টিউশন হাব staff login।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "setup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await supabase.rpc("claim_ownership");
        await supabase.rpc("log_login");
        navigate({ to: "/admin", replace: true });
      } else if (mode === "setup") {
        const { error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        setMsg("আপনার email-এ একটি verification link পাঠানো হয়েছে। Verify করে login করুন।");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg("Password reset link আপনার email-এ পাঠানো হয়েছে।");
      }
    } catch (e: any) {
      setErr(e?.message ?? "কিছু ভুল হয়েছে");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
          <GraduationCap className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-foreground">
          {mode === "login" ? "Admin Login" : mode === "setup" ? "প্রথমবার Owner সেটআপ" : "Password Reset"}
        </h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input className={inputCls} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== "forgot" && (
            <input className={inputCls} type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
          {err && <p className="text-sm text-destructive">{err}</p>}
          {msg && <p className="text-sm text-primary">{msg}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {busy ? "অপেক্ষা করুন..." : mode === "login" ? "Login" : mode === "setup" ? "Account তৈরি করুন" : "Reset link পাঠান"}
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-1 text-center text-xs text-muted-foreground">
          {mode !== "login" && <button onClick={() => setMode("login")}>Login-এ ফিরে যান</button>}
          {mode === "login" && <button onClick={() => setMode("forgot")}>Password ভুলে গেছেন?</button>}
          {mode === "login" && <button onClick={() => setMode("setup")}>প্রথমবার Owner সেটআপ</button>}
          <Link to="/" className="mt-2">← Website-এ ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
}

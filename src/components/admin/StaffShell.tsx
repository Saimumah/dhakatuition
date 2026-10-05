import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRole, type MyRole } from "@/hooks/use-staff";

export function StaffShell({ children }: { children: (role: NonNullable<MyRole>) => ReactNode }) {
  const { data: me, isLoading } = useMyRole();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">লোড হচ্ছে...</div>;

  if (!me || me.disabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">এই dashboard দেখার অনুমতি আপনার নেই।</p>
          <button onClick={signOut} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </span>
            ঢাকা টিউশন হাব — Dashboard
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {me.role.toUpperCase()}
            </span>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground">Logout</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children(me)}</main>
    </div>
  );
}

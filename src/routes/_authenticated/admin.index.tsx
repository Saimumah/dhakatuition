import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StaffShell } from "@/components/admin/StaffShell";
import { STATUSES, type MyRole } from "@/hooks/use-staff";
import { createStaff, removeStaff, updateStaff } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Dhaka Tuition Hub" },
      { name: "description", content: "Staff dashboard" },
      { property: "og:title", content: "Dashboard — Dhaka Tuition Hub" },
      { property: "og:description", content: "Staff dashboard" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <StaffShell>{(me) => <Dashboard me={me} />}</StaffShell>,
});

type Tab = "apps" | "users" | "logs";

function Dashboard({ me }: { me: NonNullable<MyRole> }) {
  const canUsers = me.role === "owner" || (me.role === "admin" && me.can_manage_moderators);
  const [tab, setTab] = useState<Tab>("apps");
  const tabs: [Tab, string][] = [["apps", "Guardian Applications"]];
  if (canUsers) tabs.push(["users", "User Management"]);
  if (me.role === "owner") tabs.push(["logs", "Activity Log"]);
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === "apps" && <Applications />}
      {tab === "users" && canUsers && <Users me={me} />}
      {tab === "logs" && me.role === "owner" && <Logs />}
    </div>
  );
}

export function StatusSelect({ id, value }: { id: string; value: string }) {
  const qc = useQueryClient();
  return (
    <select value={value}
      onChange={async (e) => {
        const { error } = await supabase.from("guardian_applications").update({ status: e.target.value }).eq("id", id);
        if (error) toast.error(error.message); else { toast.success("Status আপডেট হয়েছে"); qc.invalidateQueries({ queryKey: ["apps"] }); qc.invalidateQueries({ queryKey: ["app", id] }); }
      }}
      className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground">
      {STATUSES.map((s) => <option key={s}>{s}</option>)}
    </select>
  );
}

function Applications() {
  const { data, isLoading } = useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("guardian_applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;
  if (!data?.length) return <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">এখনো কোনো application আসেনি।</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border text-muted-foreground">
          <tr>{["ID", "সময়", "শ্রেণি", "বিষয়", "লিঙ্গ", "লোকেশন", "ফোন", "WhatsApp", "টিউটর", "রিকোয়ারমেন্ট", "Status"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-b border-border/60 align-top text-foreground">
              <td className="px-3 py-2"><Link to="/admin/applications/$id" params={{ id: a.id }} className="font-semibold text-primary underline">#{a.app_number}</Link></td>
              <td className="whitespace-nowrap px-3 py-2">{new Date(a.created_at).toLocaleString("bn-BD")}</td>
              <td className="px-3 py-2">{a.student_class}</td>
              <td className="px-3 py-2">{a.subject}</td>
              <td className="px-3 py-2">{a.student_gender}</td>
              <td className="px-3 py-2">{a.location}</td>
              <td className="px-3 py-2">{a.guardian_phone}</td>
              <td className="px-3 py-2">{a.whatsapp ?? "—"}</td>
              <td className="px-3 py-2">{a.tutor_preference}</td>
              <td className="max-w-[200px] truncate px-3 py-2">{a.requirements ?? "—"}</td>
              <td className="px-3 py-2"><StatusSelect id={a.id} value={a.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Users({ me }: { me: NonNullable<MyRole> }) {
  const qc = useQueryClient();
  const create = useServerFn(createStaff);
  const update = useServerFn(updateStaff);
  const remove = useServerFn(removeStaff);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", role: (me.role === "owner" ? "admin" : "moderator") as "admin" | "moderator" });
  const { data } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const run = async (p: Promise<unknown>, ok: string) => {
    try { await p; toast.success(ok); qc.invalidateQueries({ queryKey: ["staff"] }); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  const isOwner = me.role === "owner";
  return (
    <div className="space-y-4">
      <button onClick={() => setOpen(!open)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        + নতুন Admin/Moderator তৈরি করুন
      </button>
      {open && (
        <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4"
          onSubmit={(e) => { e.preventDefault(); run(create({ data: form }), "Invite পাঠানো হয়েছে").then(() => setOpen(false)); }}>
          <input required placeholder="নাম" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {isOwner && <option value="admin">ADMIN</option>}
            <option value="moderator">MODERATOR</option>
          </select>
          <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">তৈরি করুন</button>
        </form>
      )}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr><th className="px-3 py-2">নাম</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">অবস্থা</th><th className="px-3 py-2">Action</th></tr>
          </thead>
          <tbody>
            {data?.map((u) => {
              const locked = u.role === "owner" || (!isOwner && u.role !== "moderator");
              return (
                <tr key={u.id} className="border-b border-border/60 text-foreground">
                  <td className="px-3 py-2">{u.full_name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    {isOwner && !locked ? (
                      <select value={u.role} onChange={(e) => run(update({ data: { user_id: u.user_id, role: e.target.value as any } }), "Role পরিবর্তন হয়েছে")} className="rounded border border-input bg-background px-2 py-1 text-xs">
                        <option value="admin">ADMIN</option><option value="moderator">MODERATOR</option>
                      </select>
                    ) : <span className="font-semibold">{u.role.toUpperCase()}</span>}
                    {isOwner && u.role === "admin" && (
                      <label className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <input type="checkbox" checked={u.can_manage_moderators} onChange={(e) => run(update({ data: { user_id: u.user_id, can_manage_moderators: e.target.checked } }), "Permission আপডেট হয়েছে")} />
                        Moderator manage
                      </label>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{u.disabled ? "Disabled" : "Active"}</td>
                  <td className="space-x-2 px-3 py-2 text-xs">
                    {locked ? <span className="text-muted-foreground">Protected</span> : (
                      <>
                        <button onClick={() => run(update({ data: { user_id: u.user_id, disabled: !u.disabled } }), "আপডেট হয়েছে")} className="rounded border border-border px-2 py-1">{u.disabled ? "Enable" : "Disable"}</button>
                        <button onClick={() => confirm("নিশ্চিত remove করবেন?") && run(remove({ data: { user_id: u.user_id } }), "Remove হয়েছে")} className="rounded border border-destructive/40 px-2 py-1 text-destructive">Remove</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Logs() {
  const { data } = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      const [logs, mails] = await Promise.all([
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("email_notifications").select("*").neq("status", "sent").order("created_at", { ascending: false }).limit(50),
      ]);
      return { logs: logs.data ?? [], mails: mails.data ?? [] };
    },
  });
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr><th className="px-3 py-2">সময়</th><th className="px-3 py-2">User</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">বিস্তারিত</th></tr>
          </thead>
          <tbody>
            {data?.logs.map((l) => (
              <tr key={l.id} className="border-b border-border/60 text-foreground">
                <td className="whitespace-nowrap px-3 py-2 text-xs">{new Date(l.created_at).toLocaleString("bn-BD")}</td>
                <td className="px-3 py-2">{l.actor_email}</td>
                <td className="px-3 py-2 text-xs">{l.actor_role?.toUpperCase()}</td>
                <td className="px-3 py-2 text-xs font-semibold">{l.action}</td>
                <td className="px-3 py-2 text-xs">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!!data?.mails.length && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-bold text-foreground">পাঠানো যায়নি এমন Email notification ({data.mails.length})</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {data.mails.map((m) => <li key={m.id}>{new Date(m.created_at).toLocaleString("bn-BD")} — {m.error}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

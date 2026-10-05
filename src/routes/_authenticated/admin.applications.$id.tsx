import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StaffShell } from "@/components/admin/StaffShell";
import { StatusSelect } from "./admin.index";

export const Route = createFileRoute("/_authenticated/admin/applications/$id")({
  head: () => ({
    meta: [
      { title: "Application — Dhaka Tuition Hub" },
      { name: "description", content: "Guardian application details" },
      { property: "og:title", content: "Application — Dhaka Tuition Hub" },
      { property: "og:description", content: "Guardian application details" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <StaffShell>{() => <Detail />}</StaffShell>,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: a, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("guardian_applications").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;
  if (!a) return <p className="text-muted-foreground">Application পাওয়া যায়নি।</p>;
  const rows: [string, string][] = [
    ["Application ID", `#${a.app_number}`],
    ["তারিখ ও সময়", new Date(a.created_at).toLocaleString("bn-BD")],
    ["শিক্ষার্থীর শ্রেণি", a.student_class],
    ["বিষয়", a.subject],
    ["শিক্ষার্থীর লিঙ্গ", a.student_gender],
    ["লোকেশন", a.location],
    ["Guardian ফোন", a.guardian_phone],
    ["WhatsApp", a.whatsapp ?? "—"],
    ["পছন্দের টিউটর", a.tutor_preference],
    ["টিউটর রিকোয়ারমেন্ট", a.requirements ?? "—"],
  ];
  return (
    <div className="max-w-2xl">
      <Link to="/admin" className="text-sm text-primary">← সব Applications</Link>
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">
        <dl className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3 py-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="col-span-2 whitespace-pre-wrap text-foreground">{v}</dd>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3 py-2 text-sm">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="col-span-2"><StatusSelect id={a.id} value={a.status} /></dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

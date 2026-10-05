// Owner notification for new guardian applications.
// Every attempt is recorded in email_notifications so failed ones can be retried.
export const OWNER_EMAIL = "saimumah2001@gmail.com";

export async function notifyOwner(applicationId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: log } = await supabaseAdmin
    .from("email_notifications")
    .insert({ application_id: applicationId, recipient: OWNER_EMAIL, status: "pending", attempts: 1 })
    .select("id")
    .single();
  try {
    // Sending is enabled once a sender email domain is configured for the project.
    throw new Error("Email domain not configured yet");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[notifyOwner]", msg);
    if (log) {
      await supabaseAdmin
        .from("email_notifications")
        .update({ status: "failed", error: msg, updated_at: new Date().toISOString() })
        .eq("id", log.id);
    }
  }
}

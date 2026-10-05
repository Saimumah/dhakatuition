import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  student_class: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(1).max(200),
  student_gender: z.string().trim().min(1).max(20),
  location: z.string().trim().min(1).max(200),
  guardian_phone: z.string().trim().min(6).max(20),
  whatsapp: z.string().trim().max(20).optional().default(""),
  tutor_preference: z.string().trim().min(1).max(50),
  requirements: z.string().trim().max(2000).optional().default(""),
});

// Public: anyone can submit. Nobody can read back through this.
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("guardian_applications")
      .insert({ ...data, whatsapp: data.whatsapp || null, requirements: data.requirements || null })
      .select("id, app_number")
      .single();
    if (error || !row) {
      console.error("Application insert failed", error);
      throw new Error("আবেদন জমা দেওয়া যায়নি, আবার চেষ্টা করুন।");
    }
    // Notification must never block a saved application.
    try {
      const { notifyOwner } = await import("./notify.server");
      await notifyOwner(row.id);
    } catch (e) {
      console.error("Owner notification failed", e);
    }
    return { appNumber: row.app_number };
  });

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Caller = { role: "owner" | "admin" | "moderator"; can_manage_moderators: boolean };

async function getCaller(supabase: any): Promise<Caller> {
  const { data, error } = await supabase.rpc("get_my_role");
  const r = Array.isArray(data) ? data[0] : data;
  if (error || !r || r.disabled) throw new Error("Access denied");
  return r as Caller;
}

function canManage(caller: Caller, targetRole: string) {
  if (targetRole === "owner") return false;
  if (caller.role === "owner") return true;
  return caller.role === "admin" && caller.can_manage_moderators && targetRole === "moderator";
}

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(1).max(100),
        email: z.string().trim().email().max(255),
        role: z.enum(["admin", "moderator"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const caller = await getCaller(context.supabase);
    if (!canManage(caller, data.role)) throw new Error("আপনার এই অনুমতি নেই");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const origin = new URL(getRequest().url).origin;
    const { data: inv, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: `${origin}/reset-password`,
      data: { full_name: data.full_name },
    });
    if (error || !inv.user) throw new Error(error?.message ?? "Invite failed");
    const { error: e2 } = await supabaseAdmin.from("user_roles").insert({
      user_id: inv.user.id,
      role: data.role,
      full_name: data.full_name,
      email: data.email,
      created_by: context.userId,
    });
    if (e2) throw new Error(e2.message);
    await supabaseAdmin.rpc("write_log", {
      _actor: context.userId,
      _action: "user_created",
      _details: `${data.email} কে ${data.role.toUpperCase()} হিসেবে তৈরি করা হয়েছে`,
    });
    return { ok: true };
  });

export const updateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        disabled: z.boolean().optional(),
        role: z.enum(["admin", "moderator"]).optional(),
        can_manage_moderators: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const caller = await getCaller(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("user_roles").select("*").eq("user_id", data.user_id).single();
    if (!target) throw new Error("User not found");
    if (target.role === "owner") throw new Error("Owner account পরিবর্তন করা যাবে না");
    if (data.user_id === context.userId) throw new Error("নিজের account পরিবর্তন করা যাবে না");
    if (!canManage(caller, target.role)) throw new Error("আপনার এই অনুমতি নেই");
    if (caller.role !== "owner" && (data.role !== undefined || data.can_manage_moderators !== undefined))
      throw new Error("শুধু Owner role/permission পরিবর্তন করতে পারবে");

    const patch: Record<string, unknown> = {};
    if (data.disabled !== undefined) patch.disabled = data.disabled;
    if (data.role !== undefined) patch.role = data.role;
    if (data.can_manage_moderators !== undefined) patch.can_manage_moderators = data.can_manage_moderators;
    const { error } = await supabaseAdmin.from("user_roles").update(patch).eq("user_id", data.user_id);
    if (error) throw new Error(error.message);

    if (data.disabled !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
        ban_duration: data.disabled ? "876000h" : "none",
      });
    }
    const parts = [
      data.disabled !== undefined ? (data.disabled ? "disabled" : "enabled") : null,
      data.role ? `role → ${data.role.toUpperCase()}` : null,
      data.can_manage_moderators !== undefined ? `manage moderators: ${data.can_manage_moderators}` : null,
    ].filter(Boolean);
    await supabaseAdmin.rpc("write_log", {
      _actor: context.userId,
      _action: data.disabled === true ? "user_disabled" : "user_updated",
      _details: `${target.email}: ${parts.join(", ")}`,
    });
    return { ok: true };
  });

export const removeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const caller = await getCaller(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("user_roles").select("*").eq("user_id", data.user_id).single();
    if (!target) throw new Error("User not found");
    if (target.role === "owner") throw new Error("Owner account remove করা যাবে না");
    if (data.user_id === context.userId) throw new Error("নিজেকে remove করা যাবে না");
    if (!canManage(caller, target.role)) throw new Error("আপনার এই অনুমতি নেই");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    await supabaseAdmin.rpc("write_log", {
      _actor: context.userId,
      _action: "user_removed",
      _details: `${target.email} (${target.role.toUpperCase()}) remove করা হয়েছে`,
    });
    return { ok: true };
  });

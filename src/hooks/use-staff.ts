import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StaffRole = "owner" | "admin" | "moderator";
export type MyRole = { role: StaffRole; disabled: boolean; can_manage_moderators: boolean } | null;

export function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    queryFn: async (): Promise<MyRole> => {
      const { data, error } = await supabase.rpc("get_my_role");
      if (error) throw error;
      const r = Array.isArray(data) ? data[0] : data;
      return (r as MyRole) ?? null;
    },
  });
}

export const STATUSES = [
  "নতুন",
  "যোগাযোগ করা হয়েছে",
  "টিউটর খোঁজা হচ্ছে",
  "টিউটর পাওয়া গেছে",
  "টিউটর নির্বাচন হয়েছে",
  "সম্পন্ন",
  "বাতিল",
];

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
export async function getSupabase() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon-key",
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(v) {
          try {
            v.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}
export function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "service-key",
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
export async function requireUser() {
  const token = (await headers()).get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}

export async function requireCompany() {
  const user = await requireUser();
  if (!user) return null;
  const db = await getSupabase();
  const { data } = await db.from("profiles").select("company_id").eq("id", user.id).single();
  return data?.company_id ? { user, companyId: data.company_id } : null;
}

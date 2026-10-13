import { createServerFn } from "@tanstack/react-start";

// TEMPORARY: one-click owner access. Anyone who opens the login page can use it — remove before going live.
export const quickLogin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (listErr) throw new Error(listErr.message);
  const email = list.users[0]?.email;
  if (!email) throw new Error("No owner account yet");
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw new Error(error.message);
  return { tokenHash: data.properties.hashed_token };
});

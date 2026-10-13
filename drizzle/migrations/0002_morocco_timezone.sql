ALTER TABLE public.tasks ALTER COLUMN task_date SET DEFAULT ((now() AT TIME ZONE 'Africa/Casablanca'))::date;
CREATE OR REPLACE FUNCTION public.sync_auto_tasks()
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  INSERT INTO public.tasks(title, brand_id, ad_account_id, priority, auto_key, task_date, is_demo)
  SELECT 'Renew Spanda plan for ' || a.name, a.brand_id, a.id, 'high',
         'spanda:' || a.id || ':' || a.spanda_expires_at,
         (now() AT TIME ZONE 'Africa/Casablanca')::date, a.is_demo
  FROM public.ad_accounts a
  WHERE a.user_id = auth.uid() AND a.archived = false AND a.status <> 'disabled'
    AND a.spanda_expires_at IS NOT NULL
    AND a.spanda_expires_at <= (now() AT TIME ZONE 'Africa/Casablanca')::date + 7
  ON CONFLICT (user_id, auto_key) WHERE auto_key IS NOT NULL DO NOTHING;
$$;
GRANT EXECUTE ON FUNCTION public.sync_auto_tasks() TO authenticated;
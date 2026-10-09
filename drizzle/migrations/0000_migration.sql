CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  brand text NOT NULL DEFAULT 'General',
  brand_color text NOT NULL DEFAULT 'gold',
  priority text NOT NULL DEFAULT 'medium',
  done boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  task_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Riyadh')::date,
  streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks select" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tasks insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tasks update" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tasks delete" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX tasks_user_date_idx ON public.tasks(user_id, task_date, position);

-- Single owner: block any signup after the first account
CREATE OR REPLACE FUNCTION public.enforce_single_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM auth.users) >= 1 THEN
    RAISE EXCEPTION 'Signups are closed';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enforce_single_owner() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER enforce_single_owner BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_owner();

CREATE OR REPLACE FUNCTION public.owner_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users);
$$;
GRANT EXECUTE ON FUNCTION public.owner_exists() TO anon, authenticated;
-- Core entities
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, color text NOT NULL DEFAULT 'brand-4', notes text,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  display_name text NOT NULL,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.business_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, status text NOT NULL DEFAULT 'active',
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.profile_bm_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  bm_id uuid NOT NULL REFERENCES public.business_managers(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee',
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, bm_id));
CREATE TABLE public.bm_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  bm_a uuid NOT NULL REFERENCES public.business_managers(id) ON DELETE CASCADE,
  bm_b uuid NOT NULL REFERENCES public.business_managers(id) ON DELETE CASCADE,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  bm_id uuid REFERENCES public.business_managers(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  bm_id uuid REFERENCES public.business_managers(id) ON DELETE SET NULL,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  bm_id uuid REFERENCES public.business_managers(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, platform text NOT NULL DEFAULT 'facebook', status text NOT NULL DEFAULT 'active',
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  bm_id uuid REFERENCES public.business_managers(id) ON DELETE SET NULL,
  dataset_id uuid REFERENCES public.datasets(id) ON DELETE SET NULL,
  spanda_expires_at date,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, format text NOT NULL DEFAULT 'video', status text NOT NULL DEFAULT 'active',
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, product text, status text NOT NULL DEFAULT 'active',
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.campaign_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES public.creatives(id) ON DELETE CASCADE,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, creative_id));
CREATE TABLE public.campaign_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  day date NOT NULL, spend numeric(12,2) NOT NULL DEFAULT 0, revenue numeric(12,2) NOT NULL DEFAULT 0,
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, day));
CREATE TABLE public.orders_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  day date NOT NULL, orders integer NOT NULL DEFAULT 0, confirmed integer NOT NULL DEFAULT 0,
  delivered integer NOT NULL DEFAULT 0, returned integer NOT NULL DEFAULT 0,
  revenue numeric(12,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'USD',
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  day date NOT NULL DEFAULT CURRENT_DATE, category text NOT NULL DEFAULT 'tools',
  amount numeric(12,2) NOT NULL DEFAULT 0, name text NOT NULL DEFAULT '',
  is_demo boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  entity_type text NOT NULL, entity_id uuid, action text NOT NULL, label text NOT NULL DEFAULT '',
  changes jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(), currency text NOT NULL DEFAULT 'USD',
  demo_seeded boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());

-- Tasks: link to entities
ALTER TABLE public.tasks
  ADD COLUMN brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  ADD COLUMN campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ADD COLUMN auto_key text,
  ADD COLUMN is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN archived boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX tasks_auto_key_idx ON public.tasks(user_id, auto_key) WHERE auto_key IS NOT NULL;
COMMENT ON COLUMN public.tasks.brand IS 'DEPRECATED: replaced by brand_id';
COMMENT ON COLUMN public.tasks.brand_color IS 'DEPRECATED: brand color comes from brands.color';

CREATE INDEX ON public.campaign_daily(user_id, day);
CREATE INDEX ON public.orders_daily(user_id, day);
CREATE INDEX ON public.expenses(user_id, day);
CREATE INDEX ON public.activity_log(user_id, created_at DESC);
CREATE INDEX ON public.activity_log(entity_id);

-- Grants + RLS (owner-only) on every table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['brands','people','business_managers','profile_bm_roles','bm_partners','pages','datasets','domains','ad_accounts','creatives','campaigns','campaign_creatives','campaign_daily','orders_daily','expenses','activity_log','user_settings'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "owner all" ON public.%I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
  END LOOP;
END $$;

-- Activity log trigger
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb; ch jsonb;
BEGIN
  r := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  IF TG_OP = 'INSERT' AND (r->>'is_demo')::boolean IS TRUE THEN RETURN NULL; END IF;
  IF TG_OP = 'DELETE' AND (r->>'is_demo')::boolean IS TRUE THEN RETURN NULL; END IF;
  IF TG_OP = 'UPDATE' THEN
    SELECT jsonb_object_agg(key, value) INTO ch FROM jsonb_each(to_jsonb(NEW))
      WHERE to_jsonb(OLD)->key IS DISTINCT FROM value AND key NOT IN ('position');
    IF ch IS NULL THEN RETURN NULL; END IF;
  END IF;
  INSERT INTO public.activity_log(user_id, entity_type, entity_id, action, label, changes)
  VALUES ((r->>'user_id')::uuid, TG_TABLE_NAME, (r->>'id')::uuid, lower(TG_OP),
          coalesce(r->>'name', r->>'title', r->>'display_name', r->>'day', ''), ch);
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['brands','people','business_managers','profile_bm_roles','bm_partners','pages','datasets','domains','ad_accounts','creatives','campaigns','orders_daily','expenses','tasks'] LOOP
    EXECUTE format('CREATE TRIGGER log_activity AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_activity()', t);
  END LOOP;
END $$;

-- Realtime
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['brands','people','business_managers','profile_bm_roles','bm_partners','pages','datasets','domains','ad_accounts','creatives','campaigns','campaign_creatives','campaign_daily','orders_daily','expenses','activity_log','user_settings','tasks'] LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
  END LOOP;
END $$;

-- Auto tasks for Spanda renewals (idempotent)
CREATE OR REPLACE FUNCTION public.sync_auto_tasks()
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  INSERT INTO public.tasks(title, brand_id, ad_account_id, priority, auto_key, task_date, is_demo)
  SELECT 'Renew Spanda plan for ' || a.name, a.brand_id, a.id, 'high',
         'spanda:' || a.id || ':' || a.spanda_expires_at,
         (now() AT TIME ZONE 'Asia/Riyadh')::date, a.is_demo
  FROM public.ad_accounts a
  WHERE a.user_id = auth.uid() AND a.archived = false AND a.status <> 'disabled'
    AND a.spanda_expires_at IS NOT NULL
    AND a.spanda_expires_at <= (now() AT TIME ZONE 'Asia/Riyadh')::date + 7
  ON CONFLICT (user_id, auto_key) WHERE auto_key IS NOT NULL DO NOTHING;
$$;
GRANT EXECUTE ON FUNCTION public.sync_auto_tasks() TO authenticated;

-- Clear demo data
CREATE OR REPLACE FUNCTION public.clear_demo_data()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  DELETE FROM public.tasks WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.expenses WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.orders_daily WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.campaign_daily WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.campaign_creatives WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.campaigns WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.creatives WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.ad_accounts WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.domains WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.datasets WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.pages WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.bm_partners WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.profile_bm_roles WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.business_managers WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.people WHERE user_id = auth.uid() AND is_demo;
  DELETE FROM public.brands WHERE user_id = auth.uid() AND is_demo;
END $$;
GRANT EXECUTE ON FUNCTION public.clear_demo_data() TO authenticated;

-- Seed consistent relational demo data for the signed-in owner
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  today date := (now() AT TIME ZONE 'Asia/Riyadh')::date;
  b_oud uuid; b_najd uuid; b_lumi uuid; b_sah uuid;
  p_rab uuid; p_you uuid; p_sar uuid;
  bm1 uuid; bm2 uuid; bm3 uuid;
  ds_oud uuid; ds_najd uuid; ds_lumi uuid;
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid; a6 uuid; a7 uuid; a8 uuid;
  c record; br record; d int; sp numeric; dl int; cf int; od int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  PERFORM public.clear_demo_data();
  PERFORM setseed(0.42);

  INSERT INTO brands(name,color,is_demo) VALUES ('Oud Royale','brand-4',true) RETURNING id INTO b_oud;
  INSERT INTO brands(name,color,is_demo) VALUES ('Najd Home','brand-1',true) RETURNING id INTO b_najd;
  INSERT INTO brands(name,color,is_demo) VALUES ('Lumi Skin','brand-2',true) RETURNING id INTO b_lumi;
  INSERT INTO brands(name,color,is_demo) VALUES ('Sahara Tech','brand-3',true) RETURNING id INTO b_sah;

  INSERT INTO people(display_name,is_demo) VALUES ('Rabie',true) RETURNING id INTO p_rab;
  INSERT INTO people(display_name,is_demo) VALUES ('Youssef',true) RETURNING id INTO p_you;
  INSERT INTO people(display_name,is_demo) VALUES ('Sara',true) RETURNING id INTO p_sar;

  INSERT INTO business_managers(name,status,is_demo) VALUES ('BM Riyadh Main','active',true) RETURNING id INTO bm1;
  INSERT INTO business_managers(name,status,is_demo) VALUES ('BM Jeddah Backup','active',true) RETURNING id INTO bm2;
  INSERT INTO business_managers(name,status,is_demo) VALUES ('BM Agency Gulf','restricted',true) RETURNING id INTO bm3;

  INSERT INTO profile_bm_roles(person_id,bm_id,role,is_demo) VALUES
    (p_rab,bm1,'admin',true),(p_rab,bm2,'admin',true),(p_rab,bm3,'admin',true),
    (p_you,bm1,'employee',true),(p_sar,bm2,'admin',true),(p_sar,bm3,'employee',true);
  INSERT INTO bm_partners(bm_a,bm_b,is_demo) VALUES (bm1,bm3,true),(bm1,bm2,true);

  INSERT INTO datasets(name,bm_id,is_demo) VALUES ('Pixel · Oud Royale',bm1,true) RETURNING id INTO ds_oud;
  INSERT INTO datasets(name,bm_id,is_demo) VALUES ('Pixel · Najd Home',bm1,true) RETURNING id INTO ds_najd;
  INSERT INTO datasets(name,bm_id,is_demo) VALUES ('Pixel · Lumi Skin',bm2,true) RETURNING id INTO ds_lumi;

  INSERT INTO pages(name,bm_id,brand_id,is_demo) VALUES
    ('Oud Royale KSA',bm1,b_oud,true),('Najd Home Store',bm1,b_najd,true),('Lumi Skin Arabia',bm2,b_lumi,true);
  INSERT INTO domains(name,bm_id,brand_id,is_demo) VALUES
    ('oudroyale.sa',bm1,b_oud,true),('najdhome.store',bm1,b_najd,true),('lumiskin.co',bm2,b_lumi,true),('saharatech.shop',null,b_sah,true);

  INSERT INTO ad_accounts(name,platform,status,brand_id,bm_id,dataset_id,spanda_expires_at,is_demo)
    VALUES ('FB · Oud 01','facebook','active',b_oud,bm1,ds_oud,today+3,true) RETURNING id INTO a1;
  INSERT INTO ad_accounts(name,platform,status,brand_id,spanda_expires_at,is_demo)
    VALUES ('TT · Oud 01','tiktok','active',b_oud,today+40,true) RETURNING id INTO a2;
  INSERT INTO ad_accounts(name,platform,status,brand_id,is_demo)
    VALUES ('SC · Najd 01','snapchat','active',b_najd,true) RETURNING id INTO a3;
  INSERT INTO ad_accounts(name,platform,status,brand_id,bm_id,dataset_id,spanda_expires_at,is_demo)
    VALUES ('FB · Najd 01','facebook','restricted',b_najd,bm1,ds_najd,today+20,true) RETURNING id INTO a4;
  INSERT INTO ad_accounts(name,platform,status,brand_id,is_demo)
    VALUES ('TT · Lumi 01','tiktok','active',b_lumi,true) RETURNING id INTO a5;
  INSERT INTO ad_accounts(name,platform,status,brand_id,bm_id,dataset_id,is_demo)
    VALUES ('FB · Lumi 01','facebook','disabled',b_lumi,bm2,ds_lumi,true) RETURNING id INTO a6;
  INSERT INTO ad_accounts(name,platform,status,brand_id,is_demo)
    VALUES ('GA · Sahara 01','google','active',b_sah,true) RETURNING id INTO a7;
  INSERT INTO ad_accounts(name,platform,status,brand_id,spanda_expires_at,is_demo)
    VALUES ('TT · Sahara 01','tiktok','restricted',b_sah,today+6,true) RETURNING id INTO a8;

  INSERT INTO creatives(name,format,brand_id,is_demo) VALUES
    ('Oud unboxing UGC','video',b_oud,true),('Oud gift box static','image',b_oud,true),
    ('Najd living room reel','video',b_najd,true),('Najd before/after','image',b_najd,true),
    ('Lumi 7-day routine','video',b_lumi,true),('Lumi testimonial','video',b_lumi,true),
    ('Sahara gadget demo','video',b_sah,true),('Sahara bundle offer','image',b_sah,true);

  INSERT INTO campaigns(name,product,status,brand_id,ad_account_id,is_demo) VALUES
    ('Oud · Ramadan Gift','Royal Oud 50ml','active',b_oud,a1,true),
    ('Oud · Broad Prospecting','Royal Oud 50ml','active',b_oud,a1,true),
    ('Oud · TikTok Spark','Musk Set','active',b_oud,a2,true),
    ('Najd · Snap Collection','Velvet Cushion Set','active',b_najd,a3,true),
    ('Najd · FB Retarget','Velvet Cushion Set','paused',b_najd,a4,true),
    ('Lumi · TT Routine','Glow Serum','active',b_lumi,a5,true),
    ('Lumi · FB Testimonials','Glow Serum','active',b_lumi,a6,true),
    ('Sahara · Search','Mini Projector','active',b_sah,a7,true),
    ('Sahara · TT Demo','Mini Projector','killed',b_sah,a8,true);

  INSERT INTO campaign_creatives(campaign_id,creative_id,is_demo)
  SELECT ca.id, cr.id, true FROM campaigns ca JOIN creatives cr ON cr.brand_id = ca.brand_id
  WHERE ca.user_id = uid AND ca.is_demo AND cr.is_demo;

  FOR c IN SELECT id, status FROM campaigns WHERE user_id = uid AND is_demo LOOP
    FOR d IN 0..89 LOOP
      sp := round((60 + random()*220)::numeric, 2);
      INSERT INTO campaign_daily(campaign_id,day,spend,revenue,is_demo)
      VALUES (c.id, today - d, sp, round(sp*(1.1 + random()*2.0),2), true);
    END LOOP;
  END LOOP;

  FOR br IN SELECT id FROM brands WHERE user_id = uid AND is_demo LOOP
    FOR d IN 0..89 LOOP
      od := 25 + floor(random()*60)::int;
      cf := floor(od*(0.6 + random()*0.25))::int;
      dl := floor(cf*(0.72 + random()*0.2))::int;
      INSERT INTO orders_daily(brand_id,day,orders,confirmed,delivered,returned,revenue,currency,is_demo)
      VALUES (br.id, today - d, od, cf, dl, floor(cf*random()*0.12)::int, round((dl*(32 + random()*14))::numeric,2), 'USD', true);
      INSERT INTO expenses(brand_id,day,category,amount,name,is_demo) VALUES
        (br.id, today - d, 'product_cost', round((dl*(7+random()*3))::numeric,2), 'Product cost', true),
        (br.id, today - d, 'shipping', round((dl*(3.5+random()*1.5))::numeric,2), 'COD shipping', true);
    END LOOP;
  END LOOP;

  INSERT INTO expenses(brand_id,ad_account_id,day,category,amount,name,is_demo)
  SELECT a.brand_id, a.id, today - m*30, 'subscription', 29, 'Spanda plan', true
  FROM ad_accounts a, generate_series(0,2) m WHERE a.user_id = uid AND a.is_demo AND a.spanda_expires_at IS NOT NULL;
  INSERT INTO expenses(day,category,amount,name,is_demo)
  SELECT today - m*30, 'tools', 39, 'Shopify plan', true FROM generate_series(0,2) m;

  INSERT INTO tasks(title,brand_id,ad_account_id,campaign_id,priority,position,task_date,is_demo)
  SELECT v.t, v.b, v.a, v.c, v.p, v.pos, today, true FROM (VALUES
    ('Check overnight COD confirmations', b_oud, null::uuid, null::uuid, 'high', 0),
    ('Kill campaigns under 1.5 ROAS', b_lumi, a5, null::uuid, 'high', 1),
    ('Launch 3 new TikTok creatives', b_najd, null::uuid, null::uuid, 'medium', 2),
    ('Appeal FB · Najd 01 restriction', b_najd, a4, null::uuid, 'high', 3),
    ('Reconcile courier remittance', b_oud, null::uuid, null::uuid, 'medium', 4),
    ('Reply to supplier on restock', b_sah, null::uuid, null::uuid, 'low', 5)
  ) AS v(t,b,a,c,p,pos);

  INSERT INTO user_settings(user_id, demo_seeded) VALUES (uid, true)
  ON CONFLICT (user_id) DO UPDATE SET demo_seeded = true, updated_at = now();
END $$;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
CREATE TYPE public.app_role AS ENUM ('owner','admin','moderator');

CREATE OR REPLACE FUNCTION public.configured_owner_email() RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$ SELECT 'saimumah2001@gmail.com'::text $$;

-- Staff roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  full_name text,
  email text,
  disabled boolean NOT NULL DEFAULT false,
  can_manage_moderators boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_owner_only ON public.user_roles ((role)) WHERE role = 'owner';
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role AND NOT disabled)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND NOT disabled)
$$;
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS TABLE(role public.app_role, disabled boolean, can_manage_moderators boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role, disabled, can_manage_moderators FROM public.user_roles WHERE user_id = auth.uid()
$$;

CREATE POLICY "staff see self, owner/admin see all" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
-- No insert/update/delete policies: all changes go through verified server code; triggers below are a second wall.

CREATE OR REPLACE FUNCTION public.protect_owner_role() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' THEN RAISE EXCEPTION 'Owner account cannot be removed'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'owner' AND (NEW.role <> 'owner' OR NEW.disabled OR NEW.user_id <> OLD.user_id) THEN
      RAISE EXCEPTION 'Owner account cannot be demoted, disabled or replaced';
    END IF;
    IF OLD.role <> 'owner' AND NEW.role = 'owner' THEN
      RAISE EXCEPTION 'Nobody can be promoted to owner';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.role = 'owner' THEN
    IF current_setting('app.claiming_owner', true) IS DISTINCT FROM 'yes' THEN
      RAISE EXCEPTION 'Owner can only be set by the first-time setup';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER protect_owner BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_owner_role();

-- Activity log
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads logs" ON public.activity_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner'));

CREATE OR REPLACE FUNCTION public.write_log(_actor uuid, _action text, _details text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT role::text AS role, email INTO r FROM public.user_roles WHERE user_id = _actor;
  INSERT INTO public.activity_logs(actor_id, actor_email, actor_role, action, details)
  VALUES (_actor, COALESCE(r.email, (SELECT email FROM auth.users WHERE id=_actor)), r.role, _action, _details);
END $$;
REVOKE EXECUTE ON FUNCTION public.write_log(uuid,text,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_login() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RETURN; END IF;
  PERFORM public.write_log(auth.uid(), 'login', 'Signed in to dashboard');
END $$;

-- First-time owner claim: only the configured owner email, only if no owner exists, email must be verified
CREATE OR REPLACE FUNCTION public.claim_ownership() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u record;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role='owner') THEN RETURN false; END IF;
  SELECT id, email, email_confirmed_at INTO u FROM auth.users WHERE id = auth.uid();
  IF lower(u.email) <> lower(public.configured_owner_email()) OR u.email_confirmed_at IS NULL THEN RETURN false; END IF;
  PERFORM set_config('app.claiming_owner','yes', true);
  INSERT INTO public.user_roles(user_id, role, email, full_name) VALUES (u.id, 'owner', u.email, 'Owner')
  ON CONFLICT (user_id) DO NOTHING;
  PERFORM set_config('app.claiming_owner','no', true);
  PERFORM public.write_log(u.id, 'owner_setup', 'Permanent owner account created');
  RETURN true;
END $$;

-- Guardian applications
CREATE TABLE public.guardian_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  student_class text NOT NULL,
  subject text NOT NULL,
  student_gender text NOT NULL,
  location text NOT NULL,
  guardian_phone text NOT NULL,
  whatsapp text,
  tutor_preference text NOT NULL,
  requirements text,
  status text NOT NULL DEFAULT 'নতুন' CHECK (status IN ('নতুন','যোগাযোগ করা হয়েছে','টিউটর খোঁজা হচ্ছে','টিউটর পাওয়া গেছে','টিউটর নির্বাচন হয়েছে','সম্পন্ন','বাতিল')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.guardian_applications TO authenticated;
GRANT ALL ON public.guardian_applications TO service_role;
ALTER TABLE public.guardian_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read applications" ON public.guardian_applications FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));
CREATE POLICY "staff update applications" ON public.guardian_applications FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_application_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- staff may only change status
  IF auth.uid() IS NOT NULL AND (NEW.student_class, NEW.subject, NEW.student_gender, NEW.location, NEW.guardian_phone, NEW.whatsapp, NEW.tutor_preference, NEW.requirements, NEW.created_at)
     IS DISTINCT FROM (OLD.student_class, OLD.subject, OLD.student_gender, OLD.location, OLD.guardian_phone, OLD.whatsapp, OLD.tutor_preference, OLD.requirements, OLD.created_at) THEN
    RAISE EXCEPTION 'Only status can be changed';
  END IF;
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.write_log(auth.uid(), 'status_change', 'Application #' || OLD.app_number || ': ' || OLD.status || ' → ' || NEW.status);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_application BEFORE UPDATE ON public.guardian_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_application_update();

-- Email notification log (for retry)
CREATE TABLE public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.guardian_applications(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error text,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_notifications TO authenticated;
GRANT ALL ON public.email_notifications TO service_role;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads notifications" ON public.email_notifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner'));
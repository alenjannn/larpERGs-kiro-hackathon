-- TULOY Health: apply Spec 04 (BHW workspace) to an existing database.
-- Paste into Supabase Dashboard -> SQL Editor -> Run. Safe to run twice.
-- Requires supabase/apply_foundation.sql (Spec 01) to have been applied.
-- Same statements as supabase/migrations/20240101000400_help_request_acknowledged_at.sql.
--
-- What it does: when a BHW acknowledges a help request, acknowledged_at is set
-- to the server's time (not the phone's), and a repeat acknowledge keeps the
-- first time. Without this script the app still works and stores the phone's time.

DO $$
BEGIN
  IF to_regclass('public.help_requests') IS NULL THEN
    RAISE EXCEPTION 'help_requests is missing. Run supabase/apply_foundation.sql first.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.help_request_before_update_ack()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.coordination_status = 'acknowledged' AND OLD.coordination_status IS DISTINCT FROM 'acknowledged' THEN
      NEW.acknowledged_at := now();
    ELSIF NEW.coordination_status = 'acknowledged' AND OLD.coordination_status = 'acknowledged' THEN
      -- Idempotent: a repeat acknowledge keeps the first time.
      NEW.acknowledged_at := OLD.acknowledged_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_30_help_request_acknowledged_at ON public.help_requests;
CREATE TRIGGER tg_30_help_request_acknowledged_at
  BEFORE UPDATE ON public.help_requests
  FOR EACH ROW EXECUTE FUNCTION public.help_request_before_update_ack();

NOTIFY pgrst, 'reload schema';

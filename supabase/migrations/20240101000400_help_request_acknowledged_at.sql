-- TULOY Health: BHW acknowledges a help request (Spec 04, B-1.7 / B-1.8)
--
-- When a client (anon/authenticated) moves a help request INTO 'acknowledged',
-- acknowledged_at is set to the server's time, so the stored time never depends
-- on the BHW's phone clock. Re-acknowledging an already acknowledged row does
-- not change it. The SQL Editor and reset_demo_data() (table owner) are not
-- affected, so seed rows keep their fixed values.
--
-- Additive and re-runnable: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.
-- Assigning requests is Spec 05 and is not touched here.

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

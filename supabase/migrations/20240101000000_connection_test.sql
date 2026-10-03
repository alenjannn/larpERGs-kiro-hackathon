-- TULOY Health: connection test table (Task 2)
-- Proves every role (patient | bhw | admin) can read/write the shared backend.

CREATE TABLE IF NOT EXISTS public.connection_test (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message     TEXT NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('patient', 'bhw', 'admin', 'system')),
  -- Set for rows created offline by a BHW, so retried syncs never duplicate them.
  local_id    TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS must be enabled; permissive policy is acceptable for the hackathon demo only.
ALTER TABLE public.connection_test ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for hackathon" ON public.connection_test;
CREATE POLICY "Allow all for hackathon"
  ON public.connection_test
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.connection_test TO anon, authenticated;

INSERT INTO public.connection_test (message, client_type)
SELECT * FROM (VALUES
  ('Initial system test', 'system'),
  ('Hackathon demo ready', 'system')
) AS seed(message, client_type)
WHERE NOT EXISTS (SELECT 1 FROM public.connection_test WHERE client_type = 'system');

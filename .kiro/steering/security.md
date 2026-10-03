# Security & Database Rules

## Database Security & RLS Policy
- **Row Level Security (RLS)** is **DISABLED** on Supabase for the duration of this 12-hour hackathon.
- Do NOT write complex SQL RLS policies unless explicitly instructed.
- All client read/write queries use the Supabase `anon` key.

## Key Management
- Never expose Supabase `service_role` keys inside client code or commit them to Git.
- Ensure `.env` is present in `.gitignore` at both root and workspace levels.
- Commit `.env.example` with placeholder keys only.

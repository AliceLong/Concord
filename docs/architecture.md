# Concord MVP Architecture

## Core flow
1. Open app into elders list (`/elders`).
2. Pick elder and check profile + timeline.
3. Care worker records/upload audio.
4. Server transcribes audio (Cantonese supported by `language=yue`).
5. Server converts transcript into fixed schema report + readable report text.
6. Report and timeline event are persisted in Postgres.
7. CRM list/detail pages can query, filter and export (export pending in next iteration).

## Components
- `src/app`: Next.js App Router pages and API route handlers.
- `src/server/services`: workflow orchestration and report generation.
- `src/server/repositories`: data access for Supabase/Postgres.
- `supabase/migrations`: SQL schema and seed data.

## Runtime model
- Frontend + Backend API deployed on Vercel.
- Database + object storage on Supabase Cloud free tier.
- Speech-to-text via OpenAI called only from server-side route handlers.

## Security baseline
- `x-org-pin` request header / `orgPin` payload gate at API.
- No frontend direct access to OpenAI key.
- Supabase service role key only on server environment.

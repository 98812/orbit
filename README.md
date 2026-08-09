# Orbit

Private site for the friend group: profiles, group chat, and Snaps with reactions.

## Setup

1. `npm install`
2. Create a project at supabase.com, then run `supabase/schema.sql` in its SQL editor.
3. In Supabase Storage, create a public bucket named `snaps`.
4. In Supabase Auth > Providers, enable Google and paste in your Google OAuth Client ID/Secret
   (create these at console.cloud.google.com — Web application type, redirect URI is your
   Supabase project's `.../auth/v1/callback`).
5. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL + anon key
   (Project Settings > API in Supabase).
6. `npm run dev` to test locally, then push to GitHub and import into Vercel — add the
   same two env vars there and it deploys with HTTPS automatically.

## Structure

- `app/page.tsx` — landing page
- `app/profile/` — edit goal, mission, qualification, talent, bio, contact info
- `app/chat/` — realtime group chat
- `app/snaps/` — upload Snaps, react with emoji
- `supabase/schema.sql` — full database schema + row-level security policies

The landing page design (colors, animation, copy) mirrors `orbit-landing.html` from earlier —
copy its hero/nav markup into `app/page.tsx` and adjust the Google button to use
`components/GoogleSignInButton.tsx`.

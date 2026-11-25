# Winter Capsule

A New Year time-capsule and "Who Am I?" guessing game built with Next.js and Supabase. Friends drop clue cards and notes into your box before January 1, and you guess who sent each card once the capsule unlocks.

## Tech Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS, Framer Motion
- Supabase (PostgreSQL + Storage)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_PHOTO_BUCKET=capsule-photos
   ```

3. Ensure the `avatar_id` columns exist in Supabase:
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_id TEXT;
   ALTER TABLE entries ADD COLUMN IF NOT EXISTS avatar_id TEXT;
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

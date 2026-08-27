# Yorozuya Backend (`yorozuya_be`)

Express.js + TypeScript + Supabase backend API for **Streak Booth** (Halfsies — Couple's Photo Booth PWA).

---

## Architecture & Codebase Layers

Following a clean layered architecture:
```
src/
├── config/         # Environment schema, Supabase client singleton, constants
├── types/          # TypeScript interfaces (DB schemas, API DTOs, domain models)
├── utils/          # Standard response formatters, AppError classes, date/time calculations, pairing tokens
├── middleware/     # JWT authentication, global error handling, file upload, rate limiting, request logging
├── repositories/   # Supabase DB & Storage access layer
├── services/       # Core business logic (pairing exclusivity, theme lock, blind mask, streaks, habits)
├── controllers/    # Express controllers (Zod schema validation, invoking services, returning responses)
├── routes/         # Express routers (mounted under /api/v1)
├── app.ts          # Express application setup
└── server.ts       # Server listener
```

---

## Standard Response Format

All responses follow the unified standard expected by `streak_booth/src/api/client.ts`:

### Success Response
```json
{
  "status": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

## Supabase Database Setup

1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the SQL script located in [`supabase/schema.sql`](supabase/schema.sql).
3. The script creates:
   - `profiles` table
   - `couples` table with strict **1-to-1 active partner exclusivity**
   - `pair_invites` table for 5-char token generation (`7QK42`)
   - `daily_rolls` table for film rolls and themes
   - `exposures` table for 4 daily half-frame slots
   - `zine_strips` table for favorited zine strips
   - Storage buckets: `exposure-photos` and `avatars`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start in development mode with live reload
npm run dev

# Check TypeScript types
npm run typecheck

# Build for production
npm run build

# Start production build
npm start
```

---

## API Endpoints

### 1. Health Check
- `GET /health-check` — Server status

### 2. Auth & Profiles (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register a new user (`email`, `password`, `display_name`, `timezone`)
- `POST /api/v1/auth/login` — Login (`email`, `password`) -> returns JWT token
- `GET /api/v1/auth/me` *(Auth)* — Current user summary, seat assignment (A or B), active couple ID
- `PUT /api/v1/auth/profile` *(Auth)* — Update display name, avatar, or timezone

### 3. Pairing & Couples (`/api/v1/pair`)
- `POST /api/v1/pair/invite` *(Auth)* — Generate 5-char invite code (e.g. `7QK42`, 15-min expiry)
- `POST /api/v1/pair/join` *(Auth)* — Accept invite code (`{ "code": "7QK42" }`)
- `GET /api/v1/pair/status` *(Auth)* — Couple status, partner profile, streak count, timezone difference
- `POST /api/v1/pair/disconnect` *(Auth)* — Unpair from active partner

### 4. In The Booth / Today (`/api/v1/booth`)
- `GET /api/v1/booth/today` *(Auth)* — Today's roll state, active slot (0: Morning, 1: Noon, 2: Evening, 3: Night), exposure slots with **blind developing mask** (partner photo hidden until both take shot)
- `POST /api/v1/booth/theme` *(Auth)* — Set roll Look (`Sepia`, `Silver`, `Kodachrome`, `Bleach`), Paper (`Blush`, `Butter`, `Mint`, `Classic`), Stickers (`Love`, `Cosmos`, `Garden`, `Mixed`)
- `POST /api/v1/booth/exposure/:slotIndex/shoot` *(Auth, multipart/form-data)* — Upload half photo (`photo` file field)
- `GET /api/v1/booth/strip` *(Auth)* — Dispensed strip once all 4 exposures are taken

### 5. The Drawer & Archive (`/api/v1/archive`)
- `GET /api/v1/archive/drawer?year=2026&month=8` *(Auth)* — Monthly calendar grid with complete/half/missed days and print run progress
- `GET /api/v1/archive/strip/:rollId` *(Auth)* — Specific strip details
- `POST /api/v1/archive/strip/:rollId/zine` *(Auth)* — Toggle save to zine collection

### 6. Us & Relationship Stats (`/api/v1/stats`)
- `GET /api/v1/stats/us` *(Auth)* — Current streak, frames together, first responder %, timezone offset, 7-day weekly activity bars, exposure habits breakdown

---

## Wiring with Frontend (`streak_booth`)

In `/Users/user/Documents/Akmal workspace/streak_booth/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

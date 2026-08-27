-- ============================================================================
-- YOROZUYA_BE / STREAK_BOOTH SUPABASE SCHEMA
-- Database: PostgreSQL (Supabase)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. COUPLES TABLE
-- 1-to-1 partnership between User A (Seat A) and User B (Seat B).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nickname VARCHAR(100),
    anniversary_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disconnected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_different_users CHECK (user_a_id <> user_b_id)
);

-- Partial Unique Indexes enforcing strict 1-to-1 active partnership
CREATE UNIQUE INDEX IF NOT EXISTS idx_couples_active_user_a
ON public.couples (user_a_id)
WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_couples_active_user_b
ON public.couples (user_b_id)
WHERE status = 'active' AND user_b_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. PAIR INVITES TABLE
-- Temporary 5-character token (e.g. "7QK42") for pairing partner.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pair_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code VARCHAR(10) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pair_invites_code ON public.pair_invites(code);

-- ----------------------------------------------------------------------------
-- 4. DAILY ROLLS TABLE
-- Represents a single day's photobooth film roll for a couple.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_rolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    roll_date DATE NOT NULL,
    roll_number INT NOT NULL DEFAULT 1,
    look VARCHAR(50) NOT NULL DEFAULT 'Sepia',       -- 'Sepia' | 'Silver' | 'Kodachrome' | 'Bleach'
    paper VARCHAR(50) NOT NULL DEFAULT 'Blush',      -- 'Blush' | 'Butter' | 'Mint' | 'Classic'
    sticker_set VARCHAR(50) NOT NULL DEFAULT 'Love', -- 'Love' | 'Cosmos' | 'Garden' | 'Mixed'
    first_shot_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_dispensed BOOLEAN DEFAULT FALSE,
    is_kept_for_zine BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_couple_roll_date UNIQUE (couple_id, roll_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_rolls_couple_date ON public.daily_rolls(couple_id, roll_date);

-- ----------------------------------------------------------------------------
-- 5. EXPOSURES TABLE
-- 4 frames per daily roll: 0: Morning, 1: Noon, 2: Evening, 3: Night
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exposures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roll_id UUID NOT NULL REFERENCES public.daily_rolls(id) ON DELETE CASCADE,
    slot_index SMALLINT NOT NULL CHECK (slot_index BETWEEN 0 AND 3),
    user_a_photo_url TEXT,
    user_a_captured_at TIMESTAMPTZ,
    user_b_photo_url TEXT,
    user_b_captured_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'half', 'completed', 'missed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_roll_slot UNIQUE (roll_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_exposures_roll_id ON public.exposures(roll_id);

-- ----------------------------------------------------------------------------
-- 6. ZINE STRIPS TABLE
-- Strips favorited / kept for the physical/digital zine drawer.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zine_strips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    roll_id UUID NOT NULL REFERENCES public.daily_rolls(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_couple_zine_roll UNIQUE (couple_id, roll_id)
);

-- ----------------------------------------------------------------------------
-- 7. TRIGGER: AUTO-UPDATE updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_couples_updated_at ON public.couples;
CREATE TRIGGER trg_couples_updated_at
BEFORE UPDATE ON public.couples
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_daily_rolls_updated_at ON public.daily_rolls;
CREATE TRIGGER trg_daily_rolls_updated_at
BEFORE UPDATE ON public.daily_rolls
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_exposures_updated_at ON public.exposures;
CREATE TRIGGER trg_exposures_updated_at
BEFORE UPDATE ON public.exposures
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 8. STORAGE BUCKETS (Run in Supabase dashboard or via API)
-- Bucket: 'exposure-photos' (public read or authenticated read)
-- Bucket: 'avatars' (public read)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('exposure-photos', 'exposure-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

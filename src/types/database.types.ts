export interface ProfileRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CoupleRow {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
  nickname: string | null;
  anniversary_date: string;
  status: "active" | "disconnected";
  created_at: string;
  updated_at: string;
}

export interface PairInviteRow {
  id: string;
  creator_user_id: string;
  code: string;
  expires_at: string;
  is_claimed: boolean;
  claimed_by_user_id: string | null;
  created_at: string;
}

export interface DailyRollRow {
  id: string;
  couple_id: string;
  roll_date: string;
  roll_number: number;
  look: string;
  paper: string;
  sticker_set: string;
  first_shot_user_id: string | null;
  is_dispensed: boolean;
  is_kept_for_zine: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExposureRow {
  id: string;
  roll_id: string;
  slot_index: number;
  user_a_photo_url: string | null;
  user_a_captured_at: string | null;
  user_b_photo_url: string | null;
  user_b_captured_at: string | null;
  status: "empty" | "half" | "completed" | "missed";
  created_at: string;
  updated_at: string;
}

export interface ZineStripRow {
  id: string;
  couple_id: string;
  roll_id: string;
  note: string | null;
  created_at: string;
}

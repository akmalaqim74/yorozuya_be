import { ValidLook, ValidPaper, ValidStickerSet } from "../config/constants";

export type SeatPosition = "A" | "B";

export interface UserProfileSummary {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  seat: SeatPosition | null;
  couple_id: string | null;
}

export interface PartnerSummary {
  id: string;
  display_name: string;
  avatar_url: string | null;
  timezone: string;
  seat: SeatPosition;
  timezone_offset_hours: number;
}

export interface CoupleSummary {
  id: string;
  nickname: string | null;
  anniversary_date: string;
  user_a: UserProfileSummary;
  user_b: UserProfileSummary | null;
  streak_days: number;
  status: "active" | "disconnected";
}

export interface ExposureSlotDetail {
  slot_index: number;
  label: string;
  window: string;
  is_open_now: boolean;
  closes_in: string;
  my_photo_url: string | null;
  has_my_photo: boolean;
  my_captured_at: string | null;
  partner_photo_url: string | null; // Masked until both submit
  has_partner_photo: boolean;
  partner_captured_at: string | null;
  is_completed: boolean;
  is_live: boolean;
  is_missed: boolean;
  can_shoot_together: boolean;
}

export interface TogetherInviteState {
  id: string;
  slot_index: number;
  invited_by_user_id: string;
  is_mine_to_respond: boolean;
  status: "pending" | "accepted";
  expires_at: string;
}

export interface TodayRollState {
  roll_id: string;
  roll_date: string;
  roll_number: number;
  streak_days: number;
  look: ValidLook;
  paper: ValidPaper;
  sticker_set: ValidStickerSet;
  first_shot_user_id: string | null;
  can_customize_theme: boolean;
  is_dispensed: boolean;
  active_slot_index: number;
  exposures: ExposureSlotDetail[];
  partner_info: PartnerSummary | null;
  cta_label: string;
  cta_hint: string;
  together_invite: TogetherInviteState | null;
}

export interface ArchiveDayFrame {
  slot_index: number;
  label: string;
  user_a_photo_url: string | null;
  user_b_photo_url: string | null;
}

export interface ArchiveDayItem {
  date: string;
  day_number: number;
  roll_id: string | null;
  roll_number: number | null;
  status: "complete" | "half" | "missed" | "empty";
  completed_frames_count: number;
  look: ValidLook | null;
  paper: ValidPaper | null;
  sticker_set: ValidStickerSet | null;
  is_kept_for_zine: boolean;
  thumbnail_url: string | null;
  frames: ArchiveDayFrame[];
}

export interface ArchiveMonthOverview {
  year: number;
  month: number;
  total_complete: number;
  total_half: number;
  total_missed: number;
  print_run_target: number;
  print_run_current: number;
  days: ArchiveDayItem[];
}

export interface RelationshipStats {
  streak_days: number;
  frames_together: number;
  first_response_rate_percent: number;
  timezone_gap_hours: number;
  zine_strips_count: number;
  week_bars: Array<{ day: string; count: number; is_active: boolean }>;
  exposure_habits: Array<{ label: string; count: number; percentage: number }>;
}

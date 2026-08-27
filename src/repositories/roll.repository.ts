import supabaseAdmin from "../config/supabase";
import { DailyRollRow } from "../types/database.types";
import { throwServerError } from "../utils/error.util";

export const findRollByCoupleAndDate = async (
  coupleId: string,
  rollDate: string
): Promise<DailyRollRow | null> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .select("*")
    .eq("couple_id", coupleId)
    .eq("roll_date", rollDate)
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching daily roll: ${error.message}`);
  }

  return data as DailyRollRow | null;
};

export const findRollById = async (rollId: string): Promise<DailyRollRow | null> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .select("*")
    .eq("id", rollId)
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching roll by ID: ${error.message}`);
  }

  return data as DailyRollRow | null;
};

export const getLatestRoll = async (coupleId: string): Promise<DailyRollRow | null> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .select("*")
    .eq("couple_id", coupleId)
    .order("roll_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching latest roll: ${error.message}`);
  }

  return data as DailyRollRow | null;
};

export const createDailyRoll = async (roll: {
  couple_id: string;
  roll_date: string;
  roll_number: number;
  look?: string;
  paper?: string;
  sticker_set?: string;
}): Promise<DailyRollRow> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .insert([
      {
        couple_id: roll.couple_id,
        roll_date: roll.roll_date,
        roll_number: roll.roll_number,
        look: roll.look || "Sepia",
        paper: roll.paper || "Blush",
        sticker_set: roll.sticker_set || "Love",
      },
    ])
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to create daily roll: ${error.message}`);
  }

  return data as DailyRollRow;
};

export const updateDailyRoll = async (
  rollId: string,
  updates: Partial<Pick<DailyRollRow, "look" | "paper" | "sticker_set" | "first_shot_user_id" | "is_dispensed" | "is_kept_for_zine">>
): Promise<DailyRollRow> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .update(updates)
    .eq("id", rollId)
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to update daily roll: ${error.message}`);
  }

  return data as DailyRollRow;
};

export const countConsecutiveStreakDays = async (coupleId: string): Promise<number> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .select("roll_date, is_dispensed")
    .eq("couple_id", coupleId)
    .order("roll_date", { ascending: false });

  if (error) {
    throwServerError(`Database error calculating streak: ${error.message}`);
  }

  if (!data || data.length === 0) return 0;

  let streak = 0;
  for (const row of data) {
    // If roll was dispensed (all 4 exposures taken) or current day
    if (row.is_dispensed) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

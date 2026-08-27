import supabaseAdmin from "../config/supabase";
import { DailyRollRow, ExposureRow } from "../types/database.types";
import { throwServerError } from "../utils/error.util";

export interface RollWithExposures extends DailyRollRow {
  exposures: ExposureRow[];
}

export const findRollsInMonth = async (
  coupleId: string,
  startDate: string,
  endDate: string
): Promise<RollWithExposures[]> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .select(`
      *,
      exposures(*)
    `)
    .eq("couple_id", coupleId)
    .gte("roll_date", startDate)
    .lte("roll_date", endDate)
    .order("roll_date", { ascending: true });

  if (error) {
    throwServerError(`Database error fetching monthly archive: ${error.message}`);
  }

  return (data || []) as RollWithExposures[];
};

export const findRollWithExposuresById = async (
  rollId: string
): Promise<RollWithExposures | null> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .select(`
      *,
      exposures(*)
    `)
    .eq("id", rollId)
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching roll strip: ${error.message}`);
  }

  return data as RollWithExposures | null;
};

export const setZineStatus = async (
  coupleId: string,
  rollId: string,
  isKeptForZine: boolean,
  note?: string
): Promise<void> => {
  // Update roll flag
  const { error: rollError } = await supabaseAdmin
    .from("daily_rolls")
    .update({ is_kept_for_zine: isKeptForZine })
    .eq("id", rollId);

  if (rollError) {
    throwServerError(`Failed to update zine status on roll: ${rollError.message}`);
  }

  if (isKeptForZine) {
    const { error: zineError } = await supabaseAdmin
      .from("zine_strips")
      .upsert([
        {
          couple_id: coupleId,
          roll_id: rollId,
          note: note || null,
        },
      ]);

    if (zineError) {
      throwServerError(`Failed to add strip to zine collection: ${zineError.message}`);
    }
  } else {
    await supabaseAdmin
      .from("zine_strips")
      .delete()
      .eq("couple_id", coupleId)
      .eq("roll_id", rollId);
  }
};

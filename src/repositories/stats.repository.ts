import supabaseAdmin from "../config/supabase";
import { throwServerError } from "../utils/error.util";

export const getFramesTogetherCount = async (coupleId: string): Promise<number> => {
  // Count exposures where both user A and user B completed their shot
  const { count, error } = await supabaseAdmin
    .from("exposures")
    .select("id, daily_rolls!inner(couple_id)", { count: "exact", head: true })
    .eq("daily_rolls.couple_id", coupleId)
    .eq("status", "completed");

  if (error) {
    throwServerError(`Database error counting completed frames: ${error.message}`);
  }

  return count || 0;
};

export const getFirstShotStats = async (
  coupleId: string,
  userId: string
): Promise<{ userFirstCount: number; totalFirstRecorded: number }> => {
  const { data, error } = await supabaseAdmin
    .from("daily_rolls")
    .select("first_shot_user_id")
    .eq("couple_id", coupleId)
    .not("first_shot_user_id", "is", null);

  if (error) {
    throwServerError(`Database error calculating first responder rate: ${error.message}`);
  }

  const list = data || [];
  const userFirstCount = list.filter((r) => r.first_shot_user_id === userId).length;
  return {
    userFirstCount,
    totalFirstRecorded: list.length,
  };
};

export const getSlotHabits = async (
  coupleId: string
): Promise<Array<{ slot_index: number; completed_count: number; total_recorded: number }>> => {
  const { data, error } = await supabaseAdmin
    .from("exposures")
    .select("slot_index, status, daily_rolls!inner(couple_id)")
    .eq("daily_rolls.couple_id", coupleId);

  if (error) {
    throwServerError(`Database error calculating habit stats: ${error.message}`);
  }

  const list = data || [];
  const habits = [0, 1, 2, 3].map((slotIdx) => {
    const slotItems = list.filter((item) => item.slot_index === slotIdx);
    const completed = slotItems.filter((item) => item.status === "completed").length;
    return {
      slot_index: slotIdx,
      completed_count: completed,
      total_recorded: slotItems.length || 1, // Avoid div by zero
    };
  });

  return habits;
};

export const countZineStrips = async (coupleId: string): Promise<number> => {
  const { count, error } = await supabaseAdmin
    .from("zine_strips")
    .select("id", { count: "exact", head: true })
    .eq("couple_id", coupleId);

  if (error) {
    throwServerError(`Database error counting zine strips: ${error.message}`);
  }

  return count || 0;
};

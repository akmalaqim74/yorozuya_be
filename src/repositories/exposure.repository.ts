import supabaseAdmin from "../config/supabase";
import { ExposureRow } from "../types/database.types";
import { throwServerError } from "../utils/error.util";

export const findExposuresByRollId = async (rollId: string): Promise<ExposureRow[]> => {
  const { data, error } = await supabaseAdmin
    .from("exposures")
    .select("*")
    .eq("roll_id", rollId)
    .order("slot_index", { ascending: true });

  if (error) {
    throwServerError(`Database error fetching exposures: ${error.message}`);
  }

  return (data || []) as ExposureRow[];
};

export const findExposureByRollAndSlot = async (
  rollId: string,
  slotIndex: number
): Promise<ExposureRow | null> => {
  const { data, error } = await supabaseAdmin
    .from("exposures")
    .select("*")
    .eq("roll_id", rollId)
    .eq("slot_index", slotIndex)
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching exposure slot: ${error.message}`);
  }

  return data as ExposureRow | null;
};

export const ensureFourSlotsExist = async (rollId: string): Promise<ExposureRow[]> => {
  const existing = await findExposuresByRollId(rollId);
  if (existing.length === 4) return existing;

  const existingIndices = new Set(existing.map((e) => e.slot_index));
  const toInsert = [0, 1, 2, 3]
    .filter((i) => !existingIndices.has(i))
    .map((slotIndex) => ({
      roll_id: rollId,
      slot_index: slotIndex,
      status: "empty",
    }));

  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from("exposures").insert(toInsert);
    if (error) {
      throwServerError(`Failed to initialize exposure slots: ${error.message}`);
    }
  }

  return findExposuresByRollId(rollId);
};

export const updateExposureShot = async (
  exposureId: string,
  updates: Partial<Pick<ExposureRow, "user_a_photo_url" | "user_a_captured_at" | "user_b_photo_url" | "user_b_captured_at" | "status">>
): Promise<ExposureRow> => {
  const { data, error } = await supabaseAdmin
    .from("exposures")
    .update(updates)
    .eq("id", exposureId)
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to record exposure shot: ${error.message}`);
  }

  return data as ExposureRow;
};

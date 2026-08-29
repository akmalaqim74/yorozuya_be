import supabaseAdmin from "../config/supabase";
import { throwServerError } from "../utils/error.util";

/**
 * Reads a boolean feature toggle from `app_config`. Falls back to
 * `defaultValue` if the row is missing rather than throwing, so a forgotten
 * seed row fails open instead of silently blocking every request.
 */
export const getConfigBool = async (key: string, defaultValue: boolean): Promise<boolean> => {
  const { data, error } = await supabaseAdmin.from("app_config").select("value").eq("key", key).maybeSingle();

  if (error) {
    throwServerError(`Database error fetching config '${key}': ${error.message}`);
  }

  return data ? Boolean(data.value) : defaultValue;
};

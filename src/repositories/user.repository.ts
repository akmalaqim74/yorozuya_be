import supabaseAdmin from "../config/supabase";
import { ProfileRow } from "../types/database.types";
import { throwServerError } from "../utils/error.util";

export const createProfile = async (profile: {
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url?: string | null;
  timezone?: string;
}): Promise<ProfileRow> => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert([
      {
        email: profile.email.toLowerCase(),
        password_hash: profile.password_hash,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url || null,
        timezone: profile.timezone || "UTC",
      },
    ])
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to create profile: ${error.message}`);
  }

  return data as ProfileRow;
};

export const findByEmail = async (email: string): Promise<ProfileRow | null> => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching user by email: ${error.message}`);
  }

  return data as ProfileRow | null;
};

export const findById = async (id: string): Promise<ProfileRow | null> => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching user by ID: ${error.message}`);
  }

  return data as ProfileRow | null;
};

export const updateProfile = async (
  id: string,
  updates: Partial<Pick<ProfileRow, "display_name" | "avatar_url" | "timezone">>
): Promise<ProfileRow> => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to update profile: ${error.message}`);
  }

  return data as ProfileRow;
};

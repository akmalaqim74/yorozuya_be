import supabaseAdmin from "../config/supabase";
import { CoupleRow, PairInviteRow, ProfileRow } from "../types/database.types";
import { throwServerError } from "../utils/error.util";

export const findActiveCoupleByUserId = async (
  userId: string
): Promise<{ couple: CoupleRow; userA: ProfileRow; userB: ProfileRow | null } | null> => {
  // Query couples where user is either User A or User B and status is active
  const { data, error } = await supabaseAdmin
    .from("couples")
    .select(`
      *,
      user_a:profiles!couples_user_a_id_fkey(*),
      user_b:profiles!couples_user_b_id_fkey(*)
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching couple: ${error.message}`);
  }

  if (!data) return null;

  return {
    couple: {
      id: data.id,
      user_a_id: data.user_a_id,
      user_b_id: data.user_b_id,
      nickname: data.nickname,
      anniversary_date: data.anniversary_date,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    userA: data.user_a as ProfileRow,
    userB: data.user_b as ProfileRow | null,
  };
};

export const createPairInvite = async (
  creatorUserId: string,
  code: string,
  expiresAt: Date
): Promise<PairInviteRow> => {
  const { data, error } = await supabaseAdmin
    .from("pair_invites")
    .insert([
      {
        creator_user_id: creatorUserId,
        code: code.toUpperCase(),
        expires_at: expiresAt.toISOString(),
        is_claimed: false,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to create pairing invite: ${error.message}`);
  }

  return data as PairInviteRow;
};

export const findInviteByCode = async (code: string): Promise<PairInviteRow | null> => {
  const { data, error } = await supabaseAdmin
    .from("pair_invites")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (error) {
    throwServerError(`Failed to look up pairing code: ${error.message}`);
  }

  return data as PairInviteRow | null;
};

export const claimInvite = async (
  inviteId: string,
  claimedByUserId: string
): Promise<PairInviteRow> => {
  const { data, error } = await supabaseAdmin
    .from("pair_invites")
    .update({
      is_claimed: true,
      claimed_by_user_id: claimedByUserId,
    })
    .eq("id", inviteId)
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to claim invite code: ${error.message}`);
  }

  return data as PairInviteRow;
};

export const createCouple = async (
  userAId: string,
  userBId: string,
  nickname?: string
): Promise<CoupleRow> => {
  const { data, error } = await supabaseAdmin
    .from("couples")
    .insert([
      {
        user_a_id: userAId,
        user_b_id: userBId,
        nickname: nickname || null,
        status: "active",
      },
    ])
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to create couple relationship: ${error.message}`);
  }

  return data as CoupleRow;
};

export const disconnectCouple = async (coupleId: string): Promise<void> => {
  const { error } = await supabaseAdmin
    .from("couples")
    .update({ status: "disconnected" })
    .eq("id", coupleId);

  if (error) {
    throwServerError(`Failed to disconnect couple: ${error.message}`);
  }
};

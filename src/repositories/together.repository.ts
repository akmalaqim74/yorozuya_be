import supabaseAdmin from "../config/supabase";
import { TogetherInviteRow } from "../types/database.types";
import { throwServerError } from "../utils/error.util";

export const findActiveInviteForRoll = async (rollId: string): Promise<TogetherInviteRow | null> => {
  // Only a still-pending invite expires on its own -- once accepted, the
  // couple has already committed to shooting right now, so there's no
  // ticking clock left; it only ends when consumed (shot) or cancelled.
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("together_invites")
    .select("*")
    .eq("roll_id", rollId)
    .or(`status.eq.accepted,and(status.eq.pending,expires_at.gt.${nowIso})`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throwServerError(`Database error fetching together invite: ${error.message}`);
  }

  return data as TogetherInviteRow | null;
};

export const upsertInvite = async (
  rollId: string,
  slotIndex: number,
  invitedByUserId: string,
  expiresAt: string
): Promise<TogetherInviteRow> => {
  const { data, error } = await supabaseAdmin
    .from("together_invites")
    .upsert(
      {
        roll_id: rollId,
        slot_index: slotIndex,
        invited_by_user_id: invitedByUserId,
        status: "pending",
        expires_at: expiresAt,
      },
      { onConflict: "roll_id,slot_index" }
    )
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to create together invite: ${error.message}`);
  }

  return data as TogetherInviteRow;
};

export const markAccepted = async (inviteId: string): Promise<TogetherInviteRow> => {
  const { data, error } = await supabaseAdmin
    .from("together_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId)
    .select("*")
    .single();

  if (error) {
    throwServerError(`Failed to accept together invite: ${error.message}`);
  }

  return data as TogetherInviteRow;
};

export const deleteInvite = async (inviteId: string): Promise<void> => {
  const { error } = await supabaseAdmin.from("together_invites").delete().eq("id", inviteId);

  if (error) {
    throwServerError(`Failed to remove together invite: ${error.message}`);
  }
};

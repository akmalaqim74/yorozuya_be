import * as pairRepo from "../repositories/pair.repository";
import * as userRepo from "../repositories/user.repository";
import * as rollRepo from "../repositories/roll.repository";
import { generatePairInviteCode } from "../utils/token.util";
import { getTimezoneOffsetHours } from "../utils/date.util";
import { throwBadRequest, throwConflict, throwNotFound } from "../utils/error.util";
import { CoupleSummary, PartnerSummary } from "../types/domain.types";

export const createPairInvite = async (
  userId: string
): Promise<{ code: string; expires_at: string }> => {
  // Check if user is already paired with an active couple
  const existingCouple = await pairRepo.findActiveCoupleByUserId(userId);
  if (existingCouple) {
    throwConflict("You are already paired with a partner. Disconnect first to invite someone new.");
  }

  // Generate 5-character token, valid for 15 minutes
  const code = generatePairInviteCode(5);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const invite = await pairRepo.createPairInvite(userId, code, expiresAt);

  return {
    code: invite.code,
    expires_at: invite.expires_at,
  };
};

export const joinPair = async (
  userId: string,
  code: string
): Promise<{ message: string; couple_id: string }> => {
  // Check if caller already has an active partner
  const existingCouple = await pairRepo.findActiveCoupleByUserId(userId);
  if (existingCouple) {
    throwConflict("You are already paired with a partner. Disconnect first to join a new booth.");
  }

  const invite = await pairRepo.findInviteByCode(code);
  if (!invite) {
    throwNotFound("Pairing code");
  }

  if (invite.is_claimed) {
    throwBadRequest("This pairing code has already been used");
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throwBadRequest("This pairing code has expired. Please request a new one.");
  }

  if (invite.creator_user_id === userId) {
    throwBadRequest("You cannot pair with yourself");
  }

  // Ensure creator is also still free
  const creatorCouple = await pairRepo.findActiveCoupleByUserId(invite.creator_user_id);
  if (creatorCouple) {
    throwConflict("The creator of this code is already paired with someone else");
  }

  // Claim invite
  await pairRepo.claimInvite(invite.id, userId);

  // Create couple relationship (User A = creator, User B = joiner)
  const couple = await pairRepo.createCouple(invite.creator_user_id, userId);

  return {
    message: "Successfully paired! Welcome to the booth.",
    couple_id: couple.id,
  };
};

export const getCoupleStatus = async (
  userId: string
): Promise<{ is_paired: boolean; couple: CoupleSummary | null; partner: PartnerSummary | null }> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    return {
      is_paired: false,
      couple: null,
      partner: null,
    };
  }

  const { couple, userA, userB } = coupleData;
  const isUserA = userA.id === userId;
  const partnerProfile = isUserA ? userB : userA;
  const streakDays = await rollRepo.countConsecutiveStreakDays(couple.id);

  let partnerSummary: PartnerSummary | null = null;
  if (partnerProfile) {
    const tzDiff = getTimezoneOffsetHours(
      isUserA ? userA.timezone : userB?.timezone || "UTC",
      partnerProfile.timezone
    );

    partnerSummary = {
      id: partnerProfile.id,
      display_name: partnerProfile.display_name,
      avatar_url: partnerProfile.avatar_url,
      timezone: partnerProfile.timezone,
      seat: isUserA ? "B" : "A",
      timezone_offset_hours: tzDiff,
    };
  }

  const coupleSummary: CoupleSummary = {
    id: couple.id,
    nickname: couple.nickname,
    anniversary_date: couple.anniversary_date,
    streak_days: streakDays,
    status: couple.status,
    user_a: {
      id: userA.id,
      email: userA.email,
      display_name: userA.display_name,
      avatar_url: userA.avatar_url,
      timezone: userA.timezone,
      seat: "A",
      couple_id: couple.id,
    },
    user_b: userB
      ? {
          id: userB.id,
          email: userB.email,
          display_name: userB.display_name,
          avatar_url: userB.avatar_url,
          timezone: userB.timezone,
          seat: "B",
          couple_id: couple.id,
        }
      : null,
  };

  return {
    is_paired: true,
    couple: coupleSummary,
    partner: partnerSummary,
  };
};

export const disconnectCouple = async (userId: string): Promise<void> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwNotFound("Active couple");
  }

  await pairRepo.disconnectCouple(coupleData.couple.id);
};

import * as pairRepo from "../repositories/pair.repository";
import * as rollRepo from "../repositories/roll.repository";
import * as exposureRepo from "../repositories/exposure.repository";
import * as storageRepo from "../repositories/storage.repository";
import * as togetherRepo from "../repositories/together.repository";
import { SLOT_DEFINITIONS, ValidLook, ValidPaper, ValidStickerSet, VALID_LOOKS, VALID_PAPERS, VALID_STICKER_SETS } from "../config/constants";
import { getActiveSlotInfo, getFormattedDate, getTimezoneOffsetHours } from "../utils/date.util";
import { throwBadRequest, throwNotFound } from "../utils/error.util";
import { ExposureSlotDetail, PartnerSummary, TodayRollState, TogetherInviteState } from "../types/domain.types";

export const getTodayState = async (userId: string): Promise<TodayRollState> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("You are not part of an active photobooth couple. Please pair up first.", "NOT_PAIRED");
  }

  const { couple, userA, userB } = coupleData;
  const isSeatA = userA.id === userId;
  const myProfile = isSeatA ? userA : userB!;
  const partnerProfile = isSeatA ? userB : userA;

  const todayDateStr = getFormattedDate();

  // Find or create daily roll
  let roll = await rollRepo.findRollByCoupleAndDate(couple.id, todayDateStr);
  if (!roll) {
    const latestRoll = await rollRepo.getLatestRoll(couple.id);
    const nextRollNumber = latestRoll ? latestRoll.roll_number + 1 : 1;
    roll = await rollRepo.createDailyRoll({
      couple_id: couple.id,
      roll_date: todayDateStr,
      roll_number: nextRollNumber,
    });
  }

  // Ensure 4 exposure slots exist
  const rawExposures = await exposureRepo.ensureFourSlotsExist(roll.id);
  const streakDays = await rollRepo.countConsecutiveStreakDays(couple.id);

  // Active slot based on user timezone
  const { activeSlot } = getActiveSlotInfo(myProfile?.timezone || "UTC");

  // Exposures -- partner's photo is visible as soon as they upload it, no
  // waiting on your own half of the same slot.
  const exposureDetails: ExposureSlotDetail[] = SLOT_DEFINITIONS.map((def) => {
    const exp = rawExposures.find((e) => e.slot_index === def.index);
    const myPhoto = exp ? (isSeatA ? exp.user_a_photo_url : exp.user_b_photo_url) : null;
    const myCapturedAt = exp ? (isSeatA ? exp.user_a_captured_at : exp.user_b_captured_at) : null;
    const partnerPhoto = exp ? (isSeatA ? exp.user_b_photo_url : exp.user_a_photo_url) : null;
    const partnerCapturedAt = exp ? (isSeatA ? exp.user_b_captured_at : exp.user_a_captured_at) : null;

    const isCompleted = exp ? exp.status === "completed" : false;
    const hasMyPhoto = Boolean(myPhoto);
    const hasPartnerPhoto = Boolean(partnerPhoto);
    const visiblePartnerPhoto = partnerPhoto;

    return {
      slot_index: def.index,
      label: def.label,
      window: def.window,
      is_open_now: def.index === activeSlot.index,
      closes_in: def.closesDescription,
      my_photo_url: myPhoto,
      has_my_photo: hasMyPhoto,
      my_captured_at: myCapturedAt,
      partner_photo_url: visiblePartnerPhoto,
      has_partner_photo: hasPartnerPhoto,
      partner_captured_at: partnerCapturedAt,
      is_completed: isCompleted,
      is_live: !hasMyPhoto && (hasPartnerPhoto || def.index === activeSlot.index),
      // Only offered while the slot is fully untouched -- once either side
      // has a solo photo in, "shoot together" no longer makes sense for it.
      can_shoot_together: Boolean(userB) && (exp ? exp.status === "empty" : true),
    };
  });

  const activeInvite = await togetherRepo.findActiveInviteForRoll(roll.id);
  const togetherInvite: TogetherInviteState | null = activeInvite
    ? {
        id: activeInvite.id,
        slot_index: activeInvite.slot_index,
        invited_by_user_id: activeInvite.invited_by_user_id,
        is_mine_to_respond: activeInvite.invited_by_user_id !== userId,
        status: activeInvite.status,
        expires_at: activeInvite.expires_at,
      }
    : null;

  // Partner summary
  let partnerSummary: PartnerSummary | null = null;
  if (partnerProfile) {
    const tzDiff = getTimezoneOffsetHours(myProfile?.timezone || "UTC", partnerProfile.timezone);
    partnerSummary = {
      id: partnerProfile.id,
      display_name: partnerProfile.display_name,
      avatar_url: partnerProfile.avatar_url,
      timezone: partnerProfile.timezone,
      seat: isSeatA ? "B" : "A",
      timezone_offset_hours: tzDiff,
    };
  }

  // CTA label calculation
  const nextUnshotSlot = exposureDetails.find((e) => !e.has_my_photo);
  const allShot = nextUnshotSlot === undefined;
  const ctaLabel = allShot
    ? "View today's strip"
    : `Take the ${nextUnshotSlot.label.toLowerCase()} exposure`;
  const ctaHint = allShot
    ? "All four exposures printed"
    : nextUnshotSlot.has_partner_photo
    ? `${partnerProfile ? partnerProfile.display_name : "Partner"} is already in their seat`
    : nextUnshotSlot.closes_in;

  // Either partner can restyle the roll at any point in the day now -- it's
  // no longer locked to whoever shot first.
  const canCustomizeTheme = true;

  return {
    roll_id: roll.id,
    roll_date: roll.roll_date,
    roll_number: roll.roll_number,
    streak_days: streakDays,
    look: roll.look as ValidLook,
    paper: roll.paper as ValidPaper,
    sticker_set: roll.sticker_set as ValidStickerSet,
    first_shot_user_id: roll.first_shot_user_id,
    can_customize_theme: canCustomizeTheme,
    is_dispensed: roll.is_dispensed,
    active_slot_index: activeSlot.index,
    exposures: exposureDetails,
    partner_info: partnerSummary,
    cta_label: ctaLabel,
    cta_hint: ctaHint,
    together_invite: togetherInvite,
  };
};

export const updateRollTheme = async (
  userId: string,
  input: { look?: string; paper?: string; sticker_set?: string }
): Promise<TodayRollState> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }

  const todayDateStr = getFormattedDate();
  let roll = await rollRepo.findRollByCoupleAndDate(coupleData.couple.id, todayDateStr);
  if (!roll) {
    const latestRoll = await rollRepo.getLatestRoll(coupleData.couple.id);
    const nextRollNumber = latestRoll ? latestRoll.roll_number + 1 : 1;
    roll = await rollRepo.createDailyRoll({
      couple_id: coupleData.couple.id,
      roll_date: todayDateStr,
      roll_number: nextRollNumber,
    });
  }

  if (input.look && !VALID_LOOKS.includes(input.look as ValidLook)) {
    throwBadRequest(`Invalid look. Valid options: ${VALID_LOOKS.join(", ")}`);
  }
  if (input.paper && !VALID_PAPERS.includes(input.paper as ValidPaper)) {
    throwBadRequest(`Invalid paper. Valid options: ${VALID_PAPERS.join(", ")}`);
  }
  if (input.sticker_set && !VALID_STICKER_SETS.includes(input.sticker_set as ValidStickerSet)) {
    throwBadRequest(`Invalid sticker set. Valid options: ${VALID_STICKER_SETS.join(", ")}`);
  }

  await rollRepo.updateDailyRoll(roll.id, {
    ...(input.look ? { look: input.look } : {}),
    ...(input.paper ? { paper: input.paper } : {}),
    ...(input.sticker_set ? { sticker_set: input.sticker_set } : {}),
  });

  return getTodayState(userId);
};

export const shootExposure = async (
  userId: string,
  slotIndex: number,
  photoFile: Express.Multer.File
): Promise<{
  slot_index: number;
  status: string;
  is_roll_dispensed: boolean;
  my_photo_url: string;
}> => {
  if (slotIndex < 0 || slotIndex > 3) {
    throwBadRequest("Slot index must be between 0 (Morning) and 3 (Night)");
  }

  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }

  const { couple, userA } = coupleData;
  const isSeatA = userA.id === userId;
  const seatName = isSeatA ? "seat-a" : "seat-b";

  const todayDateStr = getFormattedDate();
  let roll = await rollRepo.findRollByCoupleAndDate(couple.id, todayDateStr);
  if (!roll) {
    const latestRoll = await rollRepo.getLatestRoll(couple.id);
    const nextRollNumber = latestRoll ? latestRoll.roll_number + 1 : 1;
    roll = await rollRepo.createDailyRoll({
      couple_id: couple.id,
      roll_date: todayDateStr,
      roll_number: nextRollNumber,
    });
  }

  await exposureRepo.ensureFourSlotsExist(roll.id);
  const exposure = await exposureRepo.findExposureByRollAndSlot(roll.id, slotIndex);
  if (!exposure) {
    throwNotFound("Exposure slot");
  }

  // Upload photo to Supabase storage
  const storagePath = `rolls/${roll.id}/slot-${slotIndex}-${seatName}-${Date.now()}.jpg`;
  const photoUrl = await storageRepo.uploadPhotoToStorage(
    "exposure-photos",
    storagePath,
    photoFile.buffer,
    photoFile.mimetype
  );

  const capturedAt = new Date().toISOString();
  const updateData: any = isSeatA
    ? { user_a_photo_url: photoUrl, user_a_captured_at: capturedAt }
    : { user_b_photo_url: photoUrl, user_b_captured_at: capturedAt };

  // Calculate new slot status
  const partnerHasPhoto = isSeatA ? Boolean(exposure.user_b_photo_url) : Boolean(exposure.user_a_photo_url);
  const newStatus = partnerHasPhoto ? "completed" : "half";
  updateData.status = newStatus;

  await exposureRepo.updateExposureShot(exposure.id, updateData);

  // If first shot of the day, record who set the theme
  if (!roll.first_shot_user_id) {
    await rollRepo.updateDailyRoll(roll.id, { first_shot_user_id: userId });
  }

  // Check if all 4 slots are now completed to dispense the strip
  const allExposures = await exposureRepo.findExposuresByRollId(roll.id);
  const completedSlots = allExposures.filter((e) =>
    e.id === exposure.id ? newStatus === "completed" : e.status === "completed"
  );

  let isRollDispensed = roll.is_dispensed;
  if (completedSlots.length === 4 && !roll.is_dispensed) {
    await rollRepo.updateDailyRoll(roll.id, { is_dispensed: true });
    isRollDispensed = true;
  }

  return {
    slot_index: slotIndex,
    status: newStatus,
    is_roll_dispensed: isRollDispensed,
    my_photo_url: photoUrl,
  };
};

export const getDispensedStrip = async (userId: string, rollId?: string): Promise<any> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }

  let roll;
  if (rollId) {
    roll = await rollRepo.findRollById(rollId);
  } else {
    const todayDateStr = getFormattedDate();
    roll = await rollRepo.findRollByCoupleAndDate(coupleData.couple.id, todayDateStr);
  }

  if (!roll) {
    throwNotFound("Strip");
  }

  const exposures = await exposureRepo.findExposuresByRollId(roll.id);

  return {
    roll_id: roll.id,
    roll_date: roll.roll_date,
    roll_number: roll.roll_number,
    look: roll.look,
    paper: roll.paper,
    sticker_set: roll.sticker_set,
    is_dispensed: roll.is_dispensed,
    is_kept_for_zine: roll.is_kept_for_zine,
    couple_name: coupleData.couple.nickname || `${coupleData.userA.display_name} & ${coupleData.userB?.display_name || "Partner"}`,
    user_a: {
      id: coupleData.userA.id,
      name: coupleData.userA.display_name,
      avatar_url: coupleData.userA.avatar_url,
    },
    user_b: coupleData.userB
      ? {
          id: coupleData.userB.id,
          name: coupleData.userB.display_name,
          avatar_url: coupleData.userB.avatar_url,
        }
      : null,
    frames: exposures.map((exp) => ({
      slot_index: exp.slot_index,
      label: SLOT_DEFINITIONS[exp.slot_index]?.label || `Slot ${exp.slot_index}`,
      user_a_photo_url: exp.user_a_photo_url,
      user_b_photo_url: exp.user_b_photo_url,
      status: exp.status,
    })),
  };
};

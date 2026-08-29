import * as pairRepo from "../repositories/pair.repository";
import * as rollRepo from "../repositories/roll.repository";
import * as exposureRepo from "../repositories/exposure.repository";
import * as togetherRepo from "../repositories/together.repository";
import * as storageRepo from "../repositories/storage.repository";
import * as configRepo from "../repositories/config.repository";
import { SLOT_DEFINITIONS } from "../config/constants";
import { getFormattedDate, hasSlotWindowClosed } from "../utils/date.util";
import { throwBadRequest, throwNotFound } from "../utils/error.util";

const INVITE_TTL_SECONDS = 90;

export const sendInvite = async (
  userId: string,
  slotIndex: number
): Promise<{ id: string; slot_index: number; expires_at: string }> => {
  if (slotIndex < 0 || slotIndex > 3) {
    throwBadRequest("Slot index must be between 0 (Morning) and 3 (Night)");
  }

  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }
  if (!coupleData.userB) {
    throwBadRequest("You need a partner paired before shooting together");
  }

  const isSeatA = coupleData.userA.id === userId;
  const myProfile = isSeatA ? coupleData.userA : coupleData.userB;

  const enforceDeadline = await configRepo.getConfigBool("enforce_slot_deadline", true);
  if (enforceDeadline && hasSlotWindowClosed(slotIndex, myProfile?.timezone || "UTC")) {
    throwBadRequest(`The ${SLOT_DEFINITIONS[slotIndex]?.label ?? "exposure"} window has already closed for today`, "SLOT_CLOSED");
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

  await exposureRepo.ensureFourSlotsExist(roll.id);
  const exposure = await exposureRepo.findExposureByRollAndSlot(roll.id, slotIndex);
  if (!exposure) {
    throwNotFound("Exposure slot");
  }
  if (exposure.status !== "empty") {
    throwBadRequest("That exposure already has a photo -- shoot together only works before either of you has taken one");
  }

  const expiresAt = new Date(Date.now() + INVITE_TTL_SECONDS * 1000).toISOString();
  const invite = await togetherRepo.upsertInvite(roll.id, slotIndex, userId, expiresAt);

  return {
    id: invite.id,
    slot_index: invite.slot_index,
    expires_at: invite.expires_at,
  };
};

export const respondInvite = async (userId: string, accept: boolean): Promise<void> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }

  const todayDateStr = getFormattedDate();
  const roll = await rollRepo.findRollByCoupleAndDate(coupleData.couple.id, todayDateStr);
  if (!roll) {
    throwNotFound("Today's roll");
  }

  const invite = await togetherRepo.findActiveInviteForRoll(roll.id);
  if (!invite || invite.status !== "pending") {
    throwNotFound("Together invite");
  }
  if (invite.invited_by_user_id === userId) {
    throwBadRequest("You can't respond to your own invite");
  }

  if (accept) {
    await togetherRepo.markAccepted(invite.id);
  } else {
    await togetherRepo.deleteInvite(invite.id);
  }
};

export const cancelInvite = async (userId: string): Promise<void> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }

  const todayDateStr = getFormattedDate();
  const roll = await rollRepo.findRollByCoupleAndDate(coupleData.couple.id, todayDateStr);
  if (!roll) return;

  const invite = await togetherRepo.findActiveInviteForRoll(roll.id);
  if (invite && invite.invited_by_user_id === userId) {
    await togetherRepo.deleteInvite(invite.id);
  }
};

export const shootTogether = async (
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

  const isSeatA = coupleData.userA.id === userId;
  const myProfile = isSeatA ? coupleData.userA : coupleData.userB;

  const enforceDeadline = await configRepo.getConfigBool("enforce_slot_deadline", true);
  if (enforceDeadline && hasSlotWindowClosed(slotIndex, myProfile?.timezone || "UTC")) {
    throwBadRequest(`The ${SLOT_DEFINITIONS[slotIndex]?.label ?? "exposure"} window has already closed for today`, "SLOT_CLOSED");
  }

  const todayDateStr = getFormattedDate();
  const roll = await rollRepo.findRollByCoupleAndDate(coupleData.couple.id, todayDateStr);
  if (!roll) {
    throwNotFound("Today's roll");
  }

  // Only the partner who sent the invite may complete it -- an accepted
  // invite means "use the sender's camera", not "either device can now
  // upload".
  const invite = await togetherRepo.findActiveInviteForRoll(roll.id);
  if (!invite || invite.status !== "accepted" || invite.slot_index !== slotIndex || invite.invited_by_user_id !== userId) {
    throwBadRequest("No accepted together invite for this exposure");
  }

  const exposure = await exposureRepo.findExposureByRollAndSlot(roll.id, slotIndex);
  if (!exposure) {
    throwNotFound("Exposure slot");
  }

  const storagePath = `rolls/${roll.id}/slot-${slotIndex}-together-${Date.now()}.jpg`;
  const photoUrl = await storageRepo.uploadPhotoToStorage(
    "exposure-photos",
    storagePath,
    photoFile.buffer,
    photoFile.mimetype
  );

  // One shared photo fills both halves of the frame directly -- the slot
  // completes immediately instead of waiting on a second, separate upload.
  const capturedAt = new Date().toISOString();
  await exposureRepo.updateExposureShot(exposure.id, {
    user_a_photo_url: photoUrl,
    user_a_captured_at: capturedAt,
    user_b_photo_url: photoUrl,
    user_b_captured_at: capturedAt,
    status: "completed",
  });

  if (!roll.first_shot_user_id) {
    await rollRepo.updateDailyRoll(roll.id, { first_shot_user_id: userId });
  }

  await togetherRepo.deleteInvite(invite.id);

  const allExposures = await exposureRepo.findExposuresByRollId(roll.id);
  const completedSlots = allExposures.filter((e) => (e.id === exposure.id ? true : e.status === "completed"));

  let isRollDispensed = roll.is_dispensed;
  if (completedSlots.length === 4 && !roll.is_dispensed) {
    await rollRepo.updateDailyRoll(roll.id, { is_dispensed: true });
    isRollDispensed = true;
  }

  return {
    slot_index: slotIndex,
    status: "completed",
    is_roll_dispensed: isRollDispensed,
    my_photo_url: photoUrl,
  };
};

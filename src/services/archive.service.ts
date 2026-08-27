import * as pairRepo from "../repositories/pair.repository";
import * as archiveRepo from "../repositories/archive.repository";
import * as rollRepo from "../repositories/roll.repository";
import { throwBadRequest, throwNotFound } from "../utils/error.util";
import { ArchiveDayItem, ArchiveMonthOverview } from "../types/domain.types";
import { ValidLook } from "../config/constants";
import { getDispensedStrip } from "./booth.service";

export const getMonthOverview = async (
  userId: string,
  year: number,
  month: number
): Promise<ArchiveMonthOverview> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }

  const coupleId = coupleData.couple.id;

  // Calculate start and end date for the month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const rollsInMonth = await archiveRepo.findRollsInMonth(coupleId, startDate, endDate);
  const rollsMap = new Map<string, archiveRepo.RollWithExposures>();
  for (const r of rollsInMonth) {
    rollsMap.set(r.roll_date, r);
  }

  let totalComplete = 0;
  let totalHalf = 0;
  let totalMissed = 0;

  const days: ArchiveDayItem[] = [];
  const today = new Date();
  const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const roll = rollsMap.get(dateStr);

    let status: "complete" | "half" | "missed" | "empty" = "empty";
    let completedCount = 0;
    let look: ValidLook | null = null;
    let isKeptForZine = false;
    let rollId: string | null = null;
    let rollNumber: number | null = null;

    if (roll) {
      rollId = roll.id;
      rollNumber = roll.roll_number;
      look = roll.look as ValidLook;
      isKeptForZine = roll.is_kept_for_zine;
      completedCount = roll.exposures.filter((e) => e.status === "completed").length;

      if (completedCount === 4 || roll.is_dispensed) {
        status = "complete";
        totalComplete++;
      } else if (completedCount > 0) {
        status = "half";
        totalHalf++;
      } else if (dateStr < todayFormatted) {
        status = "missed";
        totalMissed++;
      }
    } else if (dateStr < todayFormatted) {
      status = "missed";
      totalMissed++;
    }

    days.push({
      date: dateStr,
      day_number: day,
      roll_id: rollId,
      roll_number: rollNumber,
      status,
      completed_frames_count: completedCount,
      look,
      is_kept_for_zine: isKeptForZine,
    });
  }

  // Print run calculations
  const printRunTarget = 30;

  return {
    year,
    month,
    total_complete: totalComplete,
    total_half: totalHalf,
    total_missed: totalMissed,
    print_run_target: printRunTarget,
    print_run_current: Math.min(totalComplete, printRunTarget),
    days,
  };
};

export const getStripDetails = async (userId: string, rollId: string) => {
  return getDispensedStrip(userId, rollId);
};

export const toggleZineStatus = async (
  userId: string,
  rollId: string,
  isKeptForZine: boolean,
  note?: string
): Promise<void> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }

  const roll = await rollRepo.findRollById(rollId);
  if (!roll || roll.couple_id !== coupleData.couple.id) {
    throwNotFound("Strip");
  }

  await archiveRepo.setZineStatus(coupleData.couple.id, rollId, isKeptForZine, note);
};

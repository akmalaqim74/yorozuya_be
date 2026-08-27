import * as pairRepo from "../repositories/pair.repository";
import * as rollRepo from "../repositories/roll.repository";
import * as statsRepo from "../repositories/stats.repository";
import * as archiveRepo from "../repositories/archive.repository";
import { SLOT_DEFINITIONS } from "../config/constants";
import { getTimezoneOffsetHours, getFormattedDate } from "../utils/date.util";
import { throwBadRequest } from "../utils/error.util";
import { RelationshipStats } from "../types/domain.types";

export const getRelationshipStats = async (userId: string): Promise<RelationshipStats> => {
  const coupleData = await pairRepo.findActiveCoupleByUserId(userId);
  if (!coupleData) {
    throwBadRequest("Not in an active couple", "NOT_PAIRED");
  }

  const { couple, userA, userB } = coupleData;
  const coupleId = couple.id;

  const streakDays = await rollRepo.countConsecutiveStreakDays(coupleId);
  const framesTogether = await statsRepo.getFramesTogetherCount(coupleId);
  const firstShotData = await statsRepo.getFirstShotStats(coupleId, userId);
  const zineCount = await statsRepo.countZineStrips(coupleId);

  const firstResponseRate =
    firstShotData.totalFirstRecorded > 0
      ? Math.round((firstShotData.userFirstCount / firstShotData.totalFirstRecorded) * 100)
      : 100;

  const tzGap = userB
    ? Math.abs(getTimezoneOffsetHours(userA.timezone, userB.timezone))
    : 0;

  // Compute 7-day weekly activity bars
  const weekDayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date();

  // Find Monday of the current week
  const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);

  const startDateStr = getFormattedDate(monday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const endDateStr = getFormattedDate(sunday);

  const weeklyRolls = await archiveRepo.findRollsInMonth(coupleId, startDateStr, endDateStr);
  const weeklyMap = new Map<string, number>();
  for (const r of weeklyRolls) {
    const completedCount = r.exposures.filter((e) => e.status === "completed").length;
    weeklyMap.set(r.roll_date, completedCount);
  }

  const weekBars = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const curDate = new Date(monday);
    curDate.setDate(monday.getDate() + offset);
    const dateStr = getFormattedDate(curDate);
    const count = weeklyMap.get(dateStr) || 0;
    return {
      day: weekDayLabels[offset],
      count,
      is_active: count === 4,
    };
  });

  // Compute Exposure Habits Breakdown
  const rawHabits = await statsRepo.getSlotHabits(coupleId);
  const exposureHabits = SLOT_DEFINITIONS.map((slotDef) => {
    const found = rawHabits.find((h) => h.slot_index === slotDef.index);
    const completed = found ? found.completed_count : 0;
    const total = found ? found.total_recorded : 1;
    const percentage = Math.round((completed / total) * 100);

    return {
      label: slotDef.label,
      count: completed,
      percentage,
    };
  });

  return {
    streak_days: streakDays,
    frames_together: framesTogether,
    first_response_rate_percent: firstResponseRate,
    timezone_gap_hours: tzGap,
    zine_strips_count: zineCount,
    week_bars: weekBars,
    exposure_habits: exposureHabits,
  };
};

import { SLOT_DEFINITIONS, SlotDef } from "../config/constants";

/**
 * Format a Date object to YYYY-MM-DD
 */
export const getFormattedDate = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Get current hour in a specific timezone
 */
export const getHourInTimezone = (timezone = "UTC", date: Date = new Date()): number => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find((p) => p.type === "hour");
    return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
};

/**
 * Find currently active slot index (0..3) based on user's local time, or nearest upcoming slot.
 */
export const getActiveSlotInfo = (
  timezone = "UTC",
  date: Date = new Date()
): { activeSlot: SlotDef; closesIn: string; isWithinWindow: boolean } => {
  const currentHour = getHourInTimezone(timezone, date);

  // Check if current hour falls in any slot
  for (const slot of SLOT_DEFINITIONS) {
    if (currentHour >= slot.startHour && currentHour < slot.endHour) {
      const remainingHours = slot.endHour - currentHour;
      return {
        activeSlot: slot,
        closesIn: remainingHours === 1 ? "closes in < 1h" : `closes in ${remainingHours}h`,
        isWithinWindow: true,
      };
    }
  }

  // If outside all active windows, return next upcoming slot or closest
  if (currentHour < 7) {
    return { activeSlot: SLOT_DEFINITIONS[0], closesIn: "opens at 7:00 AM", isWithinWindow: false };
  }
  if (currentHour < 12) {
    return { activeSlot: SLOT_DEFINITIONS[1], closesIn: "opens at 12:00 PM", isWithinWindow: false };
  }
  if (currentHour < 17) {
    return { activeSlot: SLOT_DEFINITIONS[2], closesIn: "opens at 5:00 PM", isWithinWindow: false };
  }
  if (currentHour < 21) {
    return { activeSlot: SLOT_DEFINITIONS[3], closesIn: "opens at 9:00 PM", isWithinWindow: false };
  }

  return { activeSlot: SLOT_DEFINITIONS[3], closesIn: "closes at 12:00 AM", isWithinWindow: false };
};

/**
 * Calculate timezone offset difference in hours between two timezones.
 * e.g. "Asia/Jakarta" (UTC+7) vs "Europe/Berlin" (UTC+2/1) -> returns +5 or +6
 */
export const getTimezoneOffsetHours = (tzUserA = "UTC", tzUserB = "UTC"): number => {
  try {
    const now = new Date();
    const getOffset = (tz: string) => {
      const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
      }).format(now);
      const match = formatted.match(/GMT([+-]\d+)?(:(\d+))?/);
      if (!match || !match[1]) return 0;
      const hours = parseInt(match[1], 10);
      return hours;
    };

    const offsetA = getOffset(tzUserA);
    const offsetB = getOffset(tzUserB);
    return offsetB - offsetA;
  } catch {
    return 0;
  }
};

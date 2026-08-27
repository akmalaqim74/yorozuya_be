import assert from "node:assert";
import test from "node:test";
import { generatePairInviteCode } from "../utils/token.util";
import {
  getActiveSlotInfo,
  getFormattedDate,
  getTimezoneOffsetHours,
} from "../utils/date.util";
import { SLOT_DEFINITIONS, VALID_LOOKS, VALID_PAPERS, VALID_STICKER_SETS } from "../config/constants";

test("generatePairInviteCode generates 5-character uppercase alphanumeric code", () => {
  const code1 = generatePairInviteCode();
  const code2 = generatePairInviteCode();

  assert.strictEqual(code1.length, 5);
  assert.strictEqual(code2.length, 5);
  assert.match(code1, /^[2-9A-HJ-NP-Z]{5}$/);
  assert.notStrictEqual(code1, code2);
});

test("SLOT_DEFINITIONS contains 4 slots: Morning, Noon, Evening, Night", () => {
  assert.strictEqual(SLOT_DEFINITIONS.length, 4);
  assert.strictEqual(SLOT_DEFINITIONS[0].label, "Morning");
  assert.strictEqual(SLOT_DEFINITIONS[1].label, "Noon");
  assert.strictEqual(SLOT_DEFINITIONS[2].label, "Evening");
  assert.strictEqual(SLOT_DEFINITIONS[3].label, "Night");
});

test("Film looks, papers, and stickers are correctly defined", () => {
  assert.deepStrictEqual(Array.from(VALID_LOOKS), ["Sepia", "Silver", "Kodachrome", "Bleach"]);
  assert.deepStrictEqual(Array.from(VALID_PAPERS), ["Blush", "Butter", "Mint", "Classic"]);
  assert.deepStrictEqual(Array.from(VALID_STICKER_SETS), ["Love", "Cosmos", "Garden", "Mixed"]);
});

test("getFormattedDate returns YYYY-MM-DD format", () => {
  const formatted = getFormattedDate(new Date(2026, 7, 26));
  assert.strictEqual(formatted, "2026-08-26");
});

test("getActiveSlotInfo returns active slot object", () => {
  const info = getActiveSlotInfo("UTC");
  assert.ok(info.activeSlot);
  assert.ok(typeof info.closesIn === "string");
  assert.ok(typeof info.isWithinWindow === "boolean");
});

test("getTimezoneOffsetHours calculates timezone difference correctly", () => {
  // Asia/Tokyo is UTC+9, UTC is UTC+0 -> diff is +9
  const diff = getTimezoneOffsetHours("UTC", "Asia/Tokyo");
  assert.strictEqual(diff, 9);
});

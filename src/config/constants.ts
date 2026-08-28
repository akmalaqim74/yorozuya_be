export interface SlotDef {
  index: number;
  label: string;
  window: string;
  startHour: number; // 24-hr format
  endHour: number;   // 24-hr format
  closesDescription: string;
}

export const SLOT_DEFINITIONS: SlotDef[] = [
  { index: 0, label: "Morning", window: "7–10a", startHour: 7, endHour: 10, closesDescription: "closes at 10:00 AM" },
  { index: 1, label: "Noon", window: "12–3p", startHour: 12, endHour: 15, closesDescription: "closes at 3:00 PM" },
  { index: 2, label: "Evening", window: "5–8p", startHour: 17, endHour: 20, closesDescription: "closes at 8:00 PM" },
  { index: 3, label: "Night", window: "9–12p", startHour: 21, endHour: 24, closesDescription: "closes at 12:00 AM" },
];

export const VALID_LOOKS = ["Natural", "Sepia", "Silver", "Kodachrome", "Bleach", "Noir", "Polaroid"] as const;
export type ValidLook = (typeof VALID_LOOKS)[number];

export const VALID_PAPERS = ["Blush", "Butter", "Mint", "Classic", "Lilac", "Ocean"] as const;
export type ValidPaper = (typeof VALID_PAPERS)[number];

export const VALID_STICKER_SETS = ["Love", "Cosmos", "Garden", "Mixed", "Retro", "Weather"] as const;
export type ValidStickerSet = (typeof VALID_STICKER_SETS)[number];

export const LOOKS_METADATA: Record<ValidLook, { iso: string; blurb: string; filter: string; sw: string }> = {
  Natural: {
    iso: "RAW",
    blurb: "true colour, no grade",
    filter: "none",
    sw: "linear-gradient(135deg,#F3F0EA,#C9C2B4 55%,#8A8172)",
  },
  Sepia: {
    iso: "ISO 200",
    blurb: "warm brown, soft shoulder",
    filter: "sepia(.5) contrast(1.06) saturate(.9)",
    sw: "linear-gradient(135deg,#E8CFA6,#A9743F 55%,#5A3618)",
  },
  Silver: {
    iso: "ISO 400",
    blurb: "true black and white",
    filter: "grayscale(1) contrast(1.14)",
    sw: "linear-gradient(135deg,#E9E4DA,#8E8880 55%,#3A3733)",
  },
  Kodachrome: {
    iso: "ISO 64",
    blurb: "saturated mid-century",
    filter: "saturate(1.35) contrast(1.1) hue-rotate(-6deg)",
    sw: "linear-gradient(135deg,#F2C98E,#C4564A 55%,#3F6B72)",
  },
  Bleach: {
    iso: "ISO 800",
    blurb: "blown highlights, grainy",
    filter: "sepia(.2) contrast(1.28) brightness(1.12) saturate(.7)",
    sw: "linear-gradient(135deg,#FBF3E4,#D8C7AC 55%,#8C8172)",
  },
  Noir: {
    iso: "ISO 1600",
    blurb: "hard contrast, deep black",
    filter: "grayscale(1) contrast(1.35) brightness(.92)",
    sw: "linear-gradient(135deg,#D8D8D8,#4A4A4A 55%,#0A0A0A)",
  },
  Polaroid: {
    iso: "ISO 100",
    blurb: "warm fade, soft whites",
    filter: "sepia(.18) contrast(.92) brightness(1.1) saturate(1.05)",
    sw: "linear-gradient(135deg,#F5E9D6,#D9B98A 55%,#A9825A)",
  },
};

export const PAPERS_METADATA: Record<
  ValidPaper,
  { paper: string; ink: string; accent: string; backdrop: string; motif: string; label: string }
> = {
  Blush: {
    paper: "#F7E2E4",
    ink: "#5A2530",
    accent: "#C9566B",
    backdrop: "radial-gradient(120% 90% at 50% 0%,#E8A9B4,#B2596C 60%,#6E2A3A)",
    motif: "♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥ ♥",
    label: "blush · hearts",
  },
  Butter: {
    paper: "#F8EBC8",
    ink: "#5A4318",
    accent: "#C08A2E",
    backdrop: "radial-gradient(120% 90% at 50% 0%,#E8C88A,#B08A3E 60%,#6B4E18)",
    motif: "✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧",
    label: "butter · stars",
  },
  Mint: {
    paper: "#DCEDE2",
    ink: "#22493A",
    accent: "#3E8A68",
    backdrop: "radial-gradient(120% 90% at 50% 0%,#9FD0B6,#4E8F70 60%,#22493A)",
    motif: "❀ ❀ ❀ ❀ ❀ ❀ ❀ ❀ ❀ ❀ ❀ ❀",
    label: "mint · blooms",
  },
  Classic: {
    paper: "#EFE3CB",
    ink: "#2A1512",
    accent: "#8C2230",
    backdrop: "radial-gradient(120% 90% at 50% 0%,#7A2029,#4A151B 62%,#241012)",
    motif: "· · · · · · · · · · · · · ·",
    label: "cream · velvet",
  },
  Lilac: {
    paper: "#EAE1F5",
    ink: "#3E2A5A",
    accent: "#8B6DC2",
    backdrop: "radial-gradient(120% 90% at 50% 0%,#C7AEE8,#8C6BB8 60%,#4A3468)",
    motif: "✧ ✧ ✧ ✧ ✧ ✧ ✧ ✧ ✧ ✧ ✧ ✧",
    label: "lilac · stars",
  },
  Ocean: {
    paper: "#DCEEF2",
    ink: "#153A45",
    accent: "#3E8FA8",
    backdrop: "radial-gradient(120% 90% at 50% 0%,#8FCBDB,#3E7F94 60%,#1C4550)",
    motif: "≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈",
    label: "ocean · waves",
  },
};

export const STICKERS_METADATA: Record<ValidStickerSet, string[]> = {
  Love: ["♥", "❥", "♡", "❣"],
  Cosmos: ["☾", "★", "✦", "✧"],
  Garden: ["✿", "❀", "✾", "❈"],
  Mixed: ["♥", "☾", "✿", "✦"],
  Retro: ["☆", "✩", "✫", "✬"],
  Weather: ["☀", "☁", "☂", "❄"],
};

import crypto from "crypto";

/**
 * Generate a clean, human-friendly 5-character alphanumeric pairing token.
 * Example output: "7QK42", "M9R2W" (excludes confusing characters like 0, O, 1, I).
 */
const TOKEN_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const generatePairInviteCode = (length = 5): string => {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    const index = bytes[i] % TOKEN_CHARSET.length;
    code += TOKEN_CHARSET[index];
  }
  return code;
};

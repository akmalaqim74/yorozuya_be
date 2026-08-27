import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import env from "../config/env";
import * as userRepo from "../repositories/user.repository";
import * as pairRepo from "../repositories/pair.repository";
import { RegisterRequest, LoginRequest, UpdateProfileRequest } from "../types/api.types";
import { UserProfileSummary } from "../types/domain.types";
import { throwBadRequest, throwConflict, throwNotFound, throwUnauthorized } from "../utils/error.util";

export const register = async (input: RegisterRequest): Promise<{ token: string; user: UserProfileSummary }> => {
  const existing = await userRepo.findByEmail(input.email);
  if (existing) {
    throwConflict("An account with this email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(input.password, salt);

  const profile = await userRepo.createProfile({
    email: input.email,
    password_hash,
    display_name: input.display_name,
    avatar_url: input.avatar_url,
    timezone: input.timezone || "UTC",
  });

  const signOptions: SignOptions = {
    expiresIn: "7d",
  };

  const token = jwt.sign(
    { userId: profile.id, email: profile.email },
    env.JWT_SECRET as Secret,
    signOptions
  );

  return {
    token,
    user: {
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      timezone: profile.timezone,
      seat: null,
      couple_id: null,
    },
  };
};

export const login = async (input: LoginRequest): Promise<{ token: string; user: UserProfileSummary }> => {
  const profile = await userRepo.findByEmail(input.email);
  if (!profile) {
    throwUnauthorized("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(input.password, profile.password_hash);
  if (!isMatch) {
    throwUnauthorized("Invalid email or password");
  }

  const activeCoupleData = await pairRepo.findActiveCoupleByUserId(profile.id);
  let seat: "A" | "B" | null = null;
  let coupleId: string | null = null;

  if (activeCoupleData) {
    coupleId = activeCoupleData.couple.id;
    seat = activeCoupleData.couple.user_a_id === profile.id ? "A" : "B";
  }

  const signOptions: SignOptions = {
    expiresIn: "7d",
  };

  const token = jwt.sign(
    { userId: profile.id, email: profile.email },
    env.JWT_SECRET as Secret,
    signOptions
  );

  return {
    token,
    user: {
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      timezone: profile.timezone,
      seat,
      couple_id: coupleId,
    },
  };
};

export const getMe = async (userId: string): Promise<UserProfileSummary> => {
  const profile = await userRepo.findById(userId);
  if (!profile) {
    throwNotFound("User");
  }

  const activeCoupleData = await pairRepo.findActiveCoupleByUserId(userId);
  let seat: "A" | "B" | null = null;
  let coupleId: string | null = null;

  if (activeCoupleData) {
    coupleId = activeCoupleData.couple.id;
    seat = activeCoupleData.couple.user_a_id === profile.id ? "A" : "B";
  }

  return {
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    timezone: profile.timezone,
    seat,
    couple_id: coupleId,
  };
};

export const updateProfile = async (
  userId: string,
  input: UpdateProfileRequest
): Promise<UserProfileSummary> => {
  const profile = await userRepo.findById(userId);
  if (!profile) {
    throwNotFound("User");
  }

  await userRepo.updateProfile(userId, {
    ...(input.display_name ? { display_name: input.display_name } : {}),
    ...(input.avatar_url !== undefined ? { avatar_url: input.avatar_url } : {}),
    ...(input.timezone ? { timezone: input.timezone } : {}),
  });

  return getMe(userId);
};

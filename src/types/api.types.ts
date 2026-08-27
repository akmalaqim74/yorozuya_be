export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
  code?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
  timezone?: string;
  avatar_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  avatar_url?: string;
  timezone?: string;
}

export interface JoinPairRequest {
  code: string;
}

export interface UpdateThemeRequest {
  look?: string;
  paper?: string;
  sticker_set?: string;
}

export interface ToggleZineRequest {
  is_kept_for_zine: boolean;
  note?: string;
}

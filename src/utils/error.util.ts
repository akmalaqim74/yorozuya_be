export class AppError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, status = 400, code?: string, details?: any) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function throwBadRequest(message: string, code?: string): never {
  throw new AppError(message, 400, code);
}

export function throwUnauthorized(message = "Unauthorized", code = "UNAUTHORIZED"): never {
  throw new AppError(message, 401, code);
}

export function throwForbidden(message = "Forbidden", code = "FORBIDDEN"): never {
  throw new AppError(message, 403, code);
}

export function throwNotFound(resource = "Resource", code = "NOT_FOUND"): never {
  throw new AppError(`${resource} not found`, 404, code);
}

export function throwConflict(message: string, code = "CONFLICT"): never {
  throw new AppError(message, 409, code);
}

export function throwUnprocessable(message: string, code = "UNPROCESSABLE_ENTITY"): never {
  throw new AppError(message, 422, code);
}

export function throwServerError(message = "Internal server error", code = "INTERNAL_SERVER_ERROR"): never {
  throw new AppError(message, 500, code);
}

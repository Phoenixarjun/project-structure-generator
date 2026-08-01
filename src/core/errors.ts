export class StructgenError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "StructgenError";
    this.code = code;
    this.details = details;
  }
}

export function asStructgenError(error: unknown): StructgenError {
  if (error instanceof StructgenError) {
    return error;
  }

  if (error instanceof Error) {
    return new StructgenError("UNEXPECTED_ERROR", error.message, error);
  }

  return new StructgenError("UNEXPECTED_ERROR", String(error));
}

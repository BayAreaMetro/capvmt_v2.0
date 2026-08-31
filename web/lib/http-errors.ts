export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Wraps an unknown error as an HttpError. These routes only fail when
 * an upstream API (Socrata, Asana) fails, so anything that isn't
 * already an HttpError defaults to 502 (Bad Gateway) rather than a
 * generic 500.
 */
export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new HttpError(502, message);
}

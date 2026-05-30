export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly options?: { cause?: unknown; statusCode?: number },
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ConflictError extends Error {
  private static readonly CODE = 'CONFLICT_ERROR';

  code = ConflictError.CODE;
  status = 409;

  constructor(message?: string) {
    super(message ?? ConflictError.CODE);
  }
}

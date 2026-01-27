import { NotFoundError } from 'elysia';

export class FamilyNotFoundError extends NotFoundError {
  constructor(familyID: string) {
    super(`No Family exists with ID '${familyID}'`);
  }
}

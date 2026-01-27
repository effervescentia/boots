import { NotFoundError } from 'elysia';

export class NetworkNotFoundError extends NotFoundError {
  constructor(familyID: string) {
    super(`No Network exists with ID '${familyID}'`);
  }
}

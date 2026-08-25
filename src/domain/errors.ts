/**
 * Domain failures are thrown, never returned as null. The API edge maps them to
 * HTTP status; the CSV parser catches them per row and records them as rejects.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

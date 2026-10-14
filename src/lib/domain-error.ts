export class DomainError extends Error {
  constructor(public readonly key: string, public readonly status = 400) {
    super(key);
    this.name = "DomainError";
  }
}

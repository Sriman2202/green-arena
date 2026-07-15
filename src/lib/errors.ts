export class SlotUnavailableError extends Error {
  constructor(message = "This slot is no longer available.") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

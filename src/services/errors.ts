export class BridgeError extends Error {
  readonly hint?: string;

  constructor(message: string, hint?: string) {
    super(message);
    this.name = "BridgeError";
    this.hint = hint;
  }

  toAgentMessage(): string {
    if (this.hint) {
      return `Error: ${this.message}. ${this.hint}`;
    }
    return `Error: ${this.message}`;
  }
}

export function toAgentError(error: unknown): string {
  if (error instanceof BridgeError) {
    return error.toAgentMessage();
  }
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return `Error: Unexpected failure: ${String(error)}`;
}

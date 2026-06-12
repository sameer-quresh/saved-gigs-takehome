export class ErrorStatus extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "ErrorStatus";
  }
}

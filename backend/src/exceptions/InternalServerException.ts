export class InternalServerException extends Error {
  status = 500;

  constructor(message = "Internal Server Error") {
    super(message);
  }
}
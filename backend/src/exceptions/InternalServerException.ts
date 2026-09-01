import { AppError } from "./AppError";

export class InternalServerException extends AppError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}
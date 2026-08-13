import { AppError } from "./AppError";

export class ConflictException extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}
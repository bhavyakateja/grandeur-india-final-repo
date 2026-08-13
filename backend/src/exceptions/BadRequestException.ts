import { AppError } from "./AppError";

export class BadRequestException extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}
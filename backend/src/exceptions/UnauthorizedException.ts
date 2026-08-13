import { AppError } from "./AppError";

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}
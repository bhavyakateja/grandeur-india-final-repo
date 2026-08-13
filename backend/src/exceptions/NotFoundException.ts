import { AppError } from "./AppError";

export class NotFoundException extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}
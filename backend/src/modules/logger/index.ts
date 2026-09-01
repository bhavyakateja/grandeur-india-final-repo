/**
 * Re-export the canonical logger from config/logger.
 *
 * This barrel exists so that modules using
 * `from "../logger"` or `from "./modules/logger"`
 * resolve correctly without changing every call-site
 * to `config/logger`.
 */
export { logger, createLogger } from "../../config/logger";

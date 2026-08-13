import { Hono } from "hono";
import { authMiddleware } from "../../middleware/authMiddleware";
import * as authController from "./controller";

const authRouter = new Hono();

authRouter.post("/signup", authController.signup);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);

authRouter.get("/me", authMiddleware, authController.me);

export default authRouter;

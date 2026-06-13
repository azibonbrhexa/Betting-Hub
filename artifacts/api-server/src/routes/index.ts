import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import walletRouter from "./wallet";
import gamesRouter from "./games";
import betsRouter from "./bets";
import bonusesRouter from "./bonuses";
import referralsRouter from "./referrals";
import statsRouter from "./stats";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/wallet", walletRouter);
router.use("/games", gamesRouter);
router.use("/bets", betsRouter);
router.use("/bonuses", bonusesRouter);
router.use("/referrals", referralsRouter);
router.use("/stats", statsRouter);
router.use("/admin", adminRouter);

export default router;

import express from "express";
import {
  addEarnedCredit,
  createBeginningBalance,
  getEmployeeLedger,
  updateLedgerTransaction,
} from "../controllers/ledgerController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/:userSchoolId",
  protect,
  authorizeRoles("admin_officer", "principal", "division_admin", "teacher"),
  getEmployeeLedger
);

router.post(
  "/:userSchoolId/earned-credit",
  protect,
  authorizeRoles("admin_officer"),
  addEarnedCredit
);

router.post(
  "/:userSchoolId/beginning-balance",
  protect,
  authorizeRoles("admin_officer"),
  createBeginningBalance
);

router.patch(
  "/transactions/:transactionId",
  protect,
  authorizeRoles("admin_officer"),
  updateLedgerTransaction
);

export default router;
import express from "express";

import {
  createSchoolUser,
  getSchoolUsers,
  getInactiveSchoolUsers,
  updateSchoolUser,
  deactivateSchoolUser,
  activateSchoolUser,
  resetUserPassword,
} from "../controllers/userController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("admin_officer"),
  createSchoolUser
);

router.get(
  "/",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  getSchoolUsers
);

router.get(
  "/inactive",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  getInactiveSchoolUsers
);

router.patch(
  "/:id/reset-password",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  resetUserPassword
);

router.patch(
  "/:id",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  updateSchoolUser
);

router.patch(
  "/:id/deactivate",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  deactivateSchoolUser
);

router.patch(
  "/:id/activate",
  protect,
  authorizeRoles("admin_officer", "division_admin"),
  activateSchoolUser
);


export default router;
const express = require("express");
const { body } = require("express-validator");
const {
  sendVerification,
  verifyEmail,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Public
router.post("/send-verification", sendVerification);
router.post("/verify-email", verifyEmail);
router.post("/login", loginValidation, login);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);

module.exports = router;

const crypto = require("crypto");
const { validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require("../utils/emailService");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      currency: user.currency,
      darkMode: user.darkMode,
      isGoogleUser: user.isGoogleUser,
      isEmailVerified: user.isEmailVerified,
      hasPassword: !!user.password, // tells frontend whether current password field is needed
      createdAt: user.createdAt,
    },
  });
};

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Send OTP — step 1 of registration
// @route   POST /api/auth/send-verification
const sendVerification = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existing = await User.findOne({ email }).select("+isEmailVerified");
    if (existing && existing.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please sign in.",
      });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    if (existing && !existing.isEmailVerified) {
      existing.emailVerificationCode = otp;
      existing.emailVerificationExpiry = expiry;
      if (password !== "resend") {
        existing.fullName = fullName;
        existing.password = password;
      }
      await existing.save({ validateBeforeSave: false });
    } else {
      await User.create({
        fullName,
        email,
        password,
        isEmailVerified: false,
        emailVerificationCode: otp,
        emailVerificationExpiry: expiry,
      });
    }

    try {
      await sendVerificationEmail(email, otp, fullName);
    } catch {
      await User.deleteOne({ email, isEmailVerified: false });
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP — step 2
// @route   POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerificationCode +emailVerificationExpiry",
    );
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found for this email",
      });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please sign in.",
      });
    }
    if (
      !user.emailVerificationCode ||
      user.emailVerificationCode !== otp.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check your email.",
      });
    }
    if (user.emailVerificationExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please register again.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiry = null;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.fullName);
    } catch {}

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login with field-specific error messages
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +isEmailVerified",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        field: "email",
        message:
          "No account found with this email address. Please sign up first.",
      });
    }

    if (!user.isEmailVerified && !user.isGoogleUser) {
      return res.status(401).json({
        success: false,
        field: "email",
        message:
          "Please verify your email before signing in. Check your inbox.",
      });
    }

    if (user.isGoogleUser && !user.password) {
      return res.status(401).json({
        success: false,
        field: "email",
        message:
          'This account uses Google Sign-In. Please click "Continue with Google".',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        field: "password",
        message: "Incorrect password. Please try again.",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Google Sign-In — sends welcome email on first sign up
// @route   POST /api/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { credential, accessToken, userInfo } = req.body;
    let googleId, email, name, picture;

    if (credential) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else if (accessToken && userInfo) {
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Google credential is required" });
    }

    if (!email)
      return res.status(400).json({
        success: false,
        message: "Could not retrieve email from Google",
      });

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    let isNewUser = false;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.isGoogleUser = true;
        user.isEmailVerified = true;
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        fullName: name,
        email,
        googleId,
        isGoogleUser: true,
        isEmailVerified: true,
        avatar: picture || "",
      });
      isNewUser = true;
    }

    // Send welcome email on first Google sign-up
    if (isNewUser) {
      try {
        await sendWelcomeEmail(email, name);
      } catch {}
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    if (
      error.message?.includes("Token used too late") ||
      error.message?.includes("Invalid token")
    ) {
      return res.status(401).json({
        success: false,
        message: "Google authentication failed. Please try again.",
      });
    }
    next(error);
  }
};

// @desc    Forgot password — returns error for unregistered emails
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });

    if (!user || !user.isEmailVerified) {
      return res.status(404).json({
        success: false,
        message:
          "No account found with this email address. Please sign up first.",
      });
    }

    if (user.isGoogleUser && !user.password) {
      return res.status(400).json({
        success: false,
        message:
          "This account uses Google Sign-In. Password reset is not available.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user.email, resetToken, user.fullName);
      res.status(200).json({
        success: true,
        message: "Password reset link sent to your email.",
      });
    } catch {
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Please try again.",
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "Both password fields are required" });
    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    if (password.length < 6)
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    }).select("+resetToken +resetTokenExpiry");
    if (!user)
      return res.status(400).json({
        success: false,
        message:
          "Reset link is invalid or has expired. Please request a new one.",
      });

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile
// @route   GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    const userObj = user.toObject();
    userObj.hasPassword = !!user.password;
    delete userObj.password;
    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, currency, darkMode, avatar } = req.body;
    const fields = {};
    if (fullName) fields.fullName = fullName;
    if (currency) fields.currency = currency;
    if (darkMode !== undefined) fields.darkMode = darkMode;
    if (avatar !== undefined) fields.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, fields, {
      new: true,
      runValidators: true,
    }).select("+password");
    const userObj = user.toObject();
    userObj.hasPassword = !!user.password;
    delete userObj.password;
    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Change or set password (Google users can set one)
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword)
      return res
        .status(400)
        .json({ success: false, message: "New password is required" });
    if (newPassword.length < 6)
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });

    const user = await User.findById(req.user._id).select("+password");
    if (user.password) {
      if (!currentPassword)
        return res
          .status(400)
          .json({ success: false, message: "Current password is required" });
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch)
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      hasPassword: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account and all user data
// @route   DELETE /api/auth/account
const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Non-Google users must provide password
    if (!user.isGoogleUser && user.password) {
      const { password } = req.body;
      if (!password)
        return res.status(400).json({
          success: false,
          message: "Password is required to delete account",
        });
      const isMatch = await user.matchPassword(password);
      if (!isMatch)
        return res
          .status(400)
          .json({ success: false, message: "Incorrect password" });
    }

    // Delete all related data
    const Account = require("../models/Account");
    const Transaction = require("../models/Transaction");
    const Debt = require("../models/Debt");

    await Promise.all([
      Account.deleteMany({ user: req.user._id }),
      Transaction.deleteMany({ user: req.user._id }),
      Debt.deleteMany({ user: req.user._id }),
      User.findByIdAndDelete(req.user._id),
    ]);

    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

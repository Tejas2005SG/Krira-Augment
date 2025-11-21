import express from 'express';
import {
    signup,
    verifyOtp,
    resendOtp,
    login,
    logout,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    profile,
    loginWithGoogle,
    signupWithGoogle
} from '../controllers/auth.controller.js';
import { authMiddleware, adminMiddlware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/verifybyotp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshAccessToken); // No authMiddleware - works with expired access tokens
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword/:token", resetPassword);
router.post("/loginwithgoogle", loginWithGoogle);
router.post("/signupwithgoogle", signupWithGoogle);

// Protected routes
router.get("/profile", authMiddleware, profile);

// Admin routes
router.get("/admin/profile", authMiddleware, adminMiddlware, profile);

export default router;
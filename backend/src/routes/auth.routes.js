import express from 'express';
import { signup,verifyOtp, resendOtp, login, logout, forgotPassword, resetPassword, profile, loginWithGoogle, signupWithGoogle} from '../controllers/auth.controller.js';
import { authMiddleware,adminMiddlware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/signup",signup);

router.post("/verifybyotp",verifyOtp);

router.post("/resend-otp",resendOtp);

router.post("/login",login);

router.post("/logout",logout);

router.post("/forgotpassword",forgotPassword);

router.post("/resetpassword/:token",resetPassword);

router.post("/loginwithgoogle",loginWithGoogle);

router.post("/signupwithgoogle",signupWithGoogle);

router.get("/profile",authMiddleware,profile);

//admin
router.get("/admin/profile",authMiddleware,adminMiddlware,profile);


export default router;
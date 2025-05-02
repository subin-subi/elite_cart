import { Router } from "express";
import authController from "../controller/user/signupController.js"; 
import otpController from "../controller/user/otpController.js";
import userMiddleware from "../middlewares/userMiddleware.js";



const route = Router();

route.get("/check-session",authController.checkSession)

route.get("/signup", userMiddleware.isLogin, authController.getSignUp);

route.post("/signup", authController.postSignup);

route.post("/validate-otp", otpController.validateOTP);

route.post("/resend-otp", otpController.resendOTP);

route.get('/login', userMiddleware.isLogin, authController.getLogin)

route.post("/login",authController.postLogin)

route.get("/home",  authController.homepage)

route.get('/forgot-password', authController.getForgotPassword)

route.post("/forgot-password/send-otp", otpController.sendForgotPasswordOTP)

route.post("/forgot-password/verify-otp", otpController.verifyForgotPasswordOTP)

route.post("/forgot-password/reset-password",authController.resetPassword)

route.get("/change-password", userMiddleware.checkSession, authController.getChangePassword)

route.post("/change-password", userMiddleware.checkSession, authController.postChangePassword)

route.get("/auth/google", authController.getGoogle)

route.get('/auth/google/callback', authController.getGoogleCallback);

route.post("/logout", authController.getLogout)


    
export default route; 



// google auth
//56633159242-0c6c2bnrcquial130b54e42gi3urm6tb.apps.googleusercontent.com
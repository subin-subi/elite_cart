import { Router } from "express";
import authController from "../controller/user/signupController.js"; 

import userMiddleware from "../middlewares/userMiddleware.js";



const route = Router();

route.get("/signup", userMiddleware.isLogin, authController.getSignUp);

route.post("/signup", authController.postSignup);

route.post("/validate-otp", authController.validateOTP);

route.post("/resend-otp", authController.resendOTP);

route.get('/login', userMiddleware.isLogin, authController.getLogin)

route.post("/login",authController.postLogin)

route.get("/home",  authController.homepage)

route.get('/forgot-password', authController.getForgotPassword)

route.post("/forgot-password/send-otp", authController.sendForgotPasswordOTP)

route.post("/forgot-password/verify-otp", authController.verifyForgotPasswordOTP)

route.post("/forgot-password/reset-password",authController.resetPassword)

route.get("/change-password", userMiddleware.checkSession, authController.getChangePassword)

route.post("/change-password", userMiddleware.checkSession, authController.postChangePassword)

route.get("/auth/google", authController.getGoogle)

route.get('/auth/google/callback', authController.getGoogleCallback);

route.get("/logout", authController.getLogout)



export default route; 



// google auth
//56633159242-0c6c2bnrcquial130b54e42gi3urm6tb.apps.googleusercontent.com
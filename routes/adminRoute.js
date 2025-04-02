import express from "express";
import authController from "../controller/admin/signupController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import dashboardController from "../controller/admin/dashboardController.js";  
import userController from "../controller/admin/userController.js";
import categoryController from "../controller/admin/categoryController.js";
const router = express.Router();


// router.use((req,res,next) => {
// req.session.admin = true
// next()
// })
 
router.get("/login", adminMiddleware.isLogin, authController.getAdmin);

router.post("/login", authController.postAdmin);

router.get("/dashboard", adminMiddleware.checkSession, dashboardController.getDashboard);

router.get("/logout", authController.getLogout);

router.get("/userlist",userController.getUserList)

router.post("/toggle-block", adminMiddleware.checkSession, userController.getToggle)

router.get("/category", categoryController.categoryController)
export default router; 

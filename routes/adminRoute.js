import express from "express";
import authController from "../controller/admin/signupController.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import dashboardController from "../controller/admin/dashboardController.js";  
import userController from "../controller/admin/userController.js";
import categoryController from "../controller/admin/categoryController.js";
import productController from "../controller/admin/productController.js";
import orderController from "../controller/admin/orderController.js";
const router = express.Router();



 
router.get("/login", adminMiddleware.isLogin, authController.getAdmin);

router.post("/login", authController.postAdmin);

router.get("/dashboard", adminMiddleware.checkSession, dashboardController.getDashboard);

router.get("/logout", authController.getLogout);

router.get("/userlist",userController.getUserList)

router.post("/toggle-block", adminMiddleware.checkSession, userController.getToggle)


//////////////////////////////////////////////////////////////////////////////////////////////

router.get("/category", categoryController.getCategory)

router.post("/add-category", categoryController.addCategory)

router.get("/category/:id", categoryController.getCategoryById)

router.put("/edit-category/:id", categoryController.updateCategory)

router.get("/archived-category", categoryController.archivedCategory)

router.patch("/categories/restore/:id", categoryController.restoreCategory)

router.patch("/hide-category/:id", categoryController.hideCategory)



/////////////////////////////////////////////////////////////////////////////
router.get("/products", productController.getProduct)

router.post("/add-product", productController.addProduct)

router.get("/Orders", orderController.getAllOrders)


export default router; 

import express from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authController from "../controller/admin/signupController.js";
import dashboardController from "../controller/admin/dashboardController.js";
import userController from "../controller/admin/userController.js";
import categoryController from "../controller/admin/categoryController.js";
import productController from "../controller/admin/productController.js";
import orderController from "../controller/admin/orderController.js";
import { upload, storage, handleMulterError } from "../utils/multer.js";

const router = express.Router();

// Auth Routes
router.get("/login", adminMiddleware.isLogin, authController.getAdmin);
router.post("/login", authController.postAdmin);
router.get("/logout", authController.getLogout);

// Dashboard
router.get("/dashboard", adminMiddleware.checkSession, dashboardController.getDashboard);

// User Management
router.get("/userlist", userController.getUserList);
router.post("/toggle-block", adminMiddleware.checkSession, userController.getToggle);

// Category Management
router.get("/category", categoryController.getCategory);
router.post("/add-category", categoryController.addCategory);
router.get("/category/:id", categoryController.getCategoryById);
router.put("/edit-category/:id", categoryController.updateCategory);
router.get("/archived-category", categoryController.archivedCategory);
router.patch("/categories/restore/:id", categoryController.restoreCategory);
router.patch("/hide-category/:id", categoryController.hideCategory);

// Product Management
router.get("/products", productController.getProduct);
router.post("/add-product", upload.array("images", 3), productController.addProduct);
router.get("/edit-product/:id", productController.productUpdate);
router.post("/edit-product/:id", upload.array("images", 3), handleMulterError, productController.updateProduct);
router.delete("/delete-product/:id", productController.deleteProduct);

// Orders
router.get("/Orders", orderController.getAllOrders);

export default router;

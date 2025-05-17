import Product from '../../model/productModel.js';
import Category from '../../model/categoryModel.js';
import Company from '../../model/companyModel.js';
import { upload, storage, cloudinary, handleMulterError } from "../../utils/multer.js"
import multer from 'multer';
import fs from 'fs';

// Validate product name
const validateProductName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new Error('Product name is required and must be a string');
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length < 3) {
    throw new Error('Product name must be at least 3 characters long');
  }
  
  if (trimmedName.length > 100) {
    throw new Error('Product name must be less than 100 characters');
  }
  
  return trimmedName;
};

// Configure Multer for product images
const productUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'subImages', maxCount: 4 }
]);

// ✅ Get Products
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of products per page
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find()
      .populate("categoriesId")
      .populate("companyId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/Products", {
      products,
      title: "Products",
      path: "/admin/Products",
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};

const getAddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    const companies = await Company.find();
    res.render("admin/add-product", {
      categories,
      companies,
      title: "Add Product",
      path: "/admin/Products",
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

const addProduct = async (req, res) => {
  try {
    const { productName, categoriesId, companyId, price, stock, color, description } = req.body;
    const media = req.files;

    if (!productName || !categoriesId || !companyId || !price || !stock || !color || !media || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const imageUrls = [];
    for (const file of media) {
      const result = await cloudinary.uploader.upload(file.path);
      imageUrls.push(result.secure_url);
      fs.unlinkSync(file.path);
    }

    const product = new Product({
      productName,
      categoriesId,
      companyId,
      price,
      stock,
      color,
      media: imageUrls,
      description,
    });

    await product.save();
    res.redirect("/admin/Products");
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Error adding product" });
  }
};

const getEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categoriesId")
      .populate("companyId");
    const categories = await Category.find();
    const companies = await Company.find();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.render("admin/edit-product", {
      product,
      categories,
      companies,
      title: "Edit Product",
      path: "/admin/Products",
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productName, categoriesId, companyId, price, stock, color, description } = req.body;
    const media = req.files;

    if (!productName || !categoriesId || !companyId || !price || !stock || !color || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let imageUrls = product.media;
    if (media && media.length > 0) {
      for (const file of media) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    product.productName = productName;
    product.categoriesId = categoriesId;
    product.companyId = companyId;
    product.price = price;
    product.stock = stock;
    product.color = color;
    product.media = imageUrls;
    product.description = description;

    await product.save();
    res.redirect("/admin/Products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();
    res.redirect("/admin/Products");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
};

const hideProduct = async (req, res) => {
    const productId = req.params.id;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        await Product.findByIdAndUpdate(productId, { isHidden: true });
        res.status(200).json({ success: true, message: 'Product hidden successfully' });

    } catch (error) {
        console.error("Error hiding product:", error);
        res.status(500).json({ success: false, message: 'Error hiding product' });
    }
};

const restoreProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        await Product.findByIdAndUpdate(productId, { isHidden: false });
        res.status(200).json({ success: true, message: 'Product restored successfully' });
    } catch (error) {
        console.error("Error restoring product:", error);
        res.status(500).json({ success: false, message: 'Error restoring product' });
    }
};

export default {
  getProducts,
  getAddProduct,
  addProduct,
  getEditProduct,
  updateProduct,
  deleteProduct,
  hideProduct,
  restoreProduct
};

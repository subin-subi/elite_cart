// controllers/admin/productController.js

import Product from '../../model/productModel.js';
import Category from '../../model/categoryModel.js';

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Configure Multer + Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const uploadMultiple = multer({ storage }).array('images', 3);

// ✅ Product Name Validator
const validateProductName = (name) => {
  if (!name || typeof name !== 'string') {
    throw new Error('Product name is required and must be a string');
  }
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 50) {
    throw new Error('Product name must be between 3 and 50 characters');
  }
  return trimmed;
};

// ✅ Get Products
const getProduct = async (req, res) => {
  try {
    const products = await Product.find().populate('categoriesId');
    const categories = await Category.find({ isActive: true });

    res.render('admin/products', {
      products,
      categories,
      currentPage: 1,
      totalPages: 1,
    });
  } catch (error) {
    console.error('Error loading product page:', error);
    res.status(500).send('Internal Server Error');
  }
};

// ✅ Add Product (Cloudinary Upload)
const addProduct = async (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
        console.log("FILES RECEIVED:", req.files);
      if (!req.files || req.files.length !== 3) {
        return res.status(400).json({ message: 'Please upload exactly 3 images' });
      }

      const { productName, categoriesId, color, description, price, stock } = req.body;

      if (!productName || !categoriesId || !color || !description || !price || !stock) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      let validatedName;
      try {
        validatedName = validateProductName(productName);
      } catch (validationError) {
        return res.status(400).json({ message: validationError.message });
      }

      const categoryExists = await Category.findById(categoriesId);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category selected' });
      }

      const existingProduct = await Product.findOne({
        productName: validatedName,
        _id: { $ne: req.params.id },
      });

      if (existingProduct) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }

      // ✅ Cloudinary secure URLs
      const imageUrls = req.files.map((file) => file.path);

      const newProduct = new Product({
        productName: validatedName,
        categoriesId,
        color: color.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl: imageUrls,
        isActive: true,
      });

      await newProduct.save();
      res.status(201).json({ message: 'Product added successfully' });
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(400).json({ message: error.message || 'Error adding product' });
    }
  });
};

export default {
  getProduct,
  addProduct,
};

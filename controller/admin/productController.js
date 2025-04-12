import Product from "../../model/productModel.js"
import category  from "../../model/categoryModel.js";
import multer from "multer";
import fs from "fs"
import path from "path"
import { arch } from "os";

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadMultiple = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (validTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed'));
        }
    }
}).array('images', 3);

// Validation functions
const validateProductName = (name) => {
    if (!name || typeof name !== 'string') {
        throw new Error('Product name is required and must be a string');
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
        throw new Error('Product name must be between 3 and 50 characters');
    }
    return trimmedName;
};

const getproduct = async (req, res) => {
  try {
    const products = await Product.find().populate('categoriesId'); 
    const categories = await category.find({ isActive: true });

    res.render('admin/products', {
      products, 
      categories,
      currentPage: 1, 
      totalPages: 1
    });
  } catch (error) {
    console.log('Error loading product page:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Add New Product
const addProduct = async (req, res) => {
    uploadMultiple(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            // Check if files were uploaded
            if (!req.files || req.files.length !== 3) {
                return res.status(400).json({ message: 'Please upload exactly 3 images' });
            }

            const {
                productName,
                categoriesId,
                color,
                description,
                price,
                stock
            } = req.body;

            // Validate required fields
            if (!productName || !categoriesId || !color || !description || !price || !stock) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // Validate product name
            let validatedName;
            try {
                validatedName = validateProductName(productName);
            } catch (validationError) {
                return res.status(400).json({ message: validationError.message });
            }

            // Check if category exists
            const categoryExists = await category.findById(categoriesId);
            if (!categoryExists) {
                return res.status(400).json({ message: 'Invalid category selected' });
            }

            // Check for duplicate product name
            const existingProduct = await Product.findOne({
                productName: validatedName,
                _id: { $ne: req.params.id }
            });
            
            if (existingProduct) {
                return res.status(400).json({ message: 'A product with this name already exists' });
            }

            // Process and save the images
            const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);

            const newProduct = new Product({
                productName: validatedName,
                categoriesId,
                color: color.trim(),
                description: description.trim(),
                price: parseFloat(price),
                stock: parseInt(stock),
                imageUrl: imageUrls,
                isActive: true
            });

            await newProduct.save();
            res.status(201).json({ message: 'Product added successfully' });

        } catch (error) {
            // Delete uploaded files if there's an error
            if (req.files) {
                req.files.forEach(file => {
                    const filePath = path.join(process.cwd(), 'public', 'uploads', 'products', file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                });
            }
            
            console.error('Error adding product:', error);
            res.status(400).json({ message: error.message || 'Error adding product' });
        }
    });
};

const getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoriesId');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Convert to plain object and sanitize
        const sanitizedProduct = {
            _id: product._id.toString(),
            productName: product.productName,
            brand: product.brand,
            gender: product.gender,
            categoriesId: {
                _id: product.categoriesId._id.toString(),
                name: product.categoriesId.name
            },
            color: product.color,
            description: product.description,
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl || [],
            isActive: product.isActive
        };

        res.json(sanitizedProduct);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Error fetching product details' });
    }
};






export default { getproduct, addProduct };

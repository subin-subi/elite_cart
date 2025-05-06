import Product from '../../model/productModel.js';
import Category from '../../model/categoryModel.js';

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

//  Configure Cloudinary
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

const addProduct = async (req, res) => {
  try {
    const { productName, categoriesId, color, description, price, stock } = req.body;
    const files = req.files;

    if (!productName || !categoriesId || !color || !description || !price || !stock) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one image' });
    }

    let validatedName;
    try {
      validatedName = validateProductName(productName);
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock);
    if (isNaN(parsedPrice) || isNaN(parsedStock)) {
      return res.status(400).json({ message: 'Price and stock must be valid numbers' });
    }

    const categoryExists = await Category.findById(categoriesId);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category selected' });
    }

    const existingProduct = await Product.findOne({ productName: validatedName });
    if (existingProduct) {
      return res.status(400).json({ message: 'A product with this name already exists' });
    }

    const imageUrls = [];
    for (const file of files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'products'
        });
        imageUrls.push(result.secure_url);
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    const newProduct = new Product({
      productName: validatedName,
      categoriesId,
      color,
      description,
      price: parsedPrice,
      stock: parsedStock,
      imageUrl: imageUrls,
      isActive: true
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully' });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product' });
  }
};


const productUpdate = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const categories = await Category.find({ isActive: true });
    
    if (!product) {
      return res.status(404).send('Product not found');
    }
    res.render('admin/product-edit', { product, categories });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Error updating product');
  }
}

const upload = multer({ dest: "uploads/" }); 

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { productName, categoriesId, color, description, price, stock } = req.body;
    const files = req.files;
    
    console.log('Files received:', files);
    console.log('Request body:', req.body);

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
      _id: { $ne: productId }
    });

    if (existingProduct) {
      return res.status(400).json({ message: 'A product with this name already exists' });
    }

    // Get the current product to maintain existing images
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let imageUrls = [...(currentProduct.imageUrl || [])];
    console.log('Current image URLs:', imageUrls);

    // Handle new image uploads
    if (files && files.length > 0) {
      console.log('Processing new files:', files.length);
      
      for (const file of files) {
        try {
          console.log('Processing file:', file.originalname);
          
          // Get the index of the image being updated from the file name
          const fileIndex = parseInt(file.originalname.split('-')[1]);
          console.log('File index:', fileIndex);
          
          if (!isNaN(fileIndex) && fileIndex >= 0 && fileIndex < 3) {
            // Delete the old image from Cloudinary if it exists
            if (imageUrls[fileIndex]) {
              try {
                console.log('Deleting old image:', imageUrls[fileIndex]);
                const publicId = imageUrls[fileIndex].split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`products/${publicId}`);
              } catch (error) {
                console.error('Error deleting old image:', error);
                // Continue with upload even if deletion fails
              }
            }

            // Upload the new image
            try {
              console.log('Uploading new image to Cloudinary');
              const result = await cloudinary.uploader.upload(file.path, {
                folder: 'products',
                resource_type: 'auto',
                format: 'webp'
              });
              console.log('Cloudinary upload result:', result.secure_url);
              imageUrls[fileIndex] = result.secure_url;
            } catch (error) {
              console.error('Error uploading image to Cloudinary:', error);
              return res.status(500).json({ 
                message: 'Error uploading image',
                error: error.message 
              });
            }
          } else {
            console.log('Invalid file index or out of range');
          }
        } catch (error) {
          console.error('Error processing file:', error);
          return res.status(500).json({ 
            message: 'Error processing file',
            error: error.message 
          });
        }
      }
    } else {
      console.log('No new files to process');
    }

    // Ensure we have exactly 3 image URLs
    while (imageUrls.length < 3) {
      imageUrls.push('');
    }
    imageUrls = imageUrls.slice(0, 3);

    console.log('Final image URLs:', imageUrls);

    // Update product
    const updateData = {
      productName: validatedName,
      categoriesId,
      color,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      imageUrl: imageUrls
    };

    

    // Update the product document
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify the update was successful
    const verifiedProduct = await Product.findById(productId);
    console.log('Verified product after update:', verifiedProduct);

    if (!verifiedProduct) {
      return res.status(500).json({ message: 'Failed to verify product update' });
    }

    res.status(200).json({ 
      message: 'Product updated successfully',
      product: verifiedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Error updating product',
      error: error.message 
    });
  }
}

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const deleted = await Product.findByIdAndDelete(productId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



export default {
  getProduct, 
  addProduct,
  productUpdate,
  updateProduct,
  deleteProduct
};

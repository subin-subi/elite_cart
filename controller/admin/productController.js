import Product from "../../model/productModel.js"
import category  from "../../model/categoryModel.js";
import multer from "multer";
// Configure where and how to store uploaded files
const storage = multer.memoryStorage(); // or use diskStorage if you want to store locally
const upload = multer({ storage: storage });

// This handles multipart/form-data (text + files)

const getproduct = async (req, res) => {
  try {
    const products = await Product.find(); // fetch products from DB

    res.render('admin/products', {
      products, // ✅ sending 'products' to EJS
      currentPage: 1, // default for now
      totalPages: 1
    });
  } catch (error) {
    console.log('Error loading product page:', error);
    res.status(500).send('Internal Server Error');
  }
};


// Your controller
const addProduct = async (req, res) => {
    try {
      const data = req.body;        
    } catch (err) {
      console.log(err);
      res.status(500).send("Something went wrong");
    }
  };
  
export default { getproduct, addProduct };

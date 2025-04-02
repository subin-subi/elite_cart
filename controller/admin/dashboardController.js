import Product from '../../model/productModel.js' // Import your product model

// const getDashboard = async (req, res) => {
//     try {
//         const products = await Product.find(); // Fetch all products from the database
//         res.render('admin/dashboard', { products }); // Pass products to the EJS template
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };
// export default  { getDashboard };

const getDashboard = (req, res) => {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.render('admin/dashboard');
};

export default { getDashboard };
import Product from '../../model/productModel.js';

const getProduct = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).populate('categoriesId');
        console.log('Products found:', products); // Debug log
        
        // Ensure each product has imageUrl array
        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            imageUrl: product.imageUrl || [],
            title: product.productName,
            price: product.price,
            description: product.description,
            rating: product.rating || 0,
            reviews: product.reviews || 0,
            duration: product.duration || 0
        }));

        console.log('Formatted products:', formattedProducts); // Debug log
        res.render('user/product', { products: formattedProducts });
    } catch (error) {
        console.error('Error fetching products:', error);   
        res.status(500).send('Error fetching products');
    }
}

export default { getProduct };



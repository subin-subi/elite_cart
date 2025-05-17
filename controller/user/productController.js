import Product from '../../model/productModel.js';

const getProduct = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate('categoriesId')
            .populate('companyId');
        
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

        res.render('user/product', { products: formattedProducts });
    } catch (error) {
        console.error('Error fetching products:', error);   
        res.status(500).send('Error fetching products');
    }
}

const getProductDetail = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId)
            .populate('categoriesId')
            .populate('companyId');
        
        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }

        // Get related products by category
        const relatedByCategory = await Product.find({
            categoriesId: product.categoriesId._id,
            _id: { $ne: productId },
            isActive: true
        })
        .populate('categoriesId')
        .populate('companyId')
        .limit(3);

        // Get related products by company
        const relatedByCompany = await Product.find({
            companyId: product.companyId._id,
            _id: { $ne: productId },
            isActive: true
        })
        .populate('categoriesId')
        .populate('companyId')
        .limit(3);
      
        res.render('user/productdetail', { 
            product,
            relatedByCategory,
            relatedByCompany
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).render('error', { message: 'Error fetching product details' });
    }
}

export default { getProduct, getProductDetail };



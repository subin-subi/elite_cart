import Company from "../../model/companyModel.js";
import Category from "../../model/categoryModel.js";
import Product from "../../model/productModel.js";





const getArchivedItems = async (req, res) => {
    try {
        // Fetch all archived items
        const [companies, categories, products] = await Promise.all([
            Company.find({ isHidden: true }).sort({ createdAt: -1 }),
            Category.find({ isHidden: true }).sort({ createdAt: -1 }),
            Product.find({ isHidden: true }).sort({ createdAt: -1 })
        ]);

        res.render("admin/archived", {
            companies,
            categories,
            products
        });
    } catch (error) {
        console.error("Error fetching archived items:", error);
        res.status(500).send("Internal Server Error");
    }
};

export { getArchivedItems };
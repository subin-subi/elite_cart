import Category from "../../model/categoryModel.js"; 

const categoryController = async (req, res) => {
    try {
        const categories = await Category.find(); // Fetch categories from DB
        res.render("admin/category", { categories }); // Pass categories to EJS
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal Server Error");
    }
};

export default {categoryController};

import { log } from "console";
import Category from "../../model/categoryModel.js"; 

const getCategory = async (req, res) => {
    try {
        const categories = await Category.find({ isHidden: false }).sort({ createdAt: -1 }); // Only visible categories
        res.render("admin/category", { categories }); // Pass to EJS
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal Server Error");
    }
};



const addCategory = async (req, res) => {
    try {
        // Check if we have the required data
        if (!req.body || !req.body.categoryName) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const { categoryName } = req.body;
        const trimmedCategoryName = categoryName.trim();

        // Validate categoryName
        if (!/^[A-Za-z]+$/.test(trimmedCategoryName)) {
            return res.status(400).json({
                success: false,
                message: 'Category name can only contain alphabets.'
            });
        }

        if (trimmedCategoryName.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Category name must not exceed 10 characters.'
            });
        }

        // Capitalize first letter, rest lowercase
        const formattedCategoryName = trimmedCategoryName.charAt(0).toUpperCase() + 
                                      trimmedCategoryName.slice(1).toLowerCase();

        // Check if category name already exists (case-insensitive)
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${formattedCategoryName}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists.'
            });
        }

        const newCategory = new Category({
            name: formattedCategoryName,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        });

        await newCategory.save();

        return res.status(201).json({
            success: true,
            message: 'Category added successfully',
            category: newCategory
        });
    } catch (error) {
        console.error('Error adding category:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding category.',
            error: error.message
        });
    }
};


const editCategory = async (req, res) => {
    try {
        const { categoryId, categoryName } = req.body;
        const trimmedCategoryName = categoryName.trim();

        // Validate categoryName
        if (!/^[A-Za-z]+$/.test(trimmedCategoryName)) {
            return res.status(400).send('Category name can only contain alphabets.');
        }
        if (trimmedCategoryName.length > 10) {
            return res.status(400).send('Category name must not exceed 10 characters.');
        }

        // Capitalize first letter, rest lowercase
        const formattedCategoryName = trimmedCategoryName.charAt(0).toUpperCase() + 
                                    trimmedCategoryName.slice(1).toLowerCase();

        // Check if category name already exists (excluding current category)
        const existingCategory = await Category.findOne({
            _id: { $ne: categoryId },
            name: { $regex: new RegExp(`^${formattedCategoryName}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(400).send('Category name already exists.');
        }

       
        await Category.findByIdAndUpdate(categoryId, {
            name: formattedCategoryName,
        });

        res.redirect('/admin/category');
    } catch (error) {
        console.error('Error editing category:', error);
        res.status(500).send('Error editing category.');
    }
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////



// Get a category by ID
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        res.json({ success: true, category });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const { categoryName: name } = req.body;
       const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        const category = await Category.findByIdAndUpdate(req.params.id, { name: formattedName }, { new: true });

        if (!category) return res.status(404).json({ success: false, message: "Category not found" });

        res.json({ success: true, message: "Category updated successfully", category });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const hideCategory = async (req, res) => {
    const categoryId = req.params.id;

    try {
        const categories = await Category.find({ isHidden: false });
        if (!categories) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await Category.findByIdAndUpdate(categoryId, { isHidden: true });
        res.status(200).json({ success: true, message: 'Category hidden successfully' });

    } catch (error) {
        console.error("Error hiding category:", error);
        res.status(500).json({ success: false, message: 'Error hiding category' });
    }
};




// Hide or Show Category (Toggle)
const archivedCategory = async (req, res) => {
    const categories = await Category.find({ isHidden: true }).sort({ createdAt: -1 });
    console.log(categories);
    res.render('admin/archived-category', { categories });
        }

        const restoreCategory = async (req, res) => {
            
            const categoryId = req.params.id;
            try {
                // Update the category to mark it as not hidden
                await Category.findByIdAndUpdate(categoryId, { isHidden: false });
                res.status(200).json({ message: 'Category restored successfully' });
            } catch (error) {
                res.status(500).json({ message: 'Error restoring category' });
            }
        };
        



export default {getCategory, addCategory, editCategory, getCategoryById,
     updateCategory,archivedCategory,restoreCategory,hideCategory};

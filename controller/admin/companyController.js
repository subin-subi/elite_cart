import { log } from "console";
import Company from "../../model/companyModel.js"; 

const getCompany = async (req, res) => {
    try {
        const companies = await Company.find({ isHidden: false }).sort({ createdAt: -1 }); // Only visible companies
        res.render("admin/company", { companies }); // Pass to EJS
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addCompany = async (req, res) => {
    try {
        // Check if we have the required data
        if (!req.body || !req.body.companyName) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }

        const { companyName } = req.body;
        const trimmedCompanyName = companyName.trim();

        // Validate companyName
        if (!/^[A-Za-z]+$/.test(trimmedCompanyName)) {
            return res.status(400).json({
                success: false,
                message: 'Company name can only contain alphabets.'
            });
        }

        if (trimmedCompanyName.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Company name must not exceed 10 characters.'
            });
        }

        // Capitalize first letter, rest lowercase
        const formattedCompanyName = trimmedCompanyName.charAt(0).toUpperCase() + 
                                      trimmedCompanyName.slice(1).toLowerCase();

        // Check if company name already exists (case-insensitive)
        const existingCompany = await Company.findOne({
            name: { $regex: new RegExp(`^${formattedCompanyName}$`, 'i') }
        });

        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'Company name already exists.'
            });
        }

        const newCompany = new Company({
            name: formattedCompanyName,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        });

        await newCompany.save();

        return res.status(201).json({
            success: true,
            message: 'Company added successfully',
            company: newCompany
        });
    } catch (error) {
        console.error('Error adding company:', error);
        return res.status(500).json({
            success: false,
            message: 'Error adding company.',
            error: error.message
        });
    }
};

const editCompany = async (req, res) => {
    try {
        const { companyId, companyName } = req.body;
        const trimmedCompanyName = companyName.trim();

        // Validate companyName
        if (!/^[A-Za-z]+$/.test(trimmedCompanyName)) {
            return res.status(400).send('Company name can only contain alphabets.');
        }
        if (trimmedCompanyName.length > 10) {
            return res.status(400).send('Company name must not exceed 10 characters.');
        }

        // Capitalize first letter, rest lowercase
        const formattedCompanyName = trimmedCompanyName.charAt(0).toUpperCase() + 
                                    trimmedCompanyName.slice(1).toLowerCase();

        // Check if company name already exists (excluding current company)
        const existingCompany = await Company.findOne({
            _id: { $ne: companyId },
            name: { $regex: new RegExp(`^${formattedCompanyName}$`, 'i') }
        });

        if (existingCompany) {
            return res.status(400).send('Company name already exists.');
        }

        await Company.findByIdAndUpdate(companyId, {
            name: formattedCompanyName,
        });

        res.redirect('/admin/company');
    } catch (error) {
        console.error('Error editing company:', error);
        res.status(500).send('Error editing company.');
    }
};

// Get a company by ID
const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }
        res.json({ success: true, company });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update company
const updateCompany = async (req, res) => {
    try {
        const { companyName: name } = req.body;
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        const company = await Company.findByIdAndUpdate(req.params.id, { name: formattedName }, { new: true });

        if (!company) return res.status(404).json({ success: false, message: "Company not found" });

        res.json({ success: true, message: "Company updated successfully", company });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const hideCompany = async (req, res) => {
    const companyId = req.params.id;

    try {
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company not found" });
        }

        await Company.findByIdAndUpdate(companyId, { isHidden: true });
        res.status(200).json({ success: true, message: 'Company hidden successfully' });

    } catch (error) {
        console.error("Error hiding company:", error);
        res.status(500).json({ success: false, message: 'Error hiding company' });
    }
};

// Hide or Show Company (Toggle)
const archivedCompany = async (req, res) => {
    try {
        const companies = await Company.find({ isHidden: true }).sort({ createdAt: -1 });
        res.render('admin/archived-company', { companies });
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).send("Internal Server Error");
    }
};

const restoreCompany = async (req, res) => {
    const companyId = req.params.id;
    try {
        // Update the company to mark it as not hidden
        await Company.findByIdAndUpdate(companyId, { isHidden: false });
        res.status(200).json({ message: 'Company restored successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error restoring company' });
    }
};

export default {
    getCompany,
    addCompany,
    editCompany,
    getCompanyById,
    updateCompany,
    hideCompany,
    archivedCompany,
    restoreCompany
};

import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        unique:true,
        required: [true, "Company name is required"],
        trim: true,
        minLength: [1, "Company name cannot be empty"],
        maxLength: [10, "Company name must be less than 10 characters"],
        match: [/^[a-zA-Z]+$/, "Company name must contain only alphabets"]
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isHidden: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

const Company = mongoose.model("Company", companySchema);
export default Company;

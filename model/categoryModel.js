import mongoose from "mongoose"
const categorySchema = new mongoose.Schema({

    name :{
        type : String,
        required : [true, "category name is required"],
        trim : true,
        minLength : [1, "category name  cannot be empty"],
        maxLength : [10, "category name must be less than 10 charaters"],
        match: [/^[a-zA-Z0-9\s]+$/, "category name must be alphanumeric"],
    },

    description :{
        type : String,
        required : [true, "category description is required"],
        minLength : [1, "category description cannot be empty"],
        maxLength : [100, "category description must be less than 100 charaters"],
    },
    isActive :{
        type : Boolean,
        default : true,
    }
},
{timestamps : true}


)
const Category = mongoose.model("category", categorySchema)
export default Category;

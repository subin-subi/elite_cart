import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
     orderCode:{
        type : String,
        unique : true
     },
     items : [{
        product : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Product",
            required : true
        },
        quantity:{
            type : Number,
            required : true,
            min : [1, "quantity must be greater than 0"]
        },
        price : {
            type : Number,
            required : true
        },
        discountedPrice : {
            type : Number,
            default : 0
        },
        subtotal :{
            type : Number,
            required : true
        },
        order:{
            status : {
            type : String,
            enum : ["pending", "processing", "shipped", "delivered",
                 "cancelled","returned", "refund processing"],
            default  : "pending"
        },
        statusHistory : [{
            status : {
                type : String,
                enum : ["pending", "processing", "shipped", "delivered", "cancelled",
                    "returned", "refund processing"],
                        required : true
                },
                date :{
                    type : Date,
                    default : Date.now
                },
                comment : String
            
        }]
    },
    return :{
        isReturnRequested:{
            type : Boolean,
            default : false
        },
        reason :{
            type : String,
            default : null
        },

        requestDate:{
            type : Date,
            dafault: null
        },
        status : {
            type : String,
            enum : ["pending", "approved", "rejected"],
            default : null
    },
    adminComment : {
        type : String,
        default : null
    },
    isReturnAccepted : {
        type : Boolean,
        default : false
    },
},
}],
totalAmount : {
    type : Number,
    required : true
},
coupon:{
    code : {
        type : String,
        required : null
    },
    discount : {
        type : Number,
        default : 0
    }
},

 shippingAddress :{
    fullName : String,
    mobileNumber : String,
    addressLine1 : String,
    addressLine2 : String,
    city : String,
    state : String,
    pincode : Number
 },
 payment :{
    method :{
        type : String,
        enum : ["COD", "Online", "Wallet", "razorpay"],
        required : true
    },
    paymentStatus:{
        type : String,
        enum : ["processing", " completed", "failed", "refunded","Cancelled","refund processing"],
        dafault : null
    },
     walletTransation:{
        transactionId :{
            type : mongoose.Schema.Types.ObjectId,
            ref : "Wallet.Transations"
        },
         amount : Number
     },
     razorpayTransaction:{
        razorpayOrderId : String,
        razorpayPaymentId : String,
        razorpaySignature : String
     }

 },
  orderDate :{
    type : Date,
    default : Date.now
  },
},{timestamps : true})



// Pre-save middleware to generate orderCode

orderSchema.pre("save", function(next){
    if(!this.orderCode && this._id){
        const day = this.createdAt.getDate().toString().padStart(2, "0");
        const month = (this.createdAt.getMonth() + 1).toString().padStart(2, "0");
        const year = this.createdAt.getFullYear();
        const dateStr = `${day}${month}${year}`;
        const idSuffix = this._id.toString().slice(-6);
        this.orderCode = `${dateStr}-${idSuffix}`;

    }
    next();
})
 export default mongoose. model("order", orderSchema)
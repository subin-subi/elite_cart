import {generateOTP, sendOTPEmail} from "../../utils/sendOTP.js"
import userSchema from "../../model/userModel.js"; 





const validateOTP = async (req, res) => {
    try {
        const { userOtp, email } = req.body;

        const user = await userSchema.findOne({ email });

        if (!user) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid OTP" 
            });
        }

        // Check too many attempts
        if (user.otpAttempts >= 3) {
            return res.status(400).json({ 
                success: false,
                error: "Too many attempts. Please signup again."
            });
        }

        // Check if OTP expired
        if (!user.otpExpiresAt || Date.now() > user.otpExpiresAt) {
            return res.status(400).json({ 
                success: false,
                error: "OTP Expired" 
            });
        }

        // Verify OTP
        if (String(user.otp) === String(userOtp)) {  
            await userSchema.findByIdAndUpdate(user._id, {
                $set: { isverified: true },
                $unset: { otp: 1, otpExpiresAt: 1, otpAttempts: 1 }
            });

            req.session.user = user._id;
            return res.json({
                success: true,
                message: "OTP verified successfully",
                redirectUrl: "/home"
            });
        } else {
            // Increment OTP attempts
            await userSchema.findByIdAndUpdate(user._id, {
                $inc: { otpAttempts: 1 }
            });
            
            return res.status(400).json({ 
                success: false,
                error: "Invalid OTP" 
            });
        }

    } catch (error) {
        console.error("OTP verification error:", error);
        return res.status(500).json({ 
            success: false,
            error: "OTP verification failed" 
        });
    }
};


const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await userSchema.findOne({ email });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent multiple OTP requests
        if (user.otpExpiresAt && Date.now() < user.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Please wait before requesting a new OTP"
            });
        }

        // Generate new OTP
        const newOTP = generateOTP();
        
        // Update user with new OTP
        await userSchema.findByIdAndUpdate(user._id, {
            otp: newOTP,
            otpExpiresAt: Date.now() + 120000, // 2 minutes
            otpAttempts: 0
        });

        // Send new OTP
        await sendOTPEmail(email, newOTP);

        return res.json({
            success: true,
            message: "OTP resent successfully"
        });

    } catch (error) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP"
        });
    }
};


const sendForgotPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user
        const user = await userSchema.findOne({
            email: { $regex: new RegExp("^" + email + "$", "i") }
        });
        
        if (!user) {
            console.log("User not found in DB");
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!user.password) {
            return res.status(400).json({ 
                message: 'This email is linked to Google login. Please login with Google.' 
            });
        }
        
        // Generate and save OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiresAt = Date.now() + 120000;
        user.otpAttempts = 0;
        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp);
        
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

const verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const user = await userSchema.findOne({ 
            email,
            otp,
            otpExpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Increment attempts
        user.otpAttempts += 1;
        if (user.otpAttempts >= 3) {
            await userSchema.findByIdAndUpdate(user._id, {
                $unset: { otp: 1, otpExpiresAt: 1, otpAttempts: 1 }
            });
            return res.status(400).json({ message: 'Too many attempts. Please try again.' });
        }
        await user.save();

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};
const aboutPage = async (req, res) => {
    try {
      res.render("user/about");
    } catch (error) {
      console.error("Error rendering About page:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  
  

export default {
    validateOTP,
    resendOTP,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    aboutPage
}
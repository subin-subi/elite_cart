import userSchema from "../../model/userModel.js"; 
import validatePassword from "../../utils/validatePassword.js";
import bcrypt from "bcrypt"
import {generateOTP, sendOTPEmail} from "../../utils/sendOTP.js"
import passport  from "../../utils/googleAuth.js";

const saltRounds =10;



const getSignUp = (req, res) => {
    try {
        res.render('user/signup')
    } catch (error) {
        console.error('Error rendering signup page:', error);
        res.status(500).render('error', { 
            message: 'Error loading signup page',
            error: error.message 
        });
    }
}

const postSignup = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validate first name
        if (!firstName || !/^[a-zA-Z]{3,10}$/.test(firstName.trim())) {
            return res.status(400).json({
                success: false,
                message: 'First name should contain only letters (3-10 characters)'
            });
        }

        // Validate last name
        if (!lastName || !/^[a-zA-Z]{1,10}$/.test(lastName.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Last name should contain only letters (1-10 characters)'
            });
        }

        // Validate email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        // Check if the user exists
        const existingUser = await userSchema.findOne({ email });

        if (existingUser) {
            if (!existingUser.isverified) {
                await userSchema.deleteOne({ _id: existingUser._id });
            } else {
                const message = !existingUser.password
                    ? "This email is linked to a Google login. Please log in with Google."
                    : "Email is already registered";
                return res.status(400).json({
                    success: false,
                    message
                });
            }
        }

        // Generate OTP and hash password
        const otp = generateOTP();
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save new user
        const newUser = new userSchema({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email,
            password: hashedPassword,
            otp,
            otpExpiresAt: Date.now() + 120000,
            otpAttempts: 0
        });

        await newUser.save();

        // Schedule deletion after OTP expiry
        setTimeout(async () => {
            const user = await userSchema.findOne({ email });
            if (user && !user.isverified) {
                await userSchema.deleteOne({ _id: user._id });
            }
        }, 180000);

        // Send OTP Email
        try {
            await sendOTPEmail(email, otp);
        } catch (emailError) {
            console.error("Error sending OTP:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP"
            });
        }

        res.json({
            success: true,
            message: "OTP sent successfully",
            email: email
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({
            success: false,
            message: "Signup failed"
        });
    }
};


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

    
    const getLogin = (req, res) => {
        try {
            res.render('user/login')
        } catch (error) {
            console.error('Error rendering login page:', error);
            res.status(500).render('error', { 
                message: 'Error loading login page',
                error: error.message 
            });
        }
    }


    const postLogin = async (req, res) => {
        try {
            //console.log('Request Body:', req.body);

            const { email, password } = req.body;
            
            // Server-side validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }
    
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }
    
            // Find user
            const user = await userSchema.findOne({ email });
            //console.log('User Found:', user);

            // Check if user exists
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Your email is not registered. Please signup first."
                });
            }
    
            if(!user.password) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is linked to a Google login. Please log in with Google.'
                });
            }
    
           // Check if user is verified
           if (user.isVerified === false) {  
            return res.status(400).json({
                success: false,
                message: 'Please verify your email first'
            });
        }
        
    
            // Check if user is blocked
            if (user.blocked) {
                return res.status(400).json({
                    success: false,
                    message: 'Your account has been blocked'
                });
            }
    
            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
    
            // Set session
            req.session.user = user._id;
            req.session.userEmail = user.email;
    
            // Return success response with redirect URL
            return res.json({
                success: true,
                message: 'Login successful',
                redirectUrl: '/home'
            });
    
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    };
    
    const homepage = (req, res) => {
        try {
            res.render("user/home");
        } catch (error) {
            console.error("Error in home page", error);
            res.status(500).send("Internal Server Error");
        }
    };
    

    const getForgotPassword = (req, res)=>{
        try{
            res.render('user/forgotPassword')
        }catch(error){
            console.error("Error rendering forgot password page:", error)
            res.status(500),render("error",{
                message :' error loading forgot password page',
                error: error.message
            })
        }
    }
    


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
    
    const resetPassword = async (req, res) => {
        try {
            const { email, newPassword } = req.body;
            
            const user = await userSchema.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            // Validate new password
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ message: passwordValidation.message });
            }
    
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            // Update password and remove OTP fields
            await userSchema.findByIdAndUpdate(user._id, {
                $set: { password: hashedPassword },
                $unset: { otp: 1, otpExpiresAt: 1, otpAttempts: 1 }
            });
    
            res.status(200).json({ message: 'Password reset successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ message: 'Failed to reset password' });
        }
    };

    const getChangePassword = async (req, res) => {
        try {
            // Get user from session
            const userId = req.session.user;
            const user = await userSchema.findById(userId);
    
            if (!user) {
                return res.redirect('/login');
            }
    
            // Check if user has a password (not Google login)
            if (!user.password) {
                return res.redirect('/profile');
            }
    
            // Pass the user object to the view
            res.render('user/changePassword', { user });
    
        } catch (error) {
            console.error('Get change password error:', error);
            res.status(500).render('error', { 
                message: 'Error loading change password page',
                error: error.message 
            });
        }
    };


    const postChangePassword = async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.session.user;
    
            const user = await userSchema.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
    
            // Validate new password
            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ message: passwordValidation.message });
            }
    
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            // Update password
            await userSchema.findByIdAndUpdate(userId, {
                password: hashedPassword
            });
    
            res.status(200).json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ message: 'Failed to update password' });
        }
    };
    
    const getGoogle = (req, res) => {
        // Store the trigger in session before redirecting to Google
        req.session.authTrigger = req.query.trigger;
       
        
        passport.authenticate("google", {
            scope: ["email", "profile"],
        })(req, res);
    };
    
    const getGoogleCallback = (req, res) => {
        passport.authenticate("google", { failureRedirect: "/login" }, async (err, profile) => {
            try {
                if (err || !profile) {
                    return res.redirect("/login?message=Authentication failed&alertType=error");
                }
    
                const existingUser = await userSchema.findOne({ email: profile.email });
    
                const names = profile.displayName.split(' ');
                const firstName = names[0];
                const lastName = names.slice(1).join(' ')
                
                // If user exists, check if blocked before logging in
                if (existingUser) {
                    // Check if user is blocked
                    if (existingUser.blocked) {
                        return res.redirect("/login?message=Your account has been blocked&alertType=error");
                    }
    
                    // Update googleId if it doesn't exist and unset otpAttempts
                    await userSchema.findByIdAndUpdate(existingUser._id, {
                        $set: { googleId: existingUser.googleId || profile.id },
                        $unset: { otpAttempts: 1 }
                    });
                    
                    req.session.user = existingUser._id;
                    return res.redirect("/home");
                }
    
                // If user doesn't exist, create new account
                const newUser = new userSchema({
                    firstName: firstName,
                    lastName: lastName,
                    email: profile.email,
                    googleId: profile.id,
                    isVerified: true,
                });
                await newUser.save();
                await userSchema.findByIdAndUpdate(newUser._id, {
                    $unset: { otpAttempts: 1 }
                });
                
                req.session.user = newUser._id;
                return res.redirect("/home");
    
            } catch (error) {
                console.error("Google authentication error:", error);
                return res.redirect("/login?message=Authentication failed&alertType=error");
            }
        })(req, res);
    };
    
    const getLogout = (req, res) => {
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).send("Error logging out");
            }
            
            // Clear any cookies
            res.clearCookie('connect.sid');
            
            // Redirect to signup page
            res.redirect('/signup');
        });
    };

export default{
    getSignUp,
    postSignup,
    validateOTP,
    resendOTP,
    getLogin,
    postLogin,
    getForgotPassword,
    sendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    resetPassword,
    getChangePassword,
    postChangePassword,
    getGoogle,
    getGoogleCallback,
    getLogout,
    homepage
}
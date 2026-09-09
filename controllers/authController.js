const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto")

// login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are Required",
      });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }
    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact the administrator for assistance.",
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }
    const token = generateToken(user.id, user.role);
    return res.status(200).json({
      success: true,
      message: "Login Successful!!!",
      token,

      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required.",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }
    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();
    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. You will be logged out and need to log in again with your new password.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Security Best Practice: Always return the same message whether the email exists or not.
    // This prevents "email enumeration" attacks (where hackers guess which emails are registered).
    const genericMessage = "If an account with that email exists, a password reset link has been generated.";

    if (!user) {
      // We still return 200 OK with the generic message to avoid revealing if the email exists
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expire time (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // 🔒 SECURE: Log the token to the BACKEND TERMINAL ONLY. 
    // Do NOT send it in the API response.
    console.log("\n==================================================");
    console.log(`🔑 DEV MODE: Password Reset Token for ${user.email}`);
    console.log(`Token: ${resetToken}`);
    console.log(`URL: http://localhost:5000/reset-password.html?token=${resetToken}`);
    console.log("==================================================\n");

    // TODO: In production, replace the console.log above with actual email sending logic:
    // await sendEmail({ email: user.email, subject: "Password Reset", message: resetUrl });

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });
    }

    // Hash the token we received to match the one in the database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Check if token is still valid
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    // Set new password (your User model or a pre-save hook should hash this, 
    // but we'll hash it here explicitly to be safe based on your current setup)
    const bcrypt = require("bcrypt");
    user.password = await bcrypt.hash(newPassword, 10);
    
    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.mustChangePassword = false; // Ensure they don't get stuck in the change password loop

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
module.exports = {
  login,
  changePassword,
  forgotPassword,
  resetPassword,
};

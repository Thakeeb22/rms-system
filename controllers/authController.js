const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

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
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
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
    if (isMatch) {
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
    user.mustChangePassword = false
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
module.exports = {
  login,
  changePassword,
};

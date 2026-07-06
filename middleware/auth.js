const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. No token provided",
      });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }
    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Please contact the administrator for assistance.",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};
module.exports = auth;

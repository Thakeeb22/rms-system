const isTeacher = (req, res, next) => {
  if (!req.user || req.user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Teacher privileges are required.",
    });
  }
  
  next();
};

module.exports = isTeacher;
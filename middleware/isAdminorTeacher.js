const isAdminOrTeacher = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "teacher") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied.",
  });
};
module.exports = isAdminOrTeacher;

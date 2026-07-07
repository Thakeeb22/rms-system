const isTeacher = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Teacher Priviledges are required",
    });
  }
};
module.exports = isTeacher;

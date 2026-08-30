const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isTeacher = require("../middleware/isTeacher");
const { getTeacherDashboard } = require("../controllers/teacherDashboardController");

// Teacher dashboard
router.get("/dashboard", auth, isTeacher, getTeacherDashboard);

module.exports = router;
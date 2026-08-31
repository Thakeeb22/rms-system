const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isTeacher = require("../middleware/isTeacher");
const { getTeacherDashboard, getTeacherStudents } = require("../controllers/teacherDashboardController");

// Teacher dashboard
router.get("/dashboard", auth, isTeacher, getTeacherDashboard);
// teacher's students (in their assigned class)
router.get("/students", auth, isTeacher, getTeacherStudents);
module.exports = router;
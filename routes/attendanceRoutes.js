const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdminOrTeacher = require("../middleware/isAdminorTeacher");
const {
  scanQR,
  getMyClassAttendance,
  getAllAttendance,
  updateAttendance,
  getStudentAttendanceStats,
} = require("../controllers/attendanceController");

// Import your existing auth/role middleware
// const { protect, authorize } = require('../middleware/authMiddleware');

// --- PUBLIC / AUTHENTICATED ROUTES ---

// Scan QR Code (Accessible to any authenticated Teacher or Admin)
// POST /api/attendance/scan
router.post("/scan", auth, isAdminOrTeacher, scanQR);

// --- TEACHER ROUTES ---

// Get Attendance for a specific class (Teacher)
// GET /api/attendance/my-class?date=YYYY-MM-DD&classId=...
router.get("/my-class", auth, isAdminOrTeacher, getMyClassAttendance);

// --- ADMIN ROUTES ---

// Get All Attendance (Admin only)
// GET /api/attendance/all?date=YYYY-MM-DD&classId=...
router.get("/all", auth, isAdminOrTeacher, getAllAttendance);

// Update/Correct an Attendance Record (Admin only)
// PUT /api/attendance/:id
router.put("/:id", auth, isAdminOrTeacher, updateAttendance);

// GET /api/attendance/student-stats?studentId=...&sessionId=...&termId=...
router.get("/student-stats", auth, isAdminOrTeacher, getStudentAttendanceStats);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deactivateTeacher,
  activateTeacher,
} = require("../controllers/teacherController");

router.get("/dashboard", auth, isAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Admin dashboard!!!",
    user: {
      id: req.user.id,
      fullname: req.user.fullname,
      email: req.user.email,
      role: req.user.role,
    },
  });
});
router.post("/teachers", auth, isAdmin, createTeacher);
router.get("/teachers", auth, isAdmin, getAllTeachers);
router.get("/teachers/:id", auth, isAdmin, getTeacherById);
router.put("/teachers/:id", auth, isAdmin, updateTeacher);
router.patch("/teachers/:id/deactivate", auth, isAdmin, deactivateTeacher);
router.patch("/teachers/:id/activate", auth, isAdmin, activateTeacher);
module.exports = router;

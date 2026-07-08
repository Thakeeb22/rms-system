const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { createTeacher } = require("../controllers/teacherController");

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
module.exports = router;

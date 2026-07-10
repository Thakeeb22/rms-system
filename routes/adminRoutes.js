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
const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
} = require("../controllers/classController");
const {
  createSubject,
  getAllSubjects,
  updateSubject,
  getSubjectById,
} = require("../controllers/subjectController");
const {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  setCurrentSession,
} = require("../controllers/sessionController");
const {
  createTerm,
  getAllTerms,
  getTermById,
  updateTerm,
  setCurrentTerm,
} = require("../controllers/termController");
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
// teacher routes
router.post("/teachers", auth, isAdmin, createTeacher);
router.get("/teachers", auth, isAdmin, getAllTeachers);
router.get("/teachers/:id", auth, isAdmin, getTeacherById);
router.put("/teachers/:id", auth, isAdmin, updateTeacher);

router.patch("/teachers/:id/deactivate", auth, isAdmin, deactivateTeacher);
router.patch("/teachers/:id/activate", auth, isAdmin, activateTeacher);

// class routes
router.post("/classes", auth, isAdmin, createClass);
router.get("/classes", auth, isAdmin, getAllClasses);
router.get("/classes/:id", auth, isAdmin, getClassById);
router.put("/classes/:id", auth, isAdmin, updateClass);

// subjects routes
router.post("/subjects", auth, isAdmin, createSubject);
router.get("/subjects", auth, isAdmin, getAllSubjects);
router.get("/subjects/:id", auth, isAdmin, getSubjectById);
router.put("/subjects/:id", auth, isAdmin, updateSubject);

// session routes
router.post("/sessions", auth, isAdmin, createSession);
router.get("/sessions", auth, isAdmin, getAllSessions);
router.get("/sessions/:id", auth, isAdmin, getSessionById);
router.put("/sessions/:id", auth, isAdmin, updateSession);
router.patch("/sessions/:id/set-current", auth, isAdmin, setCurrentSession);

// term routes
router.post("/terms", auth, isAdmin, createTerm);
router.get("/terms", auth, isAdmin, getAllTerms);
router.get("/terms/:id", auth, isAdmin, getTermById);
router.put("/terms/:id", auth, isAdmin, updateTerm);
router.patch("/terms/:id/set-current", auth, isAdmin, setCurrentTerm);

module.exports = router;

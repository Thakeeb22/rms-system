const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const isTeacher = require("../middleware/isTeacher");
const isAdminOrTeacher = require("../middleware/isAdminorTeacher");

const { login, changePassword } = require("../controllers/authController");

const {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deactivateTeacher,
  activateTeacher,
  resetTeacherPassword,
} = require("../controllers/teacherController");

const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  assignClassTeacher,
  removeClassTeacher,
  deleteClass,
} = require("../controllers/classController");

const {
  createSubject,
  getAllSubjects,
  updateSubject,
  getSubjectById,
  deleteSubject,
} = require("../controllers/subjectController");

const {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  setCurrentSession,
  deleteSession,
} = require("../controllers/sessionController");

const {
  createTerm,
  getAllTerms,
  getTermById,
  updateTerm,
  setCurrentTerm,
  deleteTerm,
} = require("../controllers/termController");

const {
  assignSubjectToClass,
  getAllClassSubjects,
  getClassSubjectById,
  updateSubjectTeacher,
  deleteClassSubject,
} = require("../controllers/classSubjectController");

const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  graduateStudent,
  transferStudent,
  deactivateStudent,
  activateStudent,
  promoteStudent,
  bulkPromoteStudents,
} = require("../controllers/studentController");

const {
  createResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
  publishResult,
  unpublishResult,
} = require("../controllers/resultController");

const { getStudentReport } = require("../controllers/reportController");
const {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
} = require("../controllers/studentAssessmentController");

const {getStudentsForIdCards} = require("../controllers/idCardController")

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

router.patch("/change-password", auth, changePassword);
router.patch(
  "/teachers/:id/reset-password",
  auth,
  isAdmin,
  resetTeacherPassword,
);

// class routes
router.post("/classes", auth, isAdmin, createClass);
router.get("/classes", auth, isAdminOrTeacher, getAllClasses);
router.get("/classes/:id", auth, isAdmin, getClassById);
router.put("/classes/:id", auth, isAdmin, updateClass);
router.delete("/classes/:id", auth, isAdmin, deleteClass);
router.patch("/classes/:id/class-teacher", auth, isAdmin, assignClassTeacher);
router.delete("/classes/:id/teacher", auth, isAdmin, removeClassTeacher);

// subjects routes
router.post("/subjects", auth, isAdmin, createSubject);
router.get("/subjects", auth, isAdmin, getAllSubjects);
router.get("/subjects/:id", auth, isAdmin, getSubjectById);
router.put("/subjects/:id", auth, isAdmin, updateSubject);
router.delete("/subjects/:id", auth, isAdmin, deleteSubject);

// session routes
router.post("/sessions", auth, isAdmin, createSession);
router.get("/sessions", auth, isAdmin, getAllSessions);
router.get("/sessions/:id", auth, isAdmin, getSessionById);
router.put("/sessions/:id", auth, isAdmin, updateSession);
router.patch("/sessions/:id/set-current", auth, isAdmin, setCurrentSession);
router.delete("/sessions/:id", auth, isAdmin, deleteSession);

// term routes
router.post("/terms", auth, isAdmin, createTerm);
router.get("/terms", auth, isAdmin, getAllTerms);
router.get("/terms/:id", auth, isAdmin, getTermById);
router.put("/terms/:id", auth, isAdmin, updateTerm);
router.patch("/terms/:id/set-current", auth, isAdmin, setCurrentTerm);
router.delete("/terms/:id", auth, isAdmin, deleteTerm);

// assign subject to class routes
router.post("/class-subjects", auth, isAdmin, assignSubjectToClass);
router.get("/class-subjects", auth, isAdmin, getAllClassSubjects);
router.get("/class-subjects/:id", auth, isAdmin, getClassSubjectById);
router.delete("/class-subjects/:id", auth, isAdmin, deleteClassSubject);
router.patch(
  "/class-subjects/:id/subject-teacher",
  auth,
  isAdmin,
  updateSubjectTeacher,
);

// student routes
router.post("/students", auth, isAdminOrTeacher, createStudent);
router.get("/students", auth, isAdminOrTeacher, getAllStudents);
router.get("/students/:id", auth, isAdminOrTeacher, getStudentById);
router.put("/students/:id", auth, isAdminOrTeacher, updateStudent);
router.patch("/students/:id/graduate", auth, isAdmin, graduateStudent);
router.patch("/students/:id/transfer", auth, isAdmin, transferStudent);
router.patch("/students/:id/deactivate", auth, isAdmin, deactivateStudent);
router.patch("/students/:id/activate", auth, isAdmin, activateStudent);
router.patch("/students/:id/promote", auth, isAdminOrTeacher, promoteStudent);
router.post(
  "/students/bulk-promote",
  auth,
  isAdminOrTeacher,
  bulkPromoteStudents,
);

// result routes
router.post("/results", auth, isAdminOrTeacher, createResult);
router.get("/results", auth, isAdminOrTeacher, getAllResults);
router.get("/results/:id", auth, isAdminOrTeacher, getResultById);
router.put("/results/:id", auth, isAdminOrTeacher, updateResult);
router.delete("/results/:id", auth, isAdminOrTeacher, deleteResult);

router.patch("/results/publish", auth, isAdmin, publishResult);
router.patch("/results/unpublish", auth, isAdmin, unpublishResult);

// report route
router.get("/report-card", auth, isAdminOrTeacher, getStudentReport);

// student assessment
router.post("/student-assessments", auth, isAdminOrTeacher, createAssessment);
router.get("/assessments", auth, isAdminOrTeacher, getAllAssessments);
router.get("/assessments/:id", auth, isAdminOrTeacher, getAssessmentById);
router.put("/assessments/:id", auth, isAdminOrTeacher, updateAssessment);
router.delete("/assessments/:id", auth, isAdminOrTeacher, deleteAssessment);

router.get("/id-cards/students", auth, isAdmin, getStudentsForIdCards)

module.exports = router;

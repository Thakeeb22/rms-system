const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const Result = require("../models/Result");
const Session = require("../models/Session");
const Term = require("../models/Term");
const ClassSubject = require("../models/classSubject");
const StudentAssessment = require("../models/StudentAssessment");

const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get teacher with populated fields
    const teacher = await User.findById(teacherId)
      .select("-password")
      .populate("assignedClass", "className")
      .populate("subjects", "subjectName");

    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Not authorized as a teacher.",
      });
    }

    // Get current session and term
    const currentSession = await Session.findOne({ isCurrent: true });
    const currentTerm = await Term.findOne({ isCurrent: true });

    // Get students in teacher's assigned class
    let totalStudents = 0;
    if (teacher.assignedClass) {
      totalStudents = await Student.countDocuments({
        class: teacher.assignedClass._id,
        isActive: true,
      });
    }

    // Get class-subject assignments where this teacher is the subject teacher
    const myAssignments = await ClassSubject.find({
      subjectTeacher: teacherId,
    })
      .populate("class", "className")
      .populate("subject", "subjectName");

    // Get teacher's results count for current session/term
    let totalResults = 0;
    let publishedResults = 0;
    let unpublishedResults = 0;
    let myRecentResults = [];

    if (currentSession && currentTerm) {
      const results = await Result.find({
        teacher: teacherId,
        session: currentSession._id,
        term: currentTerm._id,
      });

      totalResults = results.length;
      publishedResults = results.filter((r) => r.published).length;
      unpublishedResults = totalResults - publishedResults;

      // Get recent 5 results
      myRecentResults = await Result.find({ teacher: teacherId })
        .populate("student", "fullname admissionNumber")
        .populate("subject", "subjectName")
        .populate("class", "className")
        .select("student subject class total grade published createdAt")
        .sort({ createdAt: -1 })
        .limit(5);
    }

    // Get assessments count for current session/term
    let totalAssessments = 0;
    if (currentSession && currentTerm && teacher.assignedClass) {
      const studentsInClass = await Student.find({
        class: teacher.assignedClass._id,
        isActive: true,
      }).select("_id");
      
      const studentIds = studentsInClass.map((s) => s._id);
      
      totalAssessments = await StudentAssessment.countDocuments({
        student: { $in: studentIds },
        session: currentSession._id,
        term: currentTerm._id,
      });
    }

    return res.status(200).json({
      success: true,
      dashboard: {
        teacher: {
          fullname: teacher.fullname,
          email: teacher.email,
          phone: teacher.phone,
          assignedClass: teacher.assignedClass,
          subjects: teacher.subjects,
        },
        currentSession,
        currentTerm,
        totalStudents,
        totalAssignments: myAssignments.length,
        myAssignments,
        totalResults,
        publishedResults,
        unpublishedResults,
        totalAssessments,
        recentResults: myRecentResults,
      },
    });
  } catch (error) {
    console.error("Get teacher dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getTeacherStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId } = req.query; // ✅ Accept classId from query

    const teacher = await User.findById(teacherId)
      .populate("assignedClass", "className");

    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Not authorized as a teacher.",
      });
    }

    // Determine which class to fetch students from
    let targetClassId = null;

    if (classId) {
      // ✅ Validate the teacher is assigned to teach in this class
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class ID.",
        });
      }

      const classSubjectAssignment = await ClassSubject.findOne({
        class: classId,
        subjectTeacher: teacherId,
      });

      if (!classSubjectAssignment) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to teach in this class.",
        });
      }

      targetClassId = classId;
    } else if (teacher.assignedClass) {
      // Fallback to assigned class
      targetClassId = teacher.assignedClass._id;
    } else {
      return res.status(200).json({
        success: true,
        students: [],
        message: "No class assigned to this teacher.",
      });
    }

    // Get students in the target class
    const students = await Student.find({
      class: targetClassId,
      isActive: true,
    })
      .select("fullname admissionNumber gender dateOfBirth guardianName guardianPhone")
      .sort({ fullname: 1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get teacher students error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

module.exports = { getTeacherDashboard, getTeacherStudents };
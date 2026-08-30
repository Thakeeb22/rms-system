const mongoose = require("mongoose");
const StudentAssessment = require("../models/StudentAssessment");
const Student = require("../models/Student");
const Session = require("../models/Session");
const Term = require("../models/Term");

const createAssessment = async (req, res) => {
  try {
    const {
      student,
      session,
      term,
      attendance,
      affective,
      psychomotor,
      nextTermBegins,
      classTeacherComment,
      principalComment,
    } = req.body;

    // Required fields validation
    if (!student || !session || !term) {
      return res.status(400).json({
        success: false,
        message: "Student, Session and Term are required.",
      });
    }

    // ID validation
    if (
      !mongoose.Types.ObjectId.isValid(student) ||
      !mongoose.Types.ObjectId.isValid(session) ||
      !mongoose.Types.ObjectId.isValid(term)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID supplied.",
      });
    }

    // Validate attendance values
    if (attendance) {
      if (attendance.schoolOpened < 0 || attendance.present < 0 || attendance.absent < 0) {
        return res.status(400).json({
          success: false,
          message: "Attendance values cannot be negative.",
        });
      }
    }

    // Validate affective traits (1-5)
    if (affective) {
      const affectiveFields = ["punctuality", "neatness", "honesty", "politeness", "attentiveness", "leadership"];
      for (const field of affectiveFields) {
        const value = affective[field];
        if (value !== null && value !== undefined) {
          if (value < 1 || value > 5) {
            return res.status(400).json({
              success: false,
              message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be between 1 and 5.`,
            });
          }
        }
      }
    }

    // Validate psychomotor skills (1-5)
    if (psychomotor) {
      const psychomotorFields = ["handwriting", "sports", "handlingTools", "drawing"];
      for (const field of psychomotorFields) {
        const value = psychomotor[field];
        if (value !== null && value !== undefined) {
          if (value < 1 || value > 5) {
            return res.status(400).json({
              success: false,
              message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be between 1 and 5.`,
            });
          }
        }
      }
    }

    // Check if student, session, term exist
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const sessionExists = await Session.findById(session);
    if (!sessionExists) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    const termExists = await Term.findById(term);
    if (!termExists) {
      return res.status(404).json({
        success: false,
        message: "Term not found.",
      });
    }

    // Check for duplicate assessment
    const existingAssessment = await StudentAssessment.findOne({
      student,
      session,
      term,
    });

    if (existingAssessment) {
      return res.status(409).json({
        success: false,
        message: "Assessment already exists for this student in this session and term.",
      });
    }

    const assessment = await StudentAssessment.create({
      student,
      session,
      term,
      attendance,
      affective,
      psychomotor,
      nextTermBegins,
      classTeacherComment,
      principalComment,
    });

    return res.status(201).json({
      success: true,
      message: "Student assessment created successfully.",
      assessment,
    });
  } catch (error) {
    console.error("Create assessment error:", error);
    
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getAllAssessments = async (req, res) => {
  try {
    const assessments = await StudentAssessment.find()
      .populate("student", "fullname admissionNumber")
      .populate("session", "sessionName")
      .populate("term", "termName")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      total: assessments.length,
      assessments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assessment ID.",
      });
    }
    const assessment = await StudentAssessment.findById(id)
      .populate("student", "fullname admissionNumber")
      .populate("session", "sessionName")
      .populate("term", "termName");
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }
    return res.status(200).json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assessment ID.",
      });
    }

    const assessment = await StudentAssessment.findById(id);
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    const {
      attendance,
      affective,
      psychomotor,
      nextTermBegins,
      classTeacherComment,
      principalComment,
    } = req.body;

    // Validate attendance values
    if (attendance) {
      if (attendance.schoolOpened < 0 || attendance.present < 0 || attendance.absent < 0) {
        return res.status(400).json({
          success: false,
          message: "Attendance values cannot be negative.",
        });
      }
    }

    // Validate affective traits (1-5)
    if (affective) {
      const affectiveFields = ["punctuality", "neatness", "honesty", "politeness", "attentiveness", "leadership"];
      for (const field of affectiveFields) {
        const value = affective[field];
        if (value !== null && value !== undefined) {
          if (value < 1 || value > 5) {
            return res.status(400).json({
              success: false,
              message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be between 1 and 5.`,
            });
          }
        }
      }
    }

    // Validate psychomotor skills (1-5)
    if (psychomotor) {
      const psychomotorFields = ["handwriting", "sports", "handlingTools", "drawing"];
      for (const field of psychomotorFields) {
        const value = psychomotor[field];
        if (value !== null && value !== undefined) {
          if (value < 1 || value > 5) {
            return res.status(400).json({
              success: false,
              message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be between 1 and 5.`,
            });
          }
        }
      }
    }

    // Update fields
    if (attendance) {
      assessment.attendance = {
        ...assessment.attendance.toObject(),
        ...attendance,
      };
    }
    
    if (affective) {
      assessment.affective = {
        ...assessment.affective.toObject(),
        ...affective,
      };
    }
    
    if (psychomotor) {
      assessment.psychomotor = {
        ...assessment.psychomotor.toObject(),
        ...psychomotor,
      };
    }
    
    if (nextTermBegins !== undefined) assessment.nextTermBegins = nextTermBegins;
    if (classTeacherComment !== undefined) assessment.classTeacherComment = classTeacherComment;
    if (principalComment !== undefined) assessment.principalComment = principalComment;

    await assessment.save();

    await assessment.populate([
      { path: "student", select: "fullname admissionNumber" },
      { path: "session", select: "sessionName" },
      { path: "term", select: "termName" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Assessment updated successfully.",
      assessment,
    });
  } catch (error) {
    console.error("Update assessment error:", error);
    
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assessment ID.",
      });
    }
    const assessment = await StudentAssessment.findById(id);
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }
    await assessment.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Assessment deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

module.exports = {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
};

const mongoose = require("mongoose");

const Class = require("../models/Class");
const Subject = require("../models/Subject");
const ClassSubject = require("../models/classSubject");
const User = require("../models/User");


// ======================================================
// ASSIGN SUBJECT TO CLASS
// ======================================================
const assignSubjectToClass = async (req, res) => {
  try {
    const {
      classId,
      subjectId,
      subjectTeacher,
    } = req.body;

    // -----------------------------
    // Required fields
    // -----------------------------
    if (!classId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Class ID and Subject ID are required.",
      });
    }

    // -----------------------------
    // Validate IDs
    // -----------------------------
    if (
      !mongoose.Types.ObjectId.isValid(classId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class ID or Subject ID.",
      });
    }

    if (
      subjectTeacher &&
      !mongoose.Types.ObjectId.isValid(subjectTeacher)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject teacher ID.",
      });
    }

    // -----------------------------
    // Check class
    // -----------------------------
    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    // -----------------------------
    // Check subject
    // -----------------------------
    const subjectData = await Subject.findById(subjectId);

    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found.",
      });
    }

    // -----------------------------
    // Check subject teacher
    // -----------------------------
    if (subjectTeacher) {
      const teacher = await User.findOne({
        _id: subjectTeacher,
        role: "teacher",
        status: "active",
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Subject teacher not found or inactive.",
        });
      }
    }

    // -----------------------------
    // Check existing assignment
    // -----------------------------
    const existingAssignment = await ClassSubject.findOne({
      class: classId,
      subject: subjectId,
    });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: "Subject is already assigned to this class.",
      });
    }

    // -----------------------------
    // Create assignment
    // -----------------------------
    const assignment = await ClassSubject.create({
      class: classId,
      subject: subjectId,
      subjectTeacher: subjectTeacher || null,
    });

    // -----------------------------
    // Populate response
    // -----------------------------
    await assignment.populate([
      {
        path: "class",
        select: "className",
      },
      {
        path: "subject",
        select: "subjectName",
      },
      {
        path: "subjectTeacher",
        select: "fullname email phone status",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Subject assigned to class successfully.",
      assignment,
    });

  } catch (error) {
    console.error("Assign subject error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// ======================================================
// GET ALL CLASS SUBJECTS
// ======================================================
const getAllClassSubjects = async (req, res) => {
  try {
    const assignments = await ClassSubject.find()
      .populate("class", "className")
      .populate("subject", "subjectName")
      .populate(
        "subjectTeacher",
        "fullname email phone status",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });

  } catch (error) {
    console.error("Get class subjects error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// ======================================================
// GET CLASS SUBJECT BY ID
// ======================================================
const getClassSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class Subject ID.",
      });
    }

    const assignment = await ClassSubject.findById(id)
      .populate("class", "className")
      .populate("subject", "subjectName")
      .populate(
        "subjectTeacher",
        "fullname email phone status",
      );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Class Subject not found.",
      });
    }

    return res.status(200).json({
      success: true,
      assignment,
    });

  } catch (error) {
    console.error("Get class subject error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};


// ======================================================
// UPDATE SUBJECT TEACHER
// ======================================================
const updateSubjectTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectTeacher } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class Subject ID.",
      });
    }

    if (
      !subjectTeacher ||
      !mongoose.Types.ObjectId.isValid(subjectTeacher)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid subject teacher ID is required.",
      });
    }

    // Check assignment
    const assignment = await ClassSubject.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Class Subject not found.",
      });
    }

    // Check teacher
    const teacher = await User.findOne({
      _id: subjectTeacher,
      role: "teacher",
      status: "active",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or inactive.",
      });
    }

    assignment.subjectTeacher = subjectTeacher;

    await assignment.save();

    await assignment.populate([
      {
        path: "class",
        select: "className",
      },
      {
        path: "subject",
        select: "subjectName",
      },
      {
        path: "subjectTeacher",
        select: "fullname email phone status",
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Subject teacher assigned successfully.",
      assignment,
    });

  } catch (error) {
    console.error("Update subject teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};


// ======================================================
// DELETE CLASS SUBJECT
// ======================================================
const deleteClassSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class Subject ID.",
      });
    }

    const assignment = await ClassSubject.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Class Subject not found.",
      });
    }

    await assignment.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Class Subject deleted successfully.",
    });

  } catch (error) {
    console.error("Delete class subject error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};


module.exports = {
  assignSubjectToClass,
  getAllClassSubjects,
  getClassSubjectById,
  updateSubjectTeacher,
  deleteClassSubject,
};
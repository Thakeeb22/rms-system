const mongoose = require("mongoose");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const ClassSubject = require("../models/ClassSubject");

const assignSubjectToClass = async (req, res) => {
  try {
    const { classId, subjectId } = req.body;
    if (!classId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Class ID and Subject ID are required.",
      });
    }
    if (
      !mongoose.Types.ObjectId.isValid(classId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class ID or Subject ID.",
      });
    }
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }
    const subjectData = await Subject.findById(subjectId);
    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found.",
      });
    }
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
    const assignment = await ClassSubject.create({
      class: classId,
      subject: subjectId,
    });
    return res.status(201).json({
      success: true,
      message: "Subject assigned to class successfully.",
      assignment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getAllClassSubjects = async (req, res) => {
  try {
    const assignments = await ClassSubject.find()
      .populate("class", "className")
      .populate("subject", "subjectName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

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
      .populate("subject", "subjectName");
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
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

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
    await assignment.deleteOne()
    return res.status(200).json({
      success: true,
      message: "Class Subject Deleted Successfully",
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
  assignSubjectToClass,
  getAllClassSubjects,
  getClassSubjectById,
  deleteClassSubject,
};

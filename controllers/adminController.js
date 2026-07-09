const Class = require("../models/Class");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");
// class controller
const createClass = async (req, res) => {
  try {
    const { className } = req.body;
    if (!className) {
      return res.status(400).json({
        success: false,
        message: "Class name is required.",
      });
    }
    const normalizedClassName = className.trim().toUpperCase();
    const existingClass = await Class.findOne({
      className: normalizedClassName,
    });
    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: "Class already exists.",
      });
    }
    const newClass = await Class.create({
      className: normalizedClassName,
    });
    return res.status(201).json({
      success: true,
      message: "Class created successfully.",
      class: newClass,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ className: 1 });

    return res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }
    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }
    return res.status(200).json({
      success: true,
      class: classData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }
    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }
    const { className } = req.body;
    if (!className) {
      return res.status(400).json({
        success: false,
        message: "Class name is required.",
      });
    }
    const normalizedClassName = className.trim().toUpperCase();
    const existingClass = await Class.findOne({
      className: normalizedClassName,
      _id: { $ne: classData._id },
    });
    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: "Class already exists.",
      });
    }
    classData.className = normalizedClassName;
    await classData.save();
    return res.status(200).json({
      success: true,
      message: "Class updated successfully.",
      class: classData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// subject controller
const createSubject = async (req, res) => {
  try {
    const { subjectName } = req.body;
    if (!subjectName) {
      return res.status(400).json({
        success: false,
        message: "Subject Name is required.",
      });
    }
    const normalizedSubjectName = subjectName.trim().toUpperCase();
    const existingSubject = await Subject.findOne({
      subjectName: normalizedSubjectName,
    });
    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: "Subject already exists.",
      });
    }
    const newSubject = await Subject.create({
      subjectName: normalizedSubjectName,
    });
    return res.status(201).json({
      success: true,
      message: "Subject created successfully.",
      subject: newSubject,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ subjectName: 1 });
    return res.status(200).json({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subject ID.",
      });
    }
    const subjectData = await Subject.findById(id);
    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      subject: subjectData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subject ID.",
      });
    }
    const subjectData = await Subject.findById(id);
    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found.",
      });
    }
    const { subjectName } = req.body;
    if (!subjectName) {
      return res.status(400).json({
        success: false,
        message: "Subject name required",
      });
    }
    const normalizedSubjectName = subjectName.trim().toUpperCase();
    const existingSubject = await Subject.findOne({
      subjectName: normalizedSubjectName,
      _id: { $ne: subjectData._id },
    });
    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: "Subject already exists.",
      });
    }
    subjectData.subjectName = normalizedSubjectName;
    await subjectData.save();
    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject: subjectData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
};

const Subject = require("../models/Subject");
const mongoose = require("mongoose");
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
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
};

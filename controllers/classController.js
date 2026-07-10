const Class = require("../models/Class");
const mongoose = require("mongoose");
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
module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
};

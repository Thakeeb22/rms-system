const Class = require("../models/Class");
const mongoose = require("mongoose");
const User = require("../models/User");

const createClass = async (req, res) => {
  try {
    const { className, teacherId } = req.body;

    // -----------------------------
    // Validate class name
    // -----------------------------
    if (!className || !className.trim()) {
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

    // -----------------------------
    // Validate teacher (if provided)
    // BEFORE creating the class
    // -----------------------------
    let teacher = null;

    if (teacherId && teacherId.trim() !== "") {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID.",
        });
      }

      teacher = await User.findOne({
        _id: teacherId,
        role: "teacher",
        status: "active",
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found or inactive.",
        });
      }

      const teacherAlreadyAssigned = await Class.findOne({
        classTeacher: teacher._id,
      });

      if (teacherAlreadyAssigned) {
        return res.status(409).json({
          success: false,
          message: "This teacher is already assigned as a class teacher.",
          class: {
            id: teacherAlreadyAssigned._id,
            className: teacherAlreadyAssigned.className,
          },
        });
      }
    }

    // -----------------------------
    // Create the class
    // -----------------------------
    const newClass = await Class.create({
      className: normalizedClassName,
      classTeacher: teacher ? teacher._id : null,
    });

    // -----------------------------
    // Populate response
    // -----------------------------
    await newClass.populate({
      path: "classTeacher",
      select: "fullname email phone status",
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully.",
      class: newClass,
    });
  } catch (error) {
    console.error("Create class error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("classTeacher", "fullname email phone status")
      .sort({ className: 1 });

    return res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    console.error("Get all classes error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
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

    const classData = await Class.findById(id).populate(
      "classTeacher",
      "fullname email phone status",
    );

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
    console.error("Get class by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { className } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    if (!className || !className.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name is required.",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
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

    await classData.populate({
      path: "classTeacher",
      select: "fullname email phone status",
    });

    return res.status(200).json({
      success: true,
      message: "Class updated successfully.",
      class: classData,
    });
  } catch (error) {
    console.error("Update class error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const assignClassTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    // -----------------------------
    // Validate class ID
    // -----------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    // -----------------------------
    // Validate teacher ID
    // -----------------------------
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Valid teacher ID is required.",
      });
    }

    // -----------------------------
    // Find class
    // -----------------------------
    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    // -----------------------------
    // Find active teacher
    // -----------------------------
    const teacher = await User.findOne({
      _id: teacherId,
      role: "teacher",
      status: "active",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or inactive.",
      });
    }

    // -----------------------------
    // Check if teacher is already
    // class teacher of another class
    // -----------------------------
    const existingClass = await Class.findOne({
      classTeacher: teacher._id,
      _id: { $ne: classData._id },
    });

    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: "This teacher is already assigned as a class teacher.",
        class: {
          id: existingClass._id,
          className: existingClass.className,
        },
      });
    }

    // -----------------------------
    // Assign teacher
    // -----------------------------
    classData.classTeacher = teacher._id;

    await classData.save();

    // -----------------------------
    // Populate response
    // -----------------------------
    await classData.populate({
      path: "classTeacher",
      select: "fullname email phone status",
    });

    return res.status(200).json({
      success: true,
      message: "Class teacher assigned successfully.",
      class: classData,
    });
  } catch (error) {
    console.error("Assign class teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const removeClassTeacher = async (req, res) => {
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

    if (!classData.classTeacher) {
      return res.status(400).json({
        success: false,
        message: "This class does not have a class teacher.",
      });
    }

    classData.classTeacher = null;

    await classData.save();

    return res.status(200).json({
      success: true,
      message: "Class teacher removed successfully.",
      class: classData,
    });
  } catch (error) {
    console.error("Remove class teacher error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------
    // Validate class ID
    // -----------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID.",
      });
    }

    // -----------------------------
    // Find class
    // -----------------------------
    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    // -----------------------------
    // Optional: Check if class has students
    // You can add this check if you want to prevent deletion
    // when students are enrolled
    // -----------------------------
    // const Student = require("../models/Student");
    // const studentsInClass = await Student.countDocuments({ class: id });
    // if (studentsInClass > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete class. ${studentsInClass} student(s) are enrolled in this class.`,
    //   });
    // }

    // -----------------------------
    // Optional: Check if class has subject assignments
    // -----------------------------
    // const ClassSubject = require("../models/ClassSubject");
    // const subjectAssignments = await ClassSubject.countDocuments({ class: id });
    // if (subjectAssignments > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete class. ${subjectAssignments} subject assignment(s) exist for this class.`,
    //   });
    // }

    // -----------------------------
    // Delete the class
    // -----------------------------
    await Class.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Class deleted successfully.",
    });
  } catch (error) {
    console.error("Delete class error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  assignClassTeacher,
  removeClassTeacher,
  deleteClass,
};

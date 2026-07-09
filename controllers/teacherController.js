const User = require("../models/User");
const bcrypt = require("bcrypt");
require("../models/Class");
require("../models/Subject");
const mongoose = require("mongoose");

const createTeacher = async (req, res) => {
  try {
    const { fullname, email, password, phone, assignedClass, subjects } =
      req.body;
    if (
      !fullname ||
      !email ||
      !password ||
      !phone ||
      !assignedClass ||
      !subjects
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please assign at least one subject.",
      });
    }
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = await User.create({
      fullname,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      role: "teacher",
      status: "active",
      assignedClass,
      subjects,
    });
    return res.status(201).json({
      success: true,
      message: "Teacher created successfully.",
      teacher: {
        id: teacher.id,
        fullname: teacher.fullname,
        email: teacher.email,
        phone: teacher.phone,
        role: teacher.role,
        status: teacher.status,
        assignedClass: teacher.assignedClass,
        subjects: teacher.subjects,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({
      role: "teacher",
    })
      .select("-password -__v")
      .populate("assignedClass", "className")
      .populate("subjects", "subjectName")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID.",
      });
    }
    const teacher = await User.findById(id)
      .select("-password -__v")
      .populate("assignedClass", "className")
      .populate("subjects", "subjectName");
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }
    return res.status(200).json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Teacher ID.",
      });
    }
    const teacher = await User.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }
    const {
      fullname,
      email,
      password,
      phone,
      assignedClass,
      subjects,
      status,
    } = req.body;
    if (fullname) {
      teacher.fullname = fullname.trim();
    }
    if (phone) {
      teacher.phone = phone.trim();
    }
    if (assignedClass) {
      teacher.assignedClass = assignedClass;
    }
    if (subjects) {
      if (!Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please assign at least on subject.",
        });
      }
      teacher.subjects = subjects;
    }
    if (status) {
      teacher.status = status;
    }
    if (email) {
      const normalizeEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({
        email: normalizeEmail,
        _id: { $ne: teacher._id },
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists.",
        });
      }
      teacher.email = normalizeEmail;
    }
    if (password) {
      teacher.password = await bcrypt.hash(password, 10);
    }

    await teacher.save();
    return res.status(200).json({
      success: true,
      message: "Teacher updated successfully.",
      teacher: {
        id: teacher.id,
        fullname: teacher.fullname,
        email: teacher.email,
        phone: teacher.phone,
        role: teacher.role,
        status: teacher.status,
        assignedClass: teacher.assignedClass,
        subjects: teacher.subjects,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deactivateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID.",
      });
    }
    const teacher = await User.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }
    if (teacher.role !== "teacher") {
      return res.status(400).json({
        success: false,
        message: "Only teacher accounts can be deactivated.",
      });
    }
    if (teacher.status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "teacher is already inactive.",
      });
    }
    teacher.status = "inactive";
    await teacher.save();
    return res.status(200).json({
      succcess: true,
      message: "Teacher has been deactivated successfully.",
      teacher: {
        id: teacher.id,
        fullname: teacher.fullname,
        email: teacher.email,
        status: teacher.status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const activateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID.",
      });
    }
    const teacher = await User.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }
    if (teacher.role !== "teacher") {
      return res.status(400).json({
        success: false,
        message: "Only teacher accounts can be activated",
      });
    }
    if (teacher.status === "active.") {
      return res.status(400).json({
        success: false,
        message: "Teacher is already active.",
      });
    }
    teacher.status = "active";
    await teacher.save();
    return res.status(200).json({
      success: true,
      message: "Teacher has been activated successfully.",
      teacher: {
        id: teacher.id,
        fullname: teacher.fullname,
        email: teacher.email,
        status: teacher.status,
      },
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
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deactivateTeacher,
  activateTeacher,
};

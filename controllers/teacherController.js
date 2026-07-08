const User = require("../models/User");
const bcrypt = require("bcrypt");
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
        id:teacher._id,
        fullname: teacher.fullname,
        email: teacher.email,
        phone: teacher.phone,
        role: teacher.role,
        status: teacher.status,
        assignedClass: teacher.assignedClass,
        subjects: teacher.subjects
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
};

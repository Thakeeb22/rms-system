const mongoose = require("mongoose");
const Class = require("../models/Class");
const Student = require("../models/Student");

const createStudent = async (req, res) => {
  try {
    const {
      admissionNumber,
      fullname,
      guardianName,
      gender,
      dateOfBirth,
      guardianPhone,
      classId,
    } = req.body;
    if (
      !admissionNumber ||
      !fullname ||
      !guardianName ||
      !gender ||
      !dateOfBirth ||
      !guardianPhone ||
      !classId
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class ID.",
      });
    }
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }
    const existingStudent = await Student.findOne({
      admissionNumber: admissionNumber.trim().toUpperCase(),
    });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Admission number already exists.",
      });
    }
    const student = await Student.create({
      admissionNumber: admissionNumber.trim().toUpperCase(),
      fullname: fullname.trim(),
      guardianName: guardianName.trim(),
      gender,
      dateOfBirth,
      guardianPhone: guardianPhone.trim(),
      class: classId,
    });
    await student.populate("class", "className");
    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullname: student.fullname,
        guardianName: student.guardianName,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        guardianPhone: student.guardianPhone,
        class: student.class,
        status: student.status,
        isActive:student.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select("-__v")
      .populate("class", "className")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID.",
      });
    }
    const student = await Student.findById(id)
      .select("-__v")
      .populate("class", "className");
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }
    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID.",
      });
    }
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }
    const {
      admissionNumber,
      fullname,
      guardianName,
      gender,
      dateOfBirth,
      guardianPhone,
      classId,
    } = req.body;
    if (admissionNumber) {
      const existingStudent = await Student.findOne({
        admissionNumber: admissionNumber.trim().toUpperCase(),
        _id: { $ne: id },
      });
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: "Admission number already exists.",
        });
      }
      student.admissionNumber = admissionNumber.trim().toUpperCase();
    }
    if (fullname) {
      student.fullname = fullname.trim();
    }
    if (guardianName) {
      student.guardianName = guardianName.trim();
    }
    if (gender) {
      student.gender = gender.trim();
    }
    if (dateOfBirth) {
      student.dateOfBirth = dateOfBirth;
    }
    if (guardianPhone) {
      student.guardianPhone = guardianPhone.trim();
    }
    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Class ID.",
        });
      }
      const classData = await Class.findById(classId);
      if (!classData) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }
      student.class = classId;
    }

    await student.save();
    await student.populate("class", "className");
    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullname: student.fullname,
        guardianName: student.guardianName,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        guardianPhone: student.guardianPhone,
        class: student.class,
        isActive:student.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const graduateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }
    if (student.status === "Graduated") {
      return res.status(400).json({
        success: false,
        message: "Student is already graduated.",
      });
    }
    if (student.status === "Transferred") {
      return res.status(400).json({
        success: false,
        message: "Transferred students cannot be graduated.",
      });
    }
    student.status = "Graduated";
    await student.save();
    return res.status(200).json({
      success: true,
      message: "Student graduated successfully",
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullname: student.fullname,
        status: student.status,
        isActive:student.isActive
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
const transferStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID.",
      });
    }
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }
    if (student.status === "Transferred") {
      return res.status(400).json({
        success: false,
        message: "Student is already transferred",
      });
    }
    if (student.status === "Graduated") {
      return res.status(400).json({
        success: false,
        message: "Graduated students cannot be transferred",
      });
    }
    student.status = "Transferred";
    await student.save();
    return res.status(200).json({
      success: true,
      message: "Student transferred successfully",
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullname: student.fullname,
        status: student.status,
        isActive:student.isActive
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const deactivateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID.",
      });
    }
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }
    if (!student.isActive) {
      return res.status(400).json({
        success: false,
        message: "Student is already deactivated.",
      });
    }
    student.isActive = false;
    await student.save();
    return res.status(200).json({
      success: true,
      message: "Student deactivated successfully.",
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullname: student.fullname,
        isActive: student.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
const activateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID.",
      });
    }
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }
    if (student.isActive) {
      return res.status(400).json({
        success: false,
        message: "Student is already active.",
      });
    }
    student.isActive = true;
    await student.save();
    return res.status(200).json({
      success: true,
      message: "Student activated successfully.",
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullname: student.fullname,
        isActive: student.isActive,
      },
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
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  graduateStudent,
  transferStudent,
  deactivateStudent,
  activateStudent,
};

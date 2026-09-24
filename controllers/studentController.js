const mongoose = require("mongoose");
const Class = require("../models/Class");
const Student = require("../models/Student");
const User = require("../models/User");
const ClassSubject = require("../models/classSubject");

const createStudent = async (req, res) => {
  try {
    let {
      admissionNumber,
      fullname,
      guardianName,
      gender,
      dateOfBirth,
      guardianPhone,
      classId,
      photo,
    } = req.body;

    if (req.user.role === "teacher") {
      const teacher = await User.findById(req.user.id).populate(
        "assignedClass",
      );

      // Explicitly block Subject Teachers (who have no assignedClass)
      if (!teacher || !teacher.assignedClass) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only Class Teachers can add students.",
        });
      }

      classId = teacher.assignedClass._id.toString();
    }
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
      photo: photo || "",
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

const getAllStudents = async (req, res) => {
  try {
    const query = {};

    // 🔒 SECURITY: If teacher, only fetch students from classes they are authorized to see
    if (req.user.role === "teacher") {
      const teacher = await User.findById(req.user.id).populate(
        "assignedClass",
      );

      if (teacher && teacher.assignedClass) {
        // Class Teacher: only see their assigned homeroom class
        query.class = teacher.assignedClass._id;
      } else {
        // Subject Teacher: see students in classes they teach
        const assignments = await ClassSubject.find({
          subjectTeacher: req.user.id,
        }).select("class");
        const classIds = assignments.map((a) => a.class);

        if (classIds.length > 0) {
          query.class = { $in: classIds };
        } else {
          // Subject teacher with no class assignments yet
          return res.status(200).json({
            success: true,
            count: 0,
            stats: {
              total: 0,
              active: 0,
              graduated: 0,
              transferred: 0,
              inactive: 0,
            },
            students: [],
          });
        }
      }
    } else if (req.query.classId) {
      // Admin can filter by specific class
      query.class = req.query.classId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    // --- FETCH LOGIC ---
    const students = await Student.find(query)
      .select("-__v")
      .populate("class", "className")
      .sort({ createdAt: -1 });

    // Calculate stats
    const total = students.length;
    const active = students.filter((s) => s.status === "Active").length;
    const graduated = students.filter((s) => s.status === "Graduated").length;
    const transferred = students.filter(
      (s) => s.status === "Transferred",
    ).length;
    const inactive = students.filter((s) => !s.isActive).length;

    return res.status(200).json({
      success: true,
      count: total,
      stats: { total, active, graduated, transferred, inactive },
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

    // 🔒 SECURITY: If teacher, ensure they are authorized to view this student
    if (req.user.role === "teacher") {
      const teacher = await User.findById(req.user.id).populate(
        "assignedClass",
      );
      let isAuthorized = false;

      // 1. Check if they are the Class Teacher for this student's class
      if (
        teacher &&
        teacher.assignedClass &&
        teacher.assignedClass._id.toString() === student.class._id.toString()
      ) {
        isAuthorized = true;
      } else {
        // 2. Check if they are a Subject Teacher for this student's class
        const assignment = await ClassSubject.findOne({
          class: student.class._id,
          subjectTeacher: req.user.id,
        });
        if (assignment) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You are not assigned to this class.",
        });
      }
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
if (req.user.role === "teacher") {
  const teacher = await User.findById(req.user.id).populate("assignedClass");
  if (
    !teacher || 
    !teacher.assignedClass || 
    teacher.assignedClass._id.toString() !== student.class.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only edit students in your assigned class.",
    });
  }
}

    const {
      admissionNumber,
      fullname,
      guardianName,
      gender,
      dateOfBirth,
      guardianPhone,
      classId,
      photo,
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
    if (photo !== undefined) {
      student.photo = photo;
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
    if (req.user.role === "teacher") {
      const teacher = await User.findById(req.user.id).populate(
        "assignedClass",
      );
      if (
        !teacher ||
        !teacher.assignedClass ||
        teacher.assignedClass._id.toString() !== student.class._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only graduate/transfer students in your assigned class.",
        });
      }
    }
    if (student.status === "Transferred") {
      return res.status(400).json({
        success: false,
        message: "Transferred students cannot be graduated.",
      });
    }
    student.status = "Graduated";
    student.isActive = false;
    await student.save();
    return res.status(200).json({
      success: true,
      message: "Student graduated successfully",
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullname: student.fullname,
        status: student.status,
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

    if (req.user.role === "teacher") {
      const teacher = await User.findById(req.user.id).populate(
        "assignedClass",
      );
      if (
        !teacher ||
        !teacher.assignedClass ||
        teacher.assignedClass._id.toString() !== student.class._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only graduate/transfer students in your assigned class.",
        });
      }
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
    student.isActive = false;
    await student.save();
    return res.status(200).json({
      success: true,
      message: "Student transferred successfully",
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullname: student.fullname,
        status: student.status,
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
    if (student.isActive && student.status === "Active") {
      return res.status(400).json({
        success: false,
        message: "Student is already active.",
      });
    }
    student.isActive = true;
    student.status = "Active";
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

const promoteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { nextClassId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Student ID." });
    }
    if (!nextClassId || !mongoose.Types.ObjectId.isValid(nextClassId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid Next Class ID is required." });
    }

    const student = await Student.findById(id).populate("class", "className");
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    // 🔒 SECURITY: If teacher, ensure they are the class teacher of the student's CURRENT class
    if (req.user.role === "teacher") {
      const teacher = await User.findById(req.user.id).populate(
        "assignedClass",
      );
      if (
        !teacher ||
        !teacher.assignedClass ||
        teacher.assignedClass._id.toString() !== student.class._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. You can only promote students in your assigned class.",
        });
      }
    }

    if (student.status === "Graduated") {
      return res
        .status(400)
        .json({ success: false, message: "Student is already graduated." });
    }
    if (student.status === "Transferred") {
      return res.status(400).json({
        success: false,
        message: "Transferred students cannot be promoted.",
      });
    }

    const nextClass = await Class.findById(nextClassId);
    if (!nextClass) {
      return res
        .status(404)
        .json({ success: false, message: "Next class not found." });
    }

    // Update student details
    student.class = nextClassId;
    student.status = "Active";
    student.isActive = true;
    await student.save();
    await student.populate("class", "className");

    return res.status(200).json({
      success: true,
      message: `Student promoted to ${nextClass.className} successfully.`,
      student: {
        id: student.id,
        fullname: student.fullname,
        class: student.class,
        status: student.status,
        isActive: student.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
  }
};

const bulkPromoteStudents = async (req, res) => {
  try {
    const { studentIds, nextClassId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one student.",
      });
    }
    if (!nextClassId || !mongoose.Types.ObjectId.isValid(nextClassId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid Next Class ID is required." });
    }

    const nextClass = await Class.findById(nextClassId);
    if (!nextClass) {
      return res
        .status(404)
        .json({ success: false, message: "Next class not found." });
    }

    // 🔒 SECURITY: If teacher, ensure all selected students belong to their class
    if (req.user.role === "teacher") {
      const teacher = await User.findById(req.user.id).populate(
        "assignedClass",
      );
      if (!teacher || !teacher.assignedClass) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied." });
      }

      const students = await Student.find({ _id: { $in: studentIds } });
      const unauthorized = students.some(
        (s) => s.class.toString() !== teacher.assignedClass._id.toString(),
      );
      if (unauthorized) {
        return res.status(403).json({
          success: false,
          message: "You can only promote students in your assigned class.",
        });
      }
    }

    // Perform bulk update
    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { class: nextClassId, status: "Active", isActive: true } },
    );

    return res.status(200).json({
      success: true,
      message: `Successfully promoted ${result.modifiedCount} student(s) to ${nextClass.className}.`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error." });
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
  promoteStudent,
  bulkPromoteStudents,
};

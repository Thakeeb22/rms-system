const mongoose = require("mongoose")
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Session = require("../models/Session");
const Term = require("../models/Term");
const { getLateCutoffDate } = require("../config/attendanceConfig");

// ==========================================
// HELPER: Get Current Active Session & Term
// ==========================================
const getCurrentSessionAndTerm = async () => {
  // ✅ FIXED: Changed 'isActive' to 'isCurrent' to match your Session.js and Term.js schemas
  const session = await Session.findOne({ isCurrent: true });
  const term = await Term.findOne({ isCurrent: true });
  return { session, term };
};

// ==========================================
// 1. SCAN QR (Unified Gate Attendance)
// ==========================================
exports.scanQR = async (req, res) => {
  try {
    const { qrToken, studentId, offlineId } = req.body;

    let student;
    if (qrToken) {
      student = await Student.findOne({ qrToken }).populate(
        "class",
        "className",
      );
    } else if (studentId) {
      student = await Student.findById(studentId).populate(
        "class",
        "className",
      );
    }

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    if (!student.class) {
      return res.status(400).json({
        success: false,
        message: "Student is not assigned to a class.",
      });
    }

    // 2. Get Context (Session/Term)
    const { session, term } = await getCurrentSessionAndTerm();
    if (!session || !term) {
      return res.status(500).json({
        success: false,
        message: "No active session or term configured.",
      });
    }

    // 3. Normalize Date to Start of Day (00:00:00) for accurate daily tracking
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    // 4. Check for Existing Record (Duplicate Protection)
    // If offlineId is provided, check that first for idempotency
    if (offlineId) {
      const existingById = await Attendance.findOne({ offlineId });
      if (existingById) {
        return res.status(200).json({
          success: true,
          message: "Already recorded (Synced).",
          data: existingById,
        });
      }
    }

    const existingToday = await Attendance.findOne({
      student: student._id,
      date: startOfDay,
    });

    if (existingToday) {
      return res.status(200).json({
        success: true,
        message: "Student already checked in today.",
        data: existingToday,
      });
    }

    // 5. Determine Status (Present vs Late)
    const checkInTime = new Date();
    const cutoffTime = getLateCutoffDate(today);
    const status = checkInTime > cutoffTime ? "Late" : "Present";

    // 6. Create Attendance Record (Historical Snapshot)
    const attendanceRecord = await Attendance.create({
      student: student._id,
      class: student.class._id, // Snapshots the class ID at this exact moment
      session: session._id,
      term: term._id,
      date: startOfDay,
      checkInTime,
      status,
      method: "QR",
      recordedBy: req.user.id, // Comes from your JWT auth middleware
      offlineId: offlineId || undefined,
    });

    // 7. Return minimal UI data
    res.status(201).json({
      success: true,
      message: "Attendance recorded successfully.",
      data: {
        studentName: student.fullname,
        admissionNumber: student.admissionNumber,
        className: student.class.className,
        status,
        checkInTime: attendanceRecord.checkInTime,
      },
    });
  } catch (error) {
    // Handle MongoDB Duplicate Key Error (Race condition protection)
    if (error.code === 11000) {
      return res
        .status(200)
        .json({ success: true, message: "Already checked in today." });
    }
    console.error("Scan QR Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ==========================================
// 2. GET MY CLASS ATTENDANCE (For Teachers)
// ==========================================
exports.getMyClassAttendance = async (req, res) => {
  try {
    const { date, classId } = req.query;

    // Normalize requested date
    const requestedDate = date
      ? new Date(new Date(date).setHours(0, 0, 0, 0))
      : new Date(new Date().setHours(0, 0, 0, 0));

    // TODO: Add middleware/logic here to verify req.user is assigned to classId.
    // For now, we assume the frontend only requests classes the teacher is allowed to see.

    const attendanceRecords = await Attendance.find({
      class: classId,
      date: requestedDate,
    }).populate("student", "fullname admissionNumber photo");

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Get Class Attendance Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ==========================================
// 3. GET ALL ATTENDANCE (For Admins)
// ==========================================
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, classId } = req.query;
    const requestedDate = date
      ? new Date(new Date(date).setHours(0, 0, 0, 0))
      : new Date(new Date().setHours(0, 0, 0, 0));

    const query = { date: requestedDate };
    if (classId) query.class = classId;

    const attendanceRecords = await Attendance.find(query)
      .populate("student", "fullname admissionNumber photo")
      .populate("class", "className")
      .sort({ checkInTime: -1 }); // Newest scans first

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Get All Attendance Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ==========================================
// 4. UPDATE ATTENDANCE (Admin Correction)
// ==========================================
exports.updateAttendance = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Present", "Late", "Absent", "Excused"];

    if (!status || !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status." });
    }

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, method: "MANUAL" }, // Mark as manually corrected
      { new: true, runValidators: true },
    );

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Attendance updated.", data: record });
  } catch (error) {
    console.error("Update Attendance Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};
// ==========================================
// 5. GET STUDENT ATTENDANCE STATS (For Assessments)
// ==========================================
exports.getStudentAttendanceStats = async (req, res) => {
  try {
    const { studentId, sessionId, termId } = req.query;

    if (!studentId || !sessionId || !termId) {
      return res.status(400).json({
        success: false,
        message: "studentId, sessionId, and termId are required.",
      });
    }

    // Aggregate attendance records for this specific student, session, and term
    const stats = await Attendance.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          session: new mongoose.Types.ObjectId(sessionId),
          term: new mongoose.Types.ObjectId(termId),
        },
      },
      {
        $group: {
          _id: null,
          schoolOpened: { $sum: 1 }, // Every record is a day the school opened
          present: {
            $sum: {
              $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0],
            },
          },
          absent: {
            $sum: {
              $cond: [{ $in: ["$status", ["Absent", "Excused"]] }, 1, 0],
            },
          },
        },
      },
    ]);

    const result = stats[0] || { schoolOpened: 0, present: 0, absent: 0 };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Student Attendance Stats Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

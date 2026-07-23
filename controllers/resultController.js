const mongoose = require("mongoose");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Session = require("../models/Session");
const Term = require("../models/Term");
const User = require("../models/User");
const Result = require("../models/Result");

const createResult = async (req, res) => {
  try {
    const {
      studentId,
      subjectId,
      classId,
      sessionId,
      termId,
      test1,
      test2,
      exam,
    } = req.body;
    const teacherId =
      req.user.role === "teacher" ? req.user.id : req.body.teacherId;
    if (req.user.role === "admin" && !req.body.teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required",
      });
    }
    if (
      !studentId ||
      !subjectId ||
      !teacherId ||
      !classId ||
      !sessionId ||
      !termId ||
      [test1, test2, exam].some((score) => score == null)
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID.",
      });
    }
    const studentData = await Student.findById(studentId);
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subject ID.",
      });
    }
    const subjectData = await Subject.findById(subjectId);
    if (!subjectData) {
      return res.status(404).json({
        success: false,
        message: "Subject not found.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Teacher ID.",
      });
    }
    const teacherData = await User.findById(teacherId);
    if (!teacherData) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }
    if (teacherData.role !== "teacher") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a teacher.",
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
        message: "Class not found.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Session ID.",
      });
    }
    const sessionData = await Session.findById(sessionId);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(termId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Term ID.",
      });
    }
    const termData = await Term.findById(termId);
    if (!termData) {
      return res.status(404).json({
        success: false,
        message: "Term not found.",
      });
    }
    const existingResult = await Result.findOne({
      student: studentId,
      subject: subjectId,
      class: classId,
      session: sessionId,
      term: termId,
    });
    if (existingResult) {
      return res.status(409).json({
        success: false,
        message:
          "Result already exists for this student, subject, session and term.",
      });
    }
    if (studentData.class.toString() !== classId) {
      return res.status(400).json({
        success: false,
        message: "Student does not belong to the selected class.",
      });
    }
    if (
      !teacherData.assignedClass ||
      teacherData.assignedClass.toString() !== classId
    ) {
      return res.status(400).json({
        success: false,
        message: "Teacher is not assigned to the selected class.",
      });
    }
    const teachesSubject = teacherData.subjects.some(
      (subject) => subject.toString() === subjectId,
    );
    if (!teachesSubject) {
      return res.status(400).json({
        success: false,
        message: "Teacher is not assigned to this subject.",
      });
    }
    if (!studentData.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot enter result for an inactive student.",
      });
    }
    if (test1 < 0 || test1 > 20) {
      return res.status(400).json({
        success: false,
        message: "Test 1 score must be between 0 and 20.",
      });
    }
    if (test2 < 0 || test2 > 20) {
      return res.status(400).json({
        success: false,
        message: "Test 2 score must be between 0 and 20.",
      });
    }
    if (exam < 0 || exam > 60) {
      return res.status(400).json({
        success: false,
        message: "Exam score must be between 0 and 60",
      });
    }
    const result = await Result.create({
      student: studentId,
      subject: subjectId,
      teacher: teacherId,
      session: sessionId,
      term: termId,
      test1,
      test2,
      exam,
    });

    await result.populate([
      { path: "student", select: "fullname admissionNumber" },
      { path: "subject", select: "subjectName" },
      { path: "teacher", select: "fullname" },
      { path: "class", select: "className" },
      { path: "session", select: "name" },
      { path: "term", select: "name" },
    ]);
    return res.status(201).json({
      success: true,
      message: "Result created successfully",
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getAllResults = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "teacher") {
      query.teacher = req.user.id;
    }
    if (req.query.classId) {
      query.class = req.query.classId;
    }
    if (req.query.sessionId) {
      query.session = req.query.sessionId;
    }
    if (req.query.termId) {
      query.term = req.query.termId;
    }
    if (req.query.subjectId) {
      query.subject = req.query.subjectId;
    }
    if (req.query.studentId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.studentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid StudentID.",
        });
      }
      query.student = req.query.studentId;
    }
    if (req.query.teacherId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.teacherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Teacher ID.",
        });
      }
      if (req.user.role === "admin") {
        query.teacher = req.query.teacherId;
      }
    }
    const results = await Result.find(query)
      .select("-__v")
      .populate("student", "fullname admissionNumber")
      .populate("subject", "subjectName")
      .populate("teacher", "fullname")
      .populate("class", "className")
      .populate("session", "name")
      .populate("term", "name")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getResultById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Result ID.",
      });
    }
    const result = await Result.findById(id)
      .select("-__v")
      .populate("student", "fullname admissionNumber")
      .populate("subject", "subjectName")
      .populate("teacher", "fullname")
      .populate("class", "className")
      .populate("session", "name")
      .populate("term", "name");
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found.",
      });
    }
    if (
      req.user.role === "teacher" &&
      result.teacher._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this result.",
      });
    }
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Result ID.",
      });
    }
    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found.",
      });
    }
    if (
      req.user.role === "teacher" &&
      result.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own results.",
      });
    }
    if (result.published) {
      return res.status(400).json({
        success: false,
        message: "Published results cannot be edited.",
      });
    }
    const { test1, test2, exam } = req.body;
    if (test1 == null && test2 == null && exam == null) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one score to update.",
      });
    }
    if (test1 != null && (test1 < 0 || test1 > 20)) {
      return res.status(400).json({
        success: false,
        message: "Test 1 score must be between 0 and 20",
      });
    }
    if (test2 != null && (test2 < 0 || test2 > 20)) {
      return res.status(400).json({
        success: false,
        message: "Test 2 score must be between 0 and 20",
      });
    }
    if (exam != null && (exam < 0 || exam > 60)) {
      return res.status(400).json({
        success: false,
        message: "Exam score must be between 0 and 60",
      });
    }
    if (test1 != null) result.test1 = test1;
    if (test2 != null) result.test2 = test2;
    if (exam != null) result.exam = exam;

    await result.save();
    await result.populate([
      { path: "student", select: "fullname admissionNumber" },
      { path: "subject", select: "subjectName" },
      { path: "teacher", select: "fullname" },
      { path: "class", select: "className" },
      { path: "session", select: "name" },
      { path: "term", select: "name" },
    ]);
    return res.status(200).json({
      success: true,
      message: "Result updated successfully.",
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Result ID.",
      });
    }
    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found.",
      });
    }
    if (
      req.user.role === "teacher" &&
      result.teacher.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own results.",
      });
    }
    if (result.published) {
      return res.status(400).json({
        success: false,
        message: "Published results cannot be deleted.",
      });
    }
    await result.deleteOne();
    return res.status(200).json({
      success: true,
      message: "Result Deleted Successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const publishResult = async (req, res) => {
  try {
    const { classId, sessionId, termId } = req.body;

    if (!classId || !sessionId || !termId) {
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
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Session ID.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(termId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Term ID.",
      });
    }
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }
    const sessionData = await Session.findById(sessionId);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
    const termData = await Term.findById(termId);
    if (!termData) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }
    const results = await Result.find({
      class: classId,
      session: sessionId,
      term: termId,
    });
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No results found for the selected class, session and term.",
      });
    }
    const unpublished = results.filter((result) => !result.published);
    if (unpublished.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Results have already been published.",
      });
    }
    await Result.updateMany(
      {
        class: classId,
        session: sessionId,
        term: termId,
      },
      {
        published: true,
      },
    );
    return res.status(200).json({
      success: true,
      message: `${unpublished.length} result(s) published successfully.`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const unpublishResult = async (req, res) => {
  try {
    const { classId, sessionId, termId } = req.body;
    if (!classId || !sessionId || !termId) {
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
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Session ID.",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(termId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Term ID.",
      });
    }
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }
    const sessionData = await Session.findById(sessionId);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
    const termData = await Term.findById(termId);
    if (!termData) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }
    const results = await Result.find({
      class: classId,
      session: sessionId,
      term: termId,
    });
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No results found for the selected class, session and term.",
      });
    }
    const published = results.filter((result) => result.published);
    if (published.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Results have already been unpublished.",
      });
    }
    await Result.updateMany(
      {
        class: classId,
        session: sessionId,
        term: termId,
      },
      {
        published: false,
      },
    );
    return res.status(200).json({
      success: true,
      message: `${published.length} result(s) unpublished successfully.`,
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
  createResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
  publishResult,
  unpublishResult,
};

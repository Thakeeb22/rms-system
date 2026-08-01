const Student = require("../models/Student");
const User = require("../models/User");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const Result = require("../models/Result");
const Session = require("../models/Session");
const Term = require("../models/Term");

const getDashboardSummary = async () => {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    totalResults,
    totalSessions,
    totalTerms,
    publishedResults,
    unpublishedResults,
  ] = await Promise.all([
    Student.countDocuments(),
    User.countDocuments({ role: "teacher" }),
    Class.countDocuments(),
    Subject.countDocuments(),
    Result.countDocuments(),
    Session.countDocuments(),
    Term.countDocuments(),
    Result.countDocuments({ published: true }),
    Result.countDocuments({ published: false }),
  ]);
  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    totalResults,
    totalSessions,
    totalTerms,
    publishedResults,
    unpublishedResults,
  };
};

const getRecentActivties = async () => {
  const [latestStudents, latestTeachers, latestResults] = await Promise.all([
    Student.find()
      .select("fullname admissionNumber createdAt")
      .sort({ createdAt: -1 })
      .limit(5),

    User.find({ role: "teacher" })
      .select("fullname email createdAt")
      .sort({ createdAt: -1 })
      .limit(5),

    Result.find()
      .populate("student", "fullname admissionNumber")
      .populate("subject", "subjectName")
      .populate("class", "className")
      .select("student subject class total grade published createdAt")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);
  return {
    latestStudents,
    latestTeachers,
    latestResults,
  };
};

module.exports = { getDashboardSummary, getRecentActivties };

const mongoose = require("mongoose");
const Term = require("../models/Term");
const Student = require("../models/Student");
const Session = require("../models/Session");
const Result = require("../models/Result");
const ReportAssessment = require("../models/StudentAssessment");

const buildStudentReport = async (studentId, sessionId, termId) => {
  if (!studentId || !sessionId || !termId) {
    throw new Error("Student, Session and Term are required.");
  }
  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(sessionId) ||
    !mongoose.Types.ObjectId.isValid(termId)
  ) {
    throw new Error("Invalid ID supplied.");
  }

  const student = await Student.findById(studentId).populate(
    "class",
    "className",
  );
  if (!student) {
    throw new Error("Student not found.");
  }
  const session = await Session.findById(sessionId).select("sessionName");
  if (!session) {
    throw new Error("Session not found.");
  }
  const term = await Term.findById(termId).select("termName");
  if (!term) {
    throw new Error("Term not found.")
  }

  const results = await Result.find({
    student: studentId,
    session: sessionId,
    term: termId,
    published: true,
  })
    .select("-__v -createdAt -updatedAt")
    .populate("subject", "subjectName")
    .populate("teacher", "fullname")
    .populate("class", "className")
    .sort({ createdAt: 1 });

  if (results.length === 0) {
    throw new Error("No published results found for this student in the selected session and term.")
  }
  const totalSubjects = results.length;
  const grandTotal = results.reduce((sum, result) => sum + result.total, 0);
  const average = totalSubjects > 0 ? grandTotal / totalSubjects : 0;
  const classResults = await Result.find({
    class: student.class._id,
    session: sessionId,
    term: termId,
    published: true,
  });
  const studentPerformance = {};
  classResults.forEach((result) => {
    const studentId = result.student.toString();
    if (!studentPerformance[studentId]) {
      studentPerformance[studentId] = {
        total: 0,
        subjects: 0,
      };
    }
    studentPerformance[studentId].total += result.total;
    studentPerformance[studentId].subjects += 1;
  });
  const rankings = Object.entries(studentPerformance).map(
    ([studentId, data]) => ({
      studentId,
      average: data.total / data.subjects,
    }),
  );
  rankings.sort((a, b) => b.average - a.average);
  const numberInClass = rankings.length;

  const index = rankings.findIndex((item) => item.studentId === studentId);
  const position = index >= 0 ? index + 1 : null;
  const getOrdinal = (n) => {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  };
  const classPosition = position ? getOrdinal(position) : "N/A";
  let overallGrade = "";
  if (average >= 70) overallGrade = "A";
  else if (average >= 60) overallGrade = "B";
  else if (average >= 50) overallGrade = "C";
  else if (average >= 45) overallGrade = "D";
  else if (average >= 40) overallGrade = "E";
  else overallGrade = "F";
  let overallRemark = "";
  if (average >= 70) overallRemark = "Excellent";
  else if (average >= 60) overallRemark = "Very Good";
  else if (average >= 50) overallRemark = "Good";
  else if (average >= 45) overallRemark = "Fair";
  else if (average >= 40) overallRemark = "Pass";
  else overallRemark = "Fail";
  let teacherRemark = "";
  if (average >= 70) teacherRemark = "Excellent performance. Keep it up.";
  else if (average >= 60) teacherRemark = "Very Good work. Aim even higher.";
  else if (average >= 50)
    teacherRemark = "Good effort. There's room for improvement.";
  else if (average >= 45) teacherRemark = "Fair performance. Study harder.";
  else if (average >= 40) teacherRemark = "Needs more commitment.";
  else teacherRemark = "Poor performance. Serious improvement is required.";
  let principalRemark = "";
  if (term.termName === "Third Term") {
    if (average >= 70) {
      principalRemark = "Promoted to the next class. Excellent performance.";
    } else if (average >= 60) {
      principalRemark = "Promoted to the next class. Good performance.";
    } else if (average >= 50) {
      principalRemark = "Promoted to the next class. Satisfactory performance.";
    } else if (average >= 45) {
      principalRemark = "Promoted to the next class. Needs improvement.";
    } else if (average >= 40) {
      principalRemark =
        "Promoted to the next class. Greater effort is expected next session.";
    } else {
      principalRemark = "Not promoted. Significant improvement is required.";
    }
  } else {
    if (average >= 70) {
      principalRemark = "Excellent performance. Keep it up.";
    } else if (average >= 60) {
      principalRemark = "Very good performance. Aim even higher.";
    } else if (average >= 50) {
      principalRemark = "Good performance. There is room for improvement.";
    } else if (average >= 45) {
      principalRemark = "Fair performance. Study harder.";
    } else if (average >= 40) {
      principalRemark = "Greater effort is expected next term.";
    } else {
      principalRemark =
        "Significant improvement is required. Consider extra classes.";
    }
  }
  const classTeacher = results[0].teacher.fullname;
  const assessment = await ReportAssessment.findOne({
    student: studentId,
    session: sessionId,
    term: termId,
  })
    .select("-student -session -term -__v -createdAt -updatedAt")
    .populate("student", "fullname admissionNumber")
    .populate("session", "sessionName")
    .populate("term", "termName");
  if (!assessment) {
    throw new Error("Student assessment has not been added.")
  }
  return {
    student: {
      fullname: student.fullname,
      admissionNumber: student.admissionNumber,
      class: student.class.className,
    },
    session,
    term,
    summary: {
      totalSubjects,
      grandTotal,
      average: Number(average.toFixed(2)),
      position: classPosition,
      numberInClass,
      classTeacher,
      overallGrade,
      overallRemark,
      teacherRemark,
      principalRemark,
      positionDisplay: `${classPosition} out of ${numberInClass}`,
    },
    assessment,
    results,
  };
};
module.exports = { buildStudentReport };

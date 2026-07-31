const mongoose = require("mongoose");
const Student = require("../models/Student");
const Session = require("../models/Session");
const Term = require("../models/Term");
const Result = require("../models/Result");

const buildAnnualReport = async (studentId, sessionId) => {
  if (!studentId || !sessionId) {
    throw new Error("Student and Session are required");
  }
  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(sessionId)
  ) {
    throw new Error("Invalid ID.");
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

  const terms = await Term.find().sort({ order: 1 });
  if (terms.length === 0) {
    throw new Error("No terms found.");
  }
  const termReports = [];

  let annualGrandTotal = 0;
  let annualSubjects = 0;

  for (const term of terms) {
    const results = await Result.find({
      student: studentId,
      session: sessionId,
      term: term._id,
      published: true,
    })
      .select("-__v -createdAt -updatedAt")
      .populate("subject", "subjectName")
      .populate("teacher", "fullname")
      .populate("class", "className")
      .sort({ createdAt: 1 });
    if (results.length === 0) {
      continue;
    }

    const totalSubjects = results.length;

    const grandTotal = results.reduce((sum, result) => sum + result.total, 0);

    const average = grandTotal / totalSubjects;

    let grade = "";
    let remark = "";

    if (average >= 70) {
      grade = "A";
      remark = "Excellent";
    } else if (average >= 60) {
      grade = "B";
      remark = "Very Good";
    } else if (average >= 50) {
      grade = "C";
      remark = "Good";
    } else if (average >= 45) {
      grade = "D";
      remark = "Fair";
    } else if (average >= 40) {
      grade = "E";
      remark = "Pass";
    } else {
      grade = "F";
      remark = "Fail";
    }

    termReports.push({
      _id: term._id,
      term: term.termName,
      totalSubjects,
      grandTotal,
      average: Number(average.toFixed(2)),
      grade,
      remark,
      results,
    });
    annualGrandTotal += grandTotal;
    annualSubjects += totalSubjects;
  }
  if (termReports.length === 0) {
    throw new Error("No published results for this session.");
  }
  const annualAverage = annualGrandTotal / annualSubjects;

  let teacherRemark = "";

  if (annualAverage >= 70) {
    teacherRemark =
      "Excellent performance throughout the academic session. Keep it up.";
  } else if (annualAverage >= 60) {
    teacherRemark = "Very good performance. Continue working hard.";
  } else if (annualAverage >= 50) {
    teacherRemark = "Good performance. Greater consistency is needed.";
  } else if (annualAverage >= 45) {
    teacherRemark = "Fair performance. Put more effort into your studies.";
  } else if (annualAverage >= 40) {
    teacherRemark = "You can do better with more commitment.";
  } else {
    teacherRemark = "Poor performance. Serious improvement is required.";
  }
  let principalRemark = "";

  if (annualAverage >= 70) {
    principalRemark = "Promoted to the next class. Outstanding performance.";
  } else if (annualAverage >= 60) {
    principalRemark = "Promoted to the next class. Very good performance.";
  } else if (annualAverage >= 50) {
    principalRemark = "Promoted to the next class. Good performance.";
  } else if (annualAverage >= 45) {
    principalRemark = "Promoted to the next class. Fair performance.";
  } else if (annualAverage >= 40) {
    principalRemark =
      "Promoted to the next class. Greater effort is expected next session.";
  } else {
    principalRemark = "Not promoted. Significant improvement is required.";
  }

  const classResults = await Result.find({
    class: student.class._id,
    session: sessionId,
    published: true,
  });
  const studentPerformance = {};

  classResults.forEach((result) => {
    const id = result.student.toString();
    if (!studentPerformance[id]) {
      studentPerformance[id] = {
        total: 0,
        subjects: 0,
      };
    }
    studentPerformance[id].total += result.total;
    studentPerformance[id].subjects += 1;
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
    if (n % 100 >= 11 && n % 100 <= 13) {
      return `${n}th`;
    }
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
  const annualPosition = position ? getOrdinal(position) : "N/A";

  let annualGrade = "";
  let annualRemark = "";

  if (annualAverage >= 70) {
    annualGrade = "A";
    annualRemark = "Excellent";
  } else if (annualAverage >= 60) {
    annualGrade = "B";
    annualRemark = "Very Good";
  } else if (annualAverage >= 50) {
    annualGrade = "C";
    annualRemark = "Good";
  } else if (annualAverage >= 45) {
    annualGrade = "D";
    annualRemark = "Fair";
  } else if (annualAverage >= 40) {
    annualGrade = "E";
    annualRemark = "Pass";
  } else {
    annualGrade = "F";
    annualRemark = "Fail";
  }

  const promotionStatus =
    annualAverage >= 40 ? "Promoted to the next class" : "Not Promoted";

  return {
    student: {
      fullname: student.fullname,
      admissionNumber: student.admissionNumber,
      class: student.class.className,
    },
    session,
    termReports,
    annualSummary: {
      annualGrandTotal,
      annualSubjects,
      annualAverage: Number(annualAverage.toFixed(2)),
      annualGrade,
      annualRemark,
      teacherRemark,
      principalRemark,
      promotionStatus,
      annualPosition,
      numberInClass,
      positionDisplay: `${annualPosition} out of ${numberInClass}`,
    },
  };
};
module.exports = { buildAnnualReport };

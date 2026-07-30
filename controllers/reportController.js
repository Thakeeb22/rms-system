const { buildStudentReport } = require("../services/reportServices");

const getStudentReport = async (req, res) => {
  try {
    const { studentId, sessionId, termId } = req.query;
    const report = await buildStudentReport(studentId, sessionId, termId);
    return res.status(200).json({
      success: true,
      ...report,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = { getStudentReport };

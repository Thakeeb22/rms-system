const { buildAnnualReport } = require("../services/annualReportService");

const getAnnualReport = async (req, res) => {
  try {
    const { studentId, sessionId } = req.query;
    const report = await buildAnnualReport(studentId, sessionId);
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
module.exports = { getAnnualReport };

const pupperteer = require("puppeteer");
const { buildStudentReport } = require("../services/reportServices");
const reportCardTemplate = require("../templates/reportCardTemplates");

const generateStudentReportPDF = async (req, res) => {
  try {
    const { studentId, sessionId, termId } = req.query;
    console.log("1. Building reports...");
    const report = await buildStudentReport(studentId, sessionId, termId);
    console.log("2. Building HTML...");
    const html = reportCardTemplate(report);
    console.log("Launching browser");
    const browser = await pupperteer.launch({
      headless: "new",
      executablePath:process.env.CHROME_PATH || undefined,
      protocolTimeout: 120000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    console.log("Browser launched successfully");
    const page = await browser.newPage();
    console.log("new page created...");
    await page.setContent(html, { waitUntil: "networkidle0" });
    console.log("html loaded...");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    console.log("pdf generated...");
    await browser.close();
    console.log("browser closed");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=${report.student.admissionNumber}-report-card.pdf`,
    });
    return res.send(pdf);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = { generateStudentReportPDF };

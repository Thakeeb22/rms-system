const puppeteer = require("puppeteer");
const { buildAnnualReport } = require("../services/annualReportService");
const annualReportTemplate = require("../templates/annualReportTemplate");

const generateAnnualReportPDF = async (req, res) => {
  try {
    const { studentId, sessionId } = req.query;

    console.log("1. Building annual report...");
    const report = await buildAnnualReport(studentId, sessionId);

    console.log("2. Building HTML...");
    const html = annualReportTemplate(report);

    console.log("Launching browser...");
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.CHROME_PATH,
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

    console.log("New page created...");

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    console.log("HTML loaded...");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    console.log("PDF generated...");

    await browser.close();

    console.log("Browser closed");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=${report.student.admissionNumber}-annual-report.pdf`,
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

module.exports = {
  generateAnnualReportPDF,
};
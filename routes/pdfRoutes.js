const express = require("express");
const router = express.Router();

const { generateStudentReportPDF } = require("../controllers/pdfController");

router.get("/student-report", generateStudentReportPDF);
module.exports = router;

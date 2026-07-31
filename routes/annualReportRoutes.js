const express = require("express");
const { getAnnualReport } = require("../controllers/annualReportController");
const { generateAnnualReportPDF } = require("../controllers/annualPdfController");

const router = express.Router();

router.get("/", getAnnualReport);
router.get("/pdf", generateAnnualReportPDF);

module.exports = router;
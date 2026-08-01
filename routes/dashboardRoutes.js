const express = require("express");
const {
  dashboardSummary,
  recentActivities,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/summary", dashboardSummary);
router.get("/recent-activities", recentActivities)
module.exports = router;

const {
  getDashboardSummary,
  getRecentActivties,
} = require("../services/dashboardService");

const dashboardSummary = async (req, res) => {
  try {
    const summary = await getDashboardSummary();
    return res.status(200).json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const recentActivities = async (req, res) => {
  try {
    const activities = await getRecentActivties();
    return res.status(200).json({
      success: true,
      ...activities,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { dashboardSummary, recentActivities };

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const annualReportRoutes = require("./routes/annualReportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const path = require("path");
const teacherRoutes = require("./routes/teacherRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

dotenv.config();
connectDB();
const app = express();

// middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/annual-report", annualReportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(express.static(path.join(__dirname, "views")));
app.use("/api/teacher", teacherRoutes);
app.use("/api/attendance", attendanceRoutes);

// test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Result Management System api is running",
  });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

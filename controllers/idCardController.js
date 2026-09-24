const Student = require("../models/Student");

// Get students for ID Card generation
const getStudentsForIdCards = async (req, res) => {
  try {
    const { classId, studentIds } = req.query;

    let query = { isActive: true }; // Only generate for active students

    if (studentIds) {
      const idsArray = studentIds.split(",");
      query._id = { $in: idsArray };
    } else if (classId) {
      query.class = classId;
    }

    // ✅ ADDED 'guardianName' to the select string
    const students = await Student.find(query)
      .populate("class", "className")
      .select("fullname admissionNumber guardianName class qrToken photo status")
      .sort({ "class.className": 1, admissionNumber: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get ID Card Students Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { getStudentsForIdCards };
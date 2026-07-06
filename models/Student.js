const mongoose = required("mongoose");
const studentSchema = new mongoose.Schema(
  {
    admissionNumber: {
      type: String,
      required: [true, "Admission Number is required"],
      unique: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: [true, "Student Name is required"],
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    guardianPhone: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Graduated", "Transferred"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Student", studentSchema);

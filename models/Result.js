const mongoose = require("mongoose");
const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    test1: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    test2: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    exam: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F"],
    },
    remark: {
      type: String,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
// prevent duplicate results for the same student, subject,session and term
resultSchema.index(
  {
    student: 1,
    subject: 1,
    session: 1,
    term: 1,
  },
  {
    unique: true,
  },
);
resultSchema.pre("save", function (next) {
  this.total = this.test1 + this.test2 + this.exam;
  if (this.total >= 70) {
    this.grade = "A";
    this.remark = "Excellent";
  } else if (this.total >= 60) {
    this.grade = "B";
    this.remark = "Very Good";
  } else if (this.total >= 50) {
    this.grade = "C";
    this.remark = "Good";
  } else if (this.total >= 45) {
    this.grade = "D";
    this.remark = "Fair";
  } else if (this.total >= 40) {
    this.grade = "E";
    this.remark = "Pass";
  } else {
    this.grade = "F";
    this.remark = "Fail";
  }
  next();
});
module.exports = mongoose.model("Result", resultSchema);

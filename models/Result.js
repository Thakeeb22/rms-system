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
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
      required: true,
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
module.exports = mongoose.model("Result", resultSchema);

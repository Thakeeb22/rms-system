const mongoose = require("mongoose");

const classSubjectSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },

    subjectTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

classSubjectSchema.index(
  { class: 1, subject: 1 },
  { unique: true }
);

module.exports = mongoose.model("ClassSubject", classSubjectSchema);
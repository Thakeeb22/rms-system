const mongoose = require("mongoose");

const reportAssessmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
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

    attendance: {
      schoolOpened: {
        type: Number,
        default: 0,
      },
      present: {
        type: Number,
        default: 0,
      },
      absent: {
        type: Number,
        default: 0,
      },
    },

    psychomotor: {
      handwriting: {
        type: Number,
        min: 1,
        max: 5,
      },
      sports: {
        type: Number,
        min: 1,
        max: 5,
      },
      handlingTools: {
        type: Number,
        min: 1,
        max: 5,
      },
      drawing: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    affective: {
      punctuality: {
        type: Number,
        min: 1,
        max: 5,
      },
      neatness: {
        type: Number,
        min: 1,
        max: 5,
      },
      honesty: {
        type: Number,
        min: 1,
        max: 5,
      },
      politeness: {
        type: Number,
        min: 1,
        max: 5,
      },
      attentiveness: {
        type: Number,
        min: 1,
        max: 5,
      },
      leadership: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    nextTermBegins: Date,

    classTeacherComment: {
      type: String,
      trim: true,
    },

    principalComment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

reportAssessmentSchema.index(
  { student: 1, session: 1, term: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ReportAssessment",
  reportAssessmentSchema
);
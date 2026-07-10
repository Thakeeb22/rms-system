const mongoose = require("mongoose");
const termSchema = new mongoose.Schema(
  {
    termName: {
      type: String,
      required: [true, "Term Name is required"],
      enum: ["First Term", "Second Term", "Third Term"],
      unique: true,
      trim:true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Term", termSchema);

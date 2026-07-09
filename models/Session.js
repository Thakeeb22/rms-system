const mongoose = require("mongoose");
const sessionSchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: [true, "Session Name is required"],
      unique: true,
      trim: true,
      uppercase: true,
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
module.exports = mongoose.model("Session", sessionSchema);

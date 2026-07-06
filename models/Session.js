const mongoose = require("mongoose");
const sessionSchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: [true, "Session NAme is required"],
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Session", sessionSchema);

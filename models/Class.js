const mongoose = require("mongoose");
const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Class Name is required"],
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("CLass", classSchema);
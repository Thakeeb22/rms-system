const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone Number is required"],
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "teacher"],
      default: "teacher",
      required: null,
    },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("User", userSchema);

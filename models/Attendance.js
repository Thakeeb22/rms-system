const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    // Historical Snapshots: Preserves the exact context at the time of scanning
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      required: true,
    },
    // The calendar date of the attendance (normalized to start of day for indexing)
    date: {
      type: Date,
      required: true,
    },
    // The exact timestamp the scan occurred
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Present', 'Late'],
      default: 'Present',
    },
    method: {
      type: String,
      enum: ['QR', 'MANUAL'],
      default: 'QR',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Idempotency key for safe offline synchronization
    offlineId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple nulls, only enforces uniqueness if provided
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ==========================================
// DATABASE INDEXES
// ==========================================

// 1. Prevent duplicate attendance for the same student on the same day.
// This is the ultimate database-level duplicate protection.
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// 2. Fast lookup for the Teacher Dashboard (fetching all attendance for a specific class on a specific date).
attendanceSchema.index({ class: 1, date: 1 });

// 3. Fast lookup for Admin global views.
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
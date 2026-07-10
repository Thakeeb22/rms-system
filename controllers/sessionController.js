const Session = require("../models/Session");
const mongoose = require("mongoose");
const createSession = async (req, res) => {
  try {
    const { sessionName } = req.body;
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: "Session name is required",
      });
    }
    const normalizedSession = sessionName.trim().toUpperCase();
    const existingSession = await Session.findOne({
      sessionName: normalizedSession,
    });
    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: "Session already existes.",
      });
    }
    const session = await Session.create({
      sessionName: normalizedSession,
    });
    return res.status(201).json({
      success: true,
      message: "Session created successfully.",
      session,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ sessionName: 1 });
    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Session ID.",
      });
    }
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Session ID.",
      });
    }
    const sessionData = await Session.findById(id);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }
    const { sessionName } = req.body;
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: "Session name required",
      });
    }
    const normalizedSessionName = sessionName.trim().toUpperCase();
    const existingSession = await Session.findOne({
      sessionName: normalizedSessionName,
      _id: { $ne: sessionData._id },
    });
    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: "Session already exists.",
      });
    }
    sessionData.sessionName = normalizedSessionName;
    await sessionData.save();
    return res.status(200).json({
      success: true,
      message: "Session updated successfully",
      session: sessionData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const setCurrentSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Session ID.",
      });
    }
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }
    // remove current flag from every session name
    await Session.updateMany(
      {},
      {
        isCurrent: false,
      },
    );
    // make selected session current
    session.isCurrent = true;
    await session.save();
    return res.status(200).json({
      success: true,
      message: "Current session updated successfully",
      session,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports = {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  setCurrentSession,
};

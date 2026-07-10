const Term = require("../models/Term");
const mongoose = require("mongoose");

const createTerm = async (req, res) => {
  try {
    const { termName } = req.body;
    if (!termName) {
      return res.status(400).json({
        success: false,
        message: "Term name is required",
      });
    }
    const normalizedTerm = termName.trim();
    const existingTerm = await Term.findOne({
      termName: normalizedTerm,
    });
    if (existingTerm) {
      return res.status(409).json({
        success: false,
        message: "Term already exists.",
      });
    }
    const term = await Term.create({
      termName: normalizedTerm,
    });
    return res.status(201).json({
      success: true,
      message: "Term created successfully.",
      term,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getAllTerms = async (req, res) => {
  try {
    const terms = await Term.find().sort({ termName: 1 });
    return res.status(200).json({
      success: true,
      count: terms.length,
      terms,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getTermById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Term ID.",
      });
    }
    const term = await Term.findById(id);
    if (!term) {
      return res.status(404).json({
        success: false,
        message: "Term not found",
      });
    }
    return res.status(200).json({
      success: true,
      term,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateTerm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Term ID.",
      });
    }
    const termData = await Term.findById(id);
    if (!termData) {
      return res.status(404).json({
        success: false,
        message: "Term not found.",
      });
    }
    const { termName } = req.body;
    if (!termName) {
      return res.status(400).json({
        success: false,
        message: "Term name required",
      });
    }
    const normalizedTermName = termName.trim();
    const existingTerm = await Term.findOne({
      termName: normalizedTermName,
      _id: { $ne: termData._id },
    });
    if (existingTerm) {
      return res.status(409).json({
        success: false,
        message: "Term already exists.",
      });
    }
    termData.termName = normalizedTermName;
    await termData.save();
    return res.status(200).json({
      success: true,
      message: "Term updated successfully",
      term: termData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const setCurrentTerm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "invalid Term ID.",
      });
    }
    const term = await Term.findById(id);
    if (!term) {
      return res.status(400).json({
        success: false,
        message: "Term not found",
      });
    }
    // remove current flag from every term name
    await Term.updateMany(
      {},
      {
        isCurrent: false,
      },
    );
    // make selected session current
    term.isCurrent = true;
    await term.save();
    return res.status(200).json({
      success: true,
      message: "Current term updated successfully",
      term,
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
  createTerm,
  getAllTerms,
  getTermById,
  updateTerm,
  setCurrentTerm,
};

const mongoose = require("mongoose");
const User = require("../models/User")
const Student = require("../models/Student")

const createStudent = async (req, res) => {
  try {
    const {
      addmissionNumber,
      fullname,
      guardianName,
      gender,
      dateOfBirth,
      guardianPhone,
      classs,
    } = req.body;
    if (
      !addmissionNumber ||
      !fullname ||
      guardianName ||
      gender ||
      dateOfBirth ||
      guardianPhone ||
      classs
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const getStudentById = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const updateStudent = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const deactivateStudent = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const activateStudent = async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deactivateStudent,
  activateStudent,
};

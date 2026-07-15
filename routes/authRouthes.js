const express = require("express")
const router = express.Router()
const {login} = require("../controllers/authController")
// login route
router.post("/login", login)
module.exports = router
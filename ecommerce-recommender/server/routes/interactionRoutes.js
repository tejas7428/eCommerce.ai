const express = require("express");
const {
  createInteraction,
  getUserActivity,
} = require("../controllers/interactionController");

const router = express.Router();

router.post("/", createInteraction);
router.get("/:userId", getUserActivity);

module.exports = router;

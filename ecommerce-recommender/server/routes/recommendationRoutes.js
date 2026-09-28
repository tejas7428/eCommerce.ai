const express = require("express");
const {
  recommendationsForUser,
  recommendationsForIdea,
} = require("../controllers/recommendationController");

const router = express.Router();

router.post("/idea", recommendationsForIdea);
router.get("/:userId", recommendationsForUser);

module.exports = router;

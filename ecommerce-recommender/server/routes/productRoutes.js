const express = require("express");
const {
  listProducts,
  getProduct,
  similarProducts,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", listProducts);
router.get("/:id/similar", similarProducts);
router.get("/:id", getProduct);

module.exports = router;

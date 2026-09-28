const Product = require("../models/Product");
const { getSimilarProducts } = require("../services/mlService");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hydrateRankedProducts(products, rankedItems) {
  const byId = new Map(products.map((product) => [product.productId, product.toObject()]));
  return rankedItems
    .map((item) => {
      const product = byId.get(item.productId);
      return product ? { ...product, ...item } : null;
    })
    .filter(Boolean);
}

async function listProducts(req, res, next) {
  try {
    const query = {};
    if (req.query.category && req.query.category !== "all") {
      query.category = req.query.category;
    }
    if (req.query.collection && req.query.collection !== "all") {
      query.collection = req.query.collection;
    }
    if (req.query.search) {
      const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
      query.$or = [{ name: search }, { brand: search }, { description: search }, { tags: search }, { useCases: search }];
    }
    const products = await Product.find(query).sort({ category: 1, name: 1 });
    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await Product.findOne({ productId: req.params.id });
    if (!product) {
      const error = new Error("Product not found.");
      error.status = 404;
      throw error;
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function similarProducts(req, res, next) {
  try {
    const product = await Product.findOne({ productId: req.params.id });
    if (!product) {
      const error = new Error("Product not found.");
      error.status = 404;
      throw error;
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 4, 1), 20);
    try {
      const result = await getSimilarProducts(product.productId, limit);
      const ids = result.recommendations.map((item) => item.productId);
      const products = await Product.find({ productId: { $in: ids } });
      res.json({
        recommendations: hydrateRankedProducts(products, result.recommendations),
      });
    } catch (mlError) {
      const fallback = await Product.find({
        category: product.category,
        productId: { $ne: product.productId },
      }).limit(limit);
      res.status(503).json({
        message: "Recommendation service is temporarily unavailable.",
        fallback: true,
        recommendations: fallback,
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = { listProducts, getProduct, similarProducts, hydrateRankedProducts };

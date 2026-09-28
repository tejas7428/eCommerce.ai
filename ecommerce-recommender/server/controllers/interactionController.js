const Interaction = require("../models/Interaction");
const Product = require("../models/Product");
const RecommendationLog = require("../models/RecommendationLog");

async function createInteraction(req, res, next) {
  try {
    const { userId, productId, type = "view" } = req.body;
    if (!userId || !productId) {
      const error = new Error("userId and productId are required.");
      error.status = 400;
      throw error;
    }
    if (!['view', 'click'].includes(type)) {
      const error = new Error("type must be either view or click.");
      error.status = 400;
      throw error;
    }
    const exists = await Product.exists({ productId });
    if (!exists) {
      const error = new Error("Cannot record an interaction for an unknown product.");
      error.status = 404;
      throw error;
    }

    const interaction = await Interaction.create({ userId, productId, type });
    res.status(201).json(interaction);
  } catch (error) {
    next(error);
  }
}

async function getUserActivity(req, res, next) {
  try {
    const interactions = await Interaction.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    const logs = await RecommendationLog.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    const ids = [
      ...new Set([
        ...interactions.map((item) => item.productId),
        ...logs.flatMap((log) => log.recommendedProductIds),
      ]),
    ];
    const products = await Product.find({ productId: { $in: ids } }).lean();
    const productMap = new Map(products.map((product) => [product.productId, product]));
    const hydratedInteractions = interactions.map((interaction) => ({
      ...interaction,
      product: productMap.get(interaction.productId) || null,
    }));

    const recommendationHistory = logs.map((log) => ({
      ...log,
      recommendations: log.recommendations.map((item) => ({
        ...item,
        product: productMap.get(item.productId) || null,
      })),
    }));

    res.json({ interactions: hydratedInteractions, recommendationHistory });
  } catch (error) {
    next(error);
  }
}

module.exports = { createInteraction, getUserActivity };

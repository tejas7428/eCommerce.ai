const Interaction = require("../models/Interaction");
const Product = require("../models/Product");
const RecommendationLog = require("../models/RecommendationLog");
const { getRecommendations, getIdeaRecommendations } = require("../services/mlService");
const { hydrateRankedProducts } = require("./productController");

function uniqueChronologicalIds(interactions) {
  const latestByProduct = new Map();
  for (const interaction of interactions) {
    latestByProduct.set(interaction.productId, interaction.timestamp);
  }
  return [...latestByProduct.entries()]
    .sort((a, b) => new Date(a[1]) - new Date(b[1]))
    .map(([productId]) => productId);
}

async function recommendationsForUser(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
    const interactions = await Interaction.find({
      userId: req.params.userId,
      type: "view",
    })
      .sort({ timestamp: -1 })
      .limit(30)
      .lean();
    const rawViewedIds = uniqueChronologicalIds(interactions);
    const validViewedIds = await Product.find({ productId: { $in: rawViewedIds } }).distinct("productId");
    const validSet = new Set(validViewedIds);
    const viewedProductIds = rawViewedIds.filter((id) => validSet.has(id));

    try {
      const result = await getRecommendations(viewedProductIds, limit);
      const ids = result.recommendations.map((item) => item.productId);
      const products = await Product.find({ productId: { $in: ids } });
      const recommendations = hydrateRankedProducts(products, result.recommendations);

      await RecommendationLog.create({
        userId: req.params.userId,
        recommendedProductIds: ids,
        basedOn: viewedProductIds,
        recommendations: result.recommendations,
      });

      res.json({
        recommendations,
        basedOn: viewedProductIds,
        coldStart: result.coldStart,
      });
    } catch (mlError) {
      const fallbackProducts = await Product.aggregate([
        { $match: { productId: { $nin: viewedProductIds } } },
        { $sample: { size: limit } },
      ]);
      res.status(503).json({
        message:
          "Recommendation service is temporarily unavailable. Showing a diverse fallback selection.",
        fallback: true,
        recommendations: fallbackProducts,
        basedOn: viewedProductIds,
      });
    }
  } catch (error) {
    next(error);
  }
}

async function recommendationsForIdea(req, res, next) {
  try {
    const idea = String(req.body.idea || "").trim();
    const limit = Math.min(Math.max(Number(req.body.limit) || 12, 1), 24);
    if (idea.length < 3) {
      const error = new Error("Describe your idea in at least 3 characters.");
      error.status = 400;
      throw error;
    }
    const result = await getIdeaRecommendations(idea, limit);
    const ids = result.recommendations.map((item) => item.productId);
    const products = await Product.find({ productId: { $in: ids } });
    res.json({
      idea,
      recommendations: hydrateRankedProducts(products, result.recommendations),
    });
  } catch (error) {
    if (error.response) {
      const serviceError = new Error("Idea recommendations are temporarily unavailable.");
      serviceError.status = 503;
      return next(serviceError);
    }
    next(error);
  }
}

module.exports = { recommendationsForUser, recommendationsForIdea };

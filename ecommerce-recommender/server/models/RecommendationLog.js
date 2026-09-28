const mongoose = require("mongoose");

const recommendationItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    score: { type: Number, required: true },
    becauseProductId: { type: String, default: null },
    becauseProductName: { type: String, default: null },
  },
  { _id: false }
);

const recommendationLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true, index: true },
    recommendedProductIds: { type: [String], required: true },
    basedOn: { type: [String], default: [] },
    recommendations: { type: [recommendationItemSchema], default: [] },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model("RecommendationLog", recommendationLogSchema);

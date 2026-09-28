const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true, index: true },
    productId: { type: String, required: true, trim: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["view", "click"],
      default: "view",
    },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

interactionSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Interaction", interactionSchema);

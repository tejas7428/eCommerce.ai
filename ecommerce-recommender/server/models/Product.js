const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    collection: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (tags) => tags.length >= 4 && tags.length <= 6,
        message: "A product must have between 4 and 6 tags.",
      },
    },
    useCases: { type: [String], default: [] },
    imageUrl: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
    suppressReservedKeysWarning: true,
  }
);

module.exports = mongoose.model("Product", productSchema);

const fs = require("node:fs/promises");
const path = require("node:path");

const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Product = require("../models/Product");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PRODUCTS_FILE = path.resolve(
  __dirname,
  "../../ml-service/data/products.json"
);

function validateProducts(products) {
  if (!Array.isArray(products) || products.length < 40 || products.length > 100) {
    throw new Error("products.json must contain between 40 and 100 products.");
  }

  const requiredFields = [
    "productId",
    "name",
    "brand",
    "category",
    "collection",
    "price",
    "description",
    "tags",
    "useCases",
    "imageUrl",
  ];
  const productIds = new Set();

  for (const product of products) {
    const missingFields = requiredFields.filter(
      (field) => product[field] === undefined || product[field] === null
    );

    if (missingFields.length > 0) {
      throw new Error(
        `${product.productId || "Unknown product"} is missing: ${missingFields.join(
          ", "
        )}.`
      );
    }

    if (productIds.has(product.productId)) {
      throw new Error(`Duplicate productId: ${product.productId}.`);
    }

    if (!Array.isArray(product.tags) || product.tags.length < 4 || product.tags.length > 6) {
      throw new Error(`${product.productId} must have between 4 and 6 tags.`);
    }

    productIds.add(product.productId);
  }
}

async function seedProducts() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Add it to server/.env before seeding.");
  }

  const rawProducts = await fs.readFile(PRODUCTS_FILE, "utf8");
  const products = JSON.parse(rawProducts);
  validateProducts(products);

  await mongoose.connect(process.env.MONGO_URI);

  const operations = products.map((product) => ({
    updateOne: {
      filter: { productId: product.productId },
      update: { $set: product },
      upsert: true,
    },
  }));

  const result = await Product.bulkWrite(operations);
  const seededIds = products.map((product) => product.productId);
  const staleResult = await Product.deleteMany({ productId: { $nin: seededIds } });

  console.log(
    `Seed complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated, ` +
      `${staleResult.deletedCount} stale products removed.`
  );
  console.log(`Products in catalog: ${await Product.countDocuments()}`);
}

seedProducts()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

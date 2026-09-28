const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productRoutes");
const interactionRoutes = require("./routes/interactionRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "express-api" });
});
app.use("/api/products", productRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

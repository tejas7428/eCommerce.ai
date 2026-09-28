const axios = require("axios");

const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000",
  timeout: 5000,
});

async function getRecommendations(viewedProductIds, limit = 8) {
  const { data } = await mlClient.post("/recommend", {
    viewedProductIds,
    limit,
  });
  return data;
}

async function getSimilarProducts(productId, limit = 4) {
  const { data } = await mlClient.get(`/similar/${encodeURIComponent(productId)}`, {
    params: { limit },
  });
  return data;
}

async function getIdeaRecommendations(idea, limit = 12) {
  const { data } = await mlClient.post("/recommend/idea", { idea, limit });
  return data;
}

module.exports = { getRecommendations, getSimilarProducts, getIdeaRecommendations };

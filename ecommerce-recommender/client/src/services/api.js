import axios from "axios";

import { getUserId } from "../utils/userId";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 8000,
});

export async function fetchProducts({ category = "all", collection = "all", search = "" } = {}) {
  const { data } = await api.get("/products", { params: { category, collection, search } });
  return data.products;
}

export async function fetchProduct(productId) {
  const { data } = await api.get(`/products/${productId}`);
  return data;
}

export async function fetchSimilar(productId, limit = 4) {
  try {
    const { data } = await api.get(`/products/${productId}/similar`, {
      params: { limit },
    });
    return data;
  } catch (error) {
    if (error.response?.data?.recommendations) return error.response.data;
    throw error;
  }
}

export async function recordInteraction(productId, type = "view") {
  const { data } = await api.post("/interactions", {
    userId: getUserId(),
    productId,
    type,
  });
  return data;
}

export async function fetchRecommendations(limit = 8) {
  try {
    const { data } = await api.get(`/recommendations/${getUserId()}`, {
      params: { limit },
    });
    return data;
  } catch (error) {
    if (error.response?.data?.recommendations) return error.response.data;
    throw error;
  }
}

export async function fetchIdeaRecommendations(idea, limit = 12) {
  const { data } = await api.post("/recommendations/idea", { idea, limit });
  return data;
}

export async function fetchActivity() {
  const { data } = await api.get(`/interactions/${getUserId()}`);
  return data;
}

export default api;

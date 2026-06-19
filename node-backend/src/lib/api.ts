"use client";
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use(config => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const shopId = localStorage.getItem("sa_shop_id");
    if (shopId) config.headers["x-selected-shop"] = shopId;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

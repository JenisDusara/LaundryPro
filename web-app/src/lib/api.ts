"use client";
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use(cfg => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("lp_token");
    if (token) cfg.headers["x-lp-token"] = token;
  }
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("lp:unauthorized"));
    }
    return Promise.reject(err);
  }
);

export default api;

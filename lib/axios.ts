import axios, { AxiosInstance } from "axios";

const apiRoot = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const api: AxiosInstance = axios.create({
  baseURL: apiRoot ? `${apiRoot}/api` : "/api",
  withCredentials: false,
  timeout: 120_000,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    const headers = config.headers as Record<string, unknown> & {
      set?: (key: string, value?: string) => void;
    };
    if (typeof headers.set === "function") {
      headers.set("Content-Type", undefined as unknown as string);
      headers.set("content-type", undefined as unknown as string);
    } else {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["X-Api-Token"] = token;
    }
  }

  return config;
});

export default api;

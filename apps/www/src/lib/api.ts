import axios, { AxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://poke-tcg-center.fly.dev";
export const API_URL = baseURL;
export const WS_URL = baseURL.replace(/^http/, "ws");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  validateStatus: (status) => {
    // Treat 2xx as success, allow 400/404 to pass through for application-level error toasts
    return status >= 200 && status < 500;
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const savedLocale = localStorage.getItem("tcg_locale") || "pt";
    config.headers["X-Locale"] = savedLocale;
    config.headers["Accept-Language"] = savedLocale === "en" ? "en-US,en;q=0.9" : "pt-BR,pt;q=0.9";
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/entrar")) {
      window.location.href = "/entrar";
    }
    return response;
  },
  (error: AxiosError<any>) => {
    console.error("[API Error]", error.response?.data || error.message);
    if (error.response?.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/entrar")) {
      window.location.href = "/entrar";
    }
    return Promise.reject(error);
  }
);

export const getApiImage = (url: string) => `${baseURL}${url}`;

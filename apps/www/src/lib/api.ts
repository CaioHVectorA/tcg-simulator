import axios, { AxiosError } from "axios";

import { resolveApiEndpoint } from "./api-endpoint";
const baseURL = resolveApiEndpoint(process.env.NEXT_PUBLIC_API_URL);
export const API_URL = baseURL;
export const WS_URL = baseURL.replace(/^http/, "ws");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15_000,
  validateStatus: (status) => {
    // Treat 2xx as success, allow 400/404 to pass through for application-level error toasts
    return status >= 200 && status < 500;
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const cookieLocale = document.cookie.match(/(?:^|;\s*)tcg_locale=(pt|en|es|jp)(?:;|$)/)?.[1];
    const savedLocale = cookieLocale || localStorage.getItem("tcg_locale") || "pt";
    config.headers["X-Locale"] = savedLocale;
    const languages: Record<string, string> = { pt: "pt-BR", en: "en-US", es: "es-ES", jp: "ja-JP" };
    config.headers["Accept-Language"] = languages[savedLocale] || "pt-BR";
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
    if (!axios.isCancel(error)) console.error("[API Error]", { status: error.response?.status, code: error.code });
    if (error.response?.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/entrar")) {
      window.location.href = "/entrar";
    }
    return Promise.reject(error);
  }
);

export const getApiImage = (url: string) => `${baseURL}${url}`;

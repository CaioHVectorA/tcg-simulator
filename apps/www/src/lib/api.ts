import axios, { AxiosError } from "axios";

const baseURL = "https://poke-tcg-center.fly.dev";
//const baseURL = "http://localhost:8080";
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

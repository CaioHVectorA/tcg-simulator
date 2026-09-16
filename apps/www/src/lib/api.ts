import axios, { AxiosError } from "axios";
import { redirect } from "next/navigation";
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const API_URL = baseURL;
export const WS_URL = baseURL.replace(/^http/, "ws");

export const api = axios.create({
  baseURL,
  validateStatus: (status) => {
    if (status === 401) {
      redirect("/entrar");
      return true;
    }
    if (status == 500) {
      redirect("/erro");
      return false;
    }
    return true;
  },
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log({ error: error });
    if (error.response.status === 401) {
      redirect("/entrar");
    }
    if ((error as AxiosError).message == "Network Error") {
      redirect("/erro");
    }
    return Promise.reject(error);
  }
);
export const getApiImage = (url: string) => `${baseURL}${url}`;

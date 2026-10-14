import { useEffect } from "react";
import { useApi } from "./use-api";

export const useFetch = (url: string) => {
  const { get, data, loading, error, setData } = useApi();
  useEffect(() => {
    // useApi owns error state; cleanup cancellation must also be consumed.
    void get(url).catch(() => {});
  }, [url, get]);
  return { data, loading, error, setData };
};

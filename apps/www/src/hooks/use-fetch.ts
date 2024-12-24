import { useEffect } from "react";
import { useApi } from "./use-api";

export const useFetch = (url: string) => {
  // const {  } = useApi
  const { get, data, loading, setData } = useApi();
  useEffect(() => {
    get(url);
  }, [url]);
  return { data, loading, setData };
};

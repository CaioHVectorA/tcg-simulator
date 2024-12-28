import { getCookie, setCookie } from "@/lib/cookies";
import { useEffect, useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const store = (token: string) => {
    setCookie("token", token, 1);
    setToken(token);
  };
  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      setToken(token);
      setError(false);
    } else {
      setError(true);
    }
    setLoading(false);
  }, []);

  return { token, loading, error, store };
}

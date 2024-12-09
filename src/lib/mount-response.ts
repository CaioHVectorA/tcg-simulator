type ResponseMountedOptions<T> = {
  ok: boolean;
  toast: string | null;
  data: T | null;
  error: string | null;
};

export const sucessResponse = <T>(
  data: T,
  toast?: string
): ResponseMountedOptions<T> => {
  return {
    ok: true,
    toast: toast || null,
    data,
    error: null,
  };
};

export const errorResponse = <T>(
  error: string,
  toast?: string
): ResponseMountedOptions<T> => {
  return {
    ok: false,
    toast: toast || null,
    data: null,
    error,
  };
};

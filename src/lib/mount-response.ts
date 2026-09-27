import { BackendLocale, translate } from "../i18n";

type ResponseMountedOptions<T> = {
  ok: boolean;
  toast: string | null;
  data: T | null;
  error: string | null;
};

export const sucessResponse = <T>(
  data: T,
  toast?: string,
  locale: BackendLocale = "en"
): ResponseMountedOptions<T> => {
  const resolvedToast = toast ? translate(toast, locale) : null;
  return {
    ok: true,
    toast: resolvedToast,
    data,
    error: null,
  };
};

export const errorResponse = <T>(
  error: string,
  toast?: string,
  locale: BackendLocale = "en"
): ResponseMountedOptions<T> => {
  const resolvedToast = toast ? translate(toast, locale) : null;
  const resolvedError = error ? translate(error, locale) : error;
  return {
    ok: false,
    toast: resolvedToast,
    data: null,
    error: resolvedError,
  };
};


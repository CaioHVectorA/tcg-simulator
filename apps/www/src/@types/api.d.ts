type Api<T> = {
    toast: string | null,
    data: T,
    error: string | null,
    ok: boolean,
}
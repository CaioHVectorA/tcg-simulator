import { app, startBackgroundJobs } from "./app";
if (process.env.NODE_ENV === "production" && (!process.env.CLIENT_URL || !process.env.DATABASE_URL)) {
  throw new Error("CLIENT_URL and DATABASE_URL are required in production");
}
if (process.env.DISABLE_BACKGROUND_JOBS !== "true") startBackgroundJobs();
export const server = app.listen({ port: Number(process.env.PORT || 8080), hostname: "0.0.0.0" });
console.log(JSON.stringify({ event: "server_started", port: Number(process.env.PORT || 8080) }));

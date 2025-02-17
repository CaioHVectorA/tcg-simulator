import { Elysia } from "elysia";

export const ws = new Elysia({}).ws("/ws", {
  open(ws) {
    console.log("Connection opened", ws.id);
  },
  message(ws, message) {
    console.log("Message received", message);
    ws.send("pong");
  },
  close(ws) {
    console.log("Connection closed", ws.id);
  },
});

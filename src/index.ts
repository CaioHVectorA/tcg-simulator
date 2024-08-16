import { html } from "@elysiajs/html";
import { compare } from 'bcrypt'
import { Elysia, t } from "elysia";
import { userController } from "./controller/user.controller";
import { packageController } from "./controller/package.controller";
const server = new Elysia({})
  .use(userController)  
  .use(packageController)
  .listen(3000);

console.log("Server running on http://localhost:3000");
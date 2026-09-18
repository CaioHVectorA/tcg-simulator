#!/usr/bin/env bun
/**
 * Concurrent Dev Runner for Pokémon TCG Simulator
 * Starts Backend (Elysia.js, port 8080) and Frontend (Next.js, port 3000)
 * with unified colored logging and graceful termination.
 */

import { spawn } from "bun";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

console.clear();
console.log(`
${BOLD}${GREEN}================================================================${RESET}
${BOLD}${GREEN}  🎴  Pokémon TCG Simulator — Ambiente Concorrente de Dev  🎴${RESET}
${BOLD}${GREEN}================================================================${RESET}
  ${CYAN}⚡ Backend API:${RESET}     http://localhost:8080
  ${CYAN}📖 Swagger Docs:${RESET}    http://localhost:8080/swagger
  ${MAGENTA}🌐 Frontend Web:${RESET}    http://localhost:3000
  ${YELLOW}⌨️  Pressione Ctrl+C para encerrar todos os processos.${RESET}
${BOLD}${GREEN}================================================================${RESET}
`);

function pipeWithPrefix(
  stream: ReadableStream<Uint8Array> | null,
  prefix: string
) {
  if (!stream) return;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim().length > 0) {
          console.log(`${prefix} ${line}`);
        }
      }
    }
  })().catch(() => {});
}

// 1. Inicia o Backend com Bun watch
const backendProcess = spawn({
  cmd: ["bun", "--watch", "src/index.ts"],
  stdout: "pipe",
  stderr: "pipe",
  env: { ...process.env, PORT: "8080" },
});

pipeWithPrefix(
  backendProcess.stdout,
  `${BOLD}${CYAN}[BACKEND :8080]${RESET}`
);
pipeWithPrefix(
  backendProcess.stderr,
  `${BOLD}${RED}[BACKEND :8080]${RESET}`
);

// 2. Inicia o Frontend com Next.js
const frontendProcess = spawn({
  cmd: ["bun", "dev"],
  cwd: "./apps/www",
  stdout: "pipe",
  stderr: "pipe",
  env: { ...process.env, PORT: "3000" },
});

pipeWithPrefix(
  frontendProcess.stdout,
  `${BOLD}${MAGENTA}[FRONTEND:3000]${RESET}`
);
pipeWithPrefix(
  frontendProcess.stderr,
  `${BOLD}${YELLOW}[FRONTEND:3000]${RESET}`
);

// Tratamento de encerramento seguro
function shutdown() {
  console.log(`\n${YELLOW}Encerrando processos de desenvolvimento...${RESET}`);
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

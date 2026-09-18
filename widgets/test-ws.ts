// chat-cli.ts
import WebSocket from "ws";
import readline from "readline";
import { WSEvent, type WSMessage } from "../src/lib/ws/types";
import { prisma } from "../src/helpers/prisma.client";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SERVER_URL = "ws://localhost:8080/ws";

const COMMANDS = {
  MESSAGE: "/msg",
  FRIEND: "/friend",
  TRADE: "/trade",
  HELP: "/help",
  EXIT: "/exit",
};

// Mover a definição de cores para um escopo mais amplo
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
};

async function main() {
  const userId = await new Promise<string>((resolve) => {
    rl.question("Digite seu ID de usuário: ", resolve);
  });

  // Verificar se o usuário existe no banco de dados
  const userExists = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!userExists) {
    console.log(
      `\n${colors.red}❌ Usuário com ID ${userId} não existe.${colors.reset}`
    );
    process.exit(1);
  }

  const ws = new WebSocket(`${SERVER_URL}?userId=${userId}`);
  setupClient(ws, userId);
}

function setupClient(ws: WebSocket, userId: string) {
  ws.on("open", () => {
    console.log(`\n${colors.green}✅ Conectado como ${userId}${colors.reset}`);
    console.log(`${colors.cyan}Comandos disponíveis:`);
    console.log(`  ${COMMANDS.MESSAGE} <destinatário> <mensagem>`);
    console.log(`  ${COMMANDS.FRIEND} <usuário>`);
    console.log(`  ${COMMANDS.TRADE} <destinatário> <item1,item2,...>`);
    console.log(`  ${COMMANDS.HELP} - Mostrar ajuda`);
    console.log(`  ${COMMANDS.EXIT} - Sair\n${colors.reset}`);
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString()) as WSMessage;

      // Debug: Mostrar mensagem bruta
      // console.log('Raw message:', message);

      if ("error" in message) {
        console.log(`\n${colors.red}❌ Erro: ${message.error}${colors.reset}`);
        return;
      }

      if ("status" in message) {
        console.log(
          `${colors.green}✓ Evento processado (${message.timestamp})${colors.reset}`
        );
        return;
      }

      // Formatar saída conforme o tipo de evento
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      switch (message.event) {
        case WSEvent.Message:
          console.log({ message });
          console.log(
            `\n${colors.yellow}📨 Mensagem de [${message.content.from}]:`
          );
          console.log(`   ${message.content.text}`);
          console.log(`   ${colors.cyan}[${timestamp}]${colors.reset}`);
          break;

        case WSEvent.FriendRequest:
          console.log(
            `\n${colors.yellow}🤝 Solicitação de amizade de [${message.content.from}]`
          );
          console.log(
            `   Digite: ${colors.cyan}/friend ${message.content.from}${colors.reset} para aceitar`
          );
          console.log(`   ${colors.cyan}[${timestamp}]${colors.reset}`);
          break;

        case WSEvent.TradeRequest:
          console.log(
            `\n${colors.yellow}🛒 Solicitação de troca de [${message.content.initiator}]`
          );
          console.log(
            `   Itens: ${colors.cyan}${message.content.items.join(", ")}${colors.reset}`
          );
          console.log(`   ${colors.cyan}[${timestamp}]${colors.reset}`);
          break;

        default:
          console.log(
            `\n${colors.red}⚠️ Evento desconhecido:`,
            message,
            colors.reset
          );
      }
    } catch (error) {
      console.log(
        `\n${colors.red}⚠️ Erro ao processar mensagem:`,
        data.toString(),
        colors.reset
      );
    }
  });

  ws.on("error", (error) => {
    console.log(
      `\n${colors.red}❌ Erro na conexão:`,
      error.message,
      colors.reset
    );
  });

  ws.on("close", () => {
    console.log(`\n${colors.cyan}🔌 Conexão encerrada${colors.reset}`);
    process.exit(0);
  });

  rl.on("line", (input) => {
    const [command, ...args] = input.trim().split(" ");

    if (command === COMMANDS.EXIT) {
      ws.close();
      rl.close();
      return;
    }

    try {
      switch (command) {
        case COMMANDS.MESSAGE:
          sendMessage(ws, args);
          break;

        case COMMANDS.FRIEND:
          sendFriendRequest(ws, userId, args);
          break;

        case COMMANDS.TRADE:
          sendTradeRequest(ws, userId, args);
          break;

        case COMMANDS.HELP:
          printHelp(colors);
          break;

        default:
          console.log(
            `${colors.red}Comando desconhecido. Digite ${COMMANDS.HELP} para ajuda${colors.reset}`
          );
      }
    } catch (error) {
      console.log(
        `${colors.red}Erro: ${(error as Error).message}${colors.reset}`
      );
    }
  });
}

// Funções auxiliares
function sendMessage(ws: WebSocket, args: string[]) {
  const [to, ...messageParts] = args;
  const text = messageParts.join(" ");

  if (!to || !text)
    throw new Error(
      `Formato inválido. Use: ${COMMANDS.MESSAGE} <destinatário> <mensagem>`
    );

  const payload: WSMessage = {
    event: WSEvent.Message,
    content: { to, text },
    timestamp: Date.now(),
  };

  ws.send(JSON.stringify(payload));
}

function sendFriendRequest(ws: WebSocket, userId: string, args: string[]) {
  const [target] = args;
  if (!target)
    throw new Error(`Formato inválido. Use: ${COMMANDS.FRIEND} <usuário>`);

  const payload: WSMessage = {
    event: WSEvent.FriendRequest,
    content: { to: target },
    timestamp: Date.now(),
  };

  ws.send(JSON.stringify(payload));
}

function sendTradeRequest(ws: WebSocket, userId: string, args: string[]) {
  const [recipient, items] = args;
  if (!recipient || !items)
    throw new Error(
      `Formato inválido. Use: ${COMMANDS.TRADE} <destinatário> <item1,item2,...>`
    );

  const payload: WSMessage = {
    event: WSEvent.TradeRequest,
    content: {
      recipient,
      items: items.split(","),
      initiator: userId,
    },
    timestamp: Date.now(),
  };

  ws.send(JSON.stringify(payload));
}

function printHelp(colors: any) {
  console.log(`
${colors.cyan}Modo de uso:
  Enviar mensagem:
    ${COMMANDS.MESSAGE} <destinatário> <mensagem>
    Exemplo: ${COMMANDS.MESSAGE} B Olá, vamos trocar itens?

  Solicitar amizade:
    ${COMMANDS.FRIEND} <usuário-alvo>
    Exemplo: ${COMMANDS.FRIEND} C

  Solicitar troca:
    ${COMMANDS.TRADE} <destinatário> <lista-de-itens>
    Exemplo: ${COMMANDS.TRADE} D espada,escudo,poção

  Sair:
    ${COMMANDS.EXIT}
${colors.reset}`);
}

main().catch(console.error);

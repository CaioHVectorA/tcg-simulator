// test-chat-cli.ts
import WebSocket from "ws";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Configurações
const SERVER_URL = "ws://localhost:8080/ws";

async function main() {
  // Solicitar ID do usuário
  const userId = await new Promise<string>((resolve) => {
    rl.question("Digite seu ID de usuário: ", resolve);
  });

  // Conectar ao WebSocket
  const ws = new WebSocket(`${SERVER_URL}?userId=${userId}`);

  // Configurar handlers
  setupWebSocket(ws, userId);
  setupInputHandler(ws, userId);
}

function setupWebSocket(ws: WebSocket, userId: string) {
  // Evento de conexão aberta
  ws.on("open", () => {
    console.log(`\n✅ Conectado como ${userId}`);
    console.log('Digite mensagens no formato: "destinatario mensagem"');
    console.log('Exemplo: "B Olá! Como vai?"\n');
  });

  // Receber mensagens
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.error) {
        console.log(`\n❌ Erro: ${message.error}`);
      } else if (message.status === "sent") {
        console.log(
          `\n✓ Mensagem enviada (${new Date(message.timestamp).toLocaleTimeString()})`
        );
      } else {
        console.log(`\n📩 Nova mensagem de ${message.from}:`);
        console.log(`   ${message.message}`);
        console.log(
          `   [${new Date(message.timestamp).toLocaleTimeString()}]\n`
        );
      }
    } catch (error) {
      console.log("\n⚠️ Mensagem inválida recebida:", data.toString());
    }
  });

  // Erros e desconexões
  ws.on("error", (error) => {
    console.log("\n❌ Erro na conexão:", error.message);
  });

  ws.on("close", () => {
    console.log("\n🔌 Conexão fechada");
    process.exit(0);
  });
}

function setupInputHandler(ws: WebSocket, userId: string) {
  rl.on("line", async (input) => {
    if (!input.trim()) return;

    // Parse da mensagem
    const [to, ...messageParts] = input.trim().split(" ");
    const message = messageParts.join(" ");
    console.log({ input, to, message });

    if (!to || !message) {
      console.log('Formato inválido. Use: "destinatario mensagem"');
      return;
    }

    // Enviar mensagem via WebSocket
    const payload = JSON.stringify({ to, message });
    ws.send(payload);
  });

  // Fechar conexão ao sair
  rl.on("close", () => {
    ws.close();
  });
}

// Iniciar aplicação
main().catch(console.error);

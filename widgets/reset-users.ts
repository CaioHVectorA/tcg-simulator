import { prisma } from "../src/helpers/prisma.client";

async function main() {
  console.log("🧹 Iniciando processo seguro de limpeza do banco de dados...");

  // 1. Contagem antes
  const [
    userCount,
    cardsUserCount,
    packagesUserCount,
    tradeCount,
    messagesCount,
    notificationsCount,
    questUserCount,
    totalCardsCatalog,
    totalPackagesCatalog,
    totalQuestsCatalog,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.cards_user.count(),
    prisma.packages_User.count(),
    prisma.trade.count(),
    prisma.messages.count(),
    prisma.notifications.count(),
    prisma.questUser.count(),
    prisma.card.count(),
    prisma.package.count(),
    prisma.quest.count(),
  ]);

  console.log("📊 Estatísticas antes do reset:");
  console.log(`   - Usuários cadastrados: ${userCount}`);
  console.log(`   - Cartas de usuários: ${cardsUserCount}`);
  console.log(`   - Pacotes de usuários: ${packagesUserCount}`);
  console.log(`   - Trocas ativas/passadas: ${tradeCount}`);
  console.log(`   - Mensagens de chat: ${messagesCount}`);
  console.log(`   - Notificações: ${notificationsCount}`);
  console.log(`   - Progresso de missões: ${questUserCount}`);
  console.log(`   ✅ Catálogo de cartas a preservar: ${totalCardsCatalog}`);
  console.log(`   ✅ Catálogo de pacotes a preservar: ${totalPackagesCatalog}`);
  console.log(`   ✅ Catálogo mestre de missões a preservar: ${totalQuestsCatalog}`);

  console.log("\n🗑️ Deletando dados de usuários e transações...");

  // Excluir entidades de trocas
  await prisma.trade_offer_cards.deleteMany();
  await prisma.trade_offers.deleteMany();
  await prisma.trade_requests.deleteMany();
  await prisma.trade_Card.deleteMany();
  await prisma.user_Trade.deleteMany();
  await prisma.trade.deleteMany();

  // Excluir interações sociais e mensagens
  await prisma.messages.deleteMany();
  await prisma.money_donate.deleteMany();
  await prisma.notifications.deleteMany();
  await prisma.friend_User.deleteMany();

  // Excluir missões e recompensas
  await prisma.questUser.deleteMany();
  await prisma.userLevelReward.deleteMany();

  // Excluir compras, transações e afiliações
  await prisma.user_Purchase.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.referred.deleteMany();
  await prisma.referrerProtocol.deleteMany();

  // Excluir inventários, coleções e marcações
  await prisma.packages_User.deleteMany();
  await prisma.cards_user.deleteMany();
  await prisma.favoriteCard.deleteMany();
  await prisma.tradeMarkedCard.deleteMany();

  // Excluir rankings
  await prisma.user_Ranking.deleteMany();

  // Excluir usuários
  const deletedUsers = await prisma.user.deleteMany();
  console.log(`✨ Sucesso: ${deletedUsers.count} usuários removidos.`);

  // Validação final
  const [
    finalUserCount,
    finalCardsCatalog,
    finalPackagesCatalog,
    finalQuestsCatalog,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.card.count(),
    prisma.package.count(),
    prisma.quest.count(),
  ]);

  console.log("\n📋 Relatório pós-reset:");
  console.log(`   - Usuários restantes: ${finalUserCount} (deve ser 0)`);
  console.log(`   - Cartas no catálogo: ${finalCardsCatalog} (inalterado)`);
  console.log(`   - Pacotes no catálogo: ${finalPackagesCatalog} (inalterado)`);
  console.log(`   - Missões no catálogo: ${finalQuestsCatalog} (inalterado)`);

  if (finalUserCount === 0 && finalCardsCatalog > 0 && finalPackagesCatalog > 0) {
    console.log("\n🎉 Banco de dados limpo e pronto para deploy de produção!");
  } else {
    console.warn("\n⚠️ Atenção: Verifique os números acima.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro ao resetar banco:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

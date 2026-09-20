import { prisma } from "../../src/helpers/prisma.client";

async function run() {
  console.log("=== Configurando os 12 Pacotes da Loja com Linha Premium (50k+) ===");

  const curatedPackages = [
    // --- LINHA CLÁSSICA E TEMÁTICA (2.5k a 42k) ---
    {
      name: "Pacote de Iniciação",
      price: 2500,
      cards_quantity: 5,
      common_rarity: 0.55,
      rare_rarity: 0.30,
      epic_rarity: 0.12,
      legendary_rarity: 0.028,
      full_legendary_rarity: 0.002,
      description: "Pacote de entrada com Pokémon clássicos para novos treinadores.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv01/pack.webp"
    },
    {
      name: "Pacote Raro Kanto",
      price: 5000,
      cards_quantity: 5,
      common_rarity: 0.40,
      rare_rarity: 0.38,
      epic_rarity: 0.17,
      legendary_rarity: 0.045,
      full_legendary_rarity: 0.005,
      description: "Monstros clássicos da região de Kanto com garantia de cartas raras.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv03.5/pack.webp"
    },
    {
      name: "151 — Coleção Clássica",
      price: 8500,
      cards_quantity: 5,
      common_rarity: 0.35,
      rare_rarity: 0.38,
      epic_rarity: 0.20,
      legendary_rarity: 0.06,
      full_legendary_rarity: 0.01,
      description: "A aclamada coleção dos 151 Pokémon originais.",
      tcg_id: "sv03.5",
      image_url: "https://assets.tcgdex.net/pt/sv/sv03.5/pack.webp"
    },
    {
      name: "Céus em Evolução",
      price: 14000,
      cards_quantity: 5,
      common_rarity: 0.30,
      rare_rarity: 0.35,
      epic_rarity: 0.24,
      legendary_rarity: 0.09,
      full_legendary_rarity: 0.02,
      description: "Lar dos maiores dragões como Rayquaza e as lendárias Eeveelutions.",
      tcg_id: "swsh7",
      image_url: "https://assets.tcgdex.net/pt/swsh/swsh7/pack.webp"
    },
    {
      name: "Destinos de Paldea",
      price: 20000,
      cards_quantity: 5,
      common_rarity: 0.25,
      rare_rarity: 0.35,
      epic_rarity: 0.26,
      legendary_rarity: 0.11,
      full_legendary_rarity: 0.03,
      description: "Brilho e mistério com Pokémon Shiny e formas Terastal.",
      tcg_id: "sv04.5",
      image_url: "https://assets.tcgdex.net/pt/sv/sv04.5/pack.webp"
    },
    {
      name: "Astros Cintilantes",
      price: 28000,
      cards_quantity: 5,
      common_rarity: 0.22,
      rare_rarity: 0.32,
      epic_rarity: 0.28,
      legendary_rarity: 0.14,
      full_legendary_rarity: 0.04,
      description: "O poder cósmico de Arceus VSTAR e Charizard.",
      tcg_id: "swsh9",
      image_url: "https://assets.tcgdex.net/pt/swsh/swsh9/pack.webp"
    },
    {
      name: "Realeza Absoluta",
      price: 35000,
      cards_quantity: 5,
      common_rarity: 0.18,
      rare_rarity: 0.30,
      epic_rarity: 0.32,
      legendary_rarity: 0.15,
      full_legendary_rarity: 0.05,
      description: "Galeria de ilustrações soberbas da era Espada e Escudo.",
      tcg_id: "swsh12.5",
      image_url: "https://assets.tcgdex.net/pt/swsh/swsh12.5/pack.webp"
    },
    {
      name: "Pacote Tempestade Elemental",
      price: 42000,
      cards_quantity: 5,
      common_rarity: 0.15,
      rare_rarity: 0.28,
      epic_rarity: 0.36,
      legendary_rarity: 0.15,
      full_legendary_rarity: 0.06,
      description: "Forças da natureza em choque com alta taxa de Pokémon elementais raros.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv07/pack.webp"
    },

    // --- LINHA PREMIUM (50k a 100k) ---
    {
      name: "Linha Premium — Vórtice Sombrio",
      price: 50000,
      cards_quantity: 6,
      common_rarity: 0.10,
      rare_rarity: 0.25,
      epic_rarity: 0.40,
      legendary_rarity: 0.18,
      full_legendary_rarity: 0.07,
      description: "★ LINHA PREMIUM ★ Densas energias sombrias com chances maciças de cartas Épicas e Místicas.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv03/pack.webp"
    },
    {
      name: "Linha Premium — Mítico Celestial",
      price: 65000,
      cards_quantity: 6,
      common_rarity: 0.06,
      rare_rarity: 0.20,
      epic_rarity: 0.42,
      legendary_rarity: 0.22,
      full_legendary_rarity: 0.10,
      description: "★ LINHA PREMIUM ★ Alta probabilidade de cartas Místicas de 7 dígitos e Pokémon raríssimos.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv05/pack.webp"
    },
    {
      name: "Linha Premium — Campeões da Liga",
      price: 80000,
      cards_quantity: 6,
      common_rarity: 0.04,
      rare_rarity: 0.16,
      epic_rarity: 0.45,
      legendary_rarity: 0.25,
      full_legendary_rarity: 0.10,
      description: "★ LINHA PREMIUM ★ Focado nos titãs V, VMAX e ex dos maiores mestres de cada região.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv06/pack.webp"
    },
    {
      name: "Linha Premium — Lendário Supremo (God Pull)",
      price: 100000,
      cards_quantity: 7,
      common_rarity: 0.01,
      rare_rarity: 0.09,
      epic_rarity: 0.40,
      legendary_rarity: 0.35,
      full_legendary_rarity: 0.15,
      description: "★ TOPO DA LINHA PREMIUM ★ O ápice do colecionismo. Máxima probabilidade de God Pulls e cartas Lendárias.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/cel25/pack.webp"
    },
  ];

  for (const pkg of curatedPackages) {
    const existing = await prisma.package.findFirst({
      where: { name: pkg.name }
    });

    if (existing) {
      await prisma.package.update({
        where: { id: existing.id },
        data: pkg
      });
      console.log(`✓ Atualizado: ${pkg.name} (${pkg.price.toLocaleString("pt-BR")} moedas)`);
    } else {
      const created = await prisma.package.create({
        data: pkg
      });
      console.log(`+ Criado: ${pkg.name} (${pkg.price.toLocaleString("pt-BR")} moedas, ID ${created.id})`);
    }
  }

  console.log("=== 12 Pacotes Calibrados com Sucesso! ===");
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

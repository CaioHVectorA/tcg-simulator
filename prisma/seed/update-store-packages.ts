import { prisma } from "../../src/helpers/prisma.client";

async function run() {
  console.log("=== Configurando os 12 Pacotes da Loja com Linha Premium (50k+) ===");

  const curatedPackages = [
    // --- LINHA CLÁSSICA E TEMÁTICA (2.5k a 42k) ---
    {
      name: "Pacote de Iniciação",
      price: 2500,
      cards_quantity: 5,
      common_rarity: 0.701785,
      rare_rarity: 0.28,
      epic_rarity: 0.018,
      legendary_rarity: 0.0002,
      full_legendary_rarity: 0.000015,
      description: "Pacote de entrada com Pokémon clássicos para novos treinadores.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv01/pack.webp"
    },
    {
      name: "Pacote Raro Kanto",
      price: 5000,
      cards_quantity: 5,
      common_rarity: 0.61457,
      rare_rarity: 0.35,
      epic_rarity: 0.035,
      legendary_rarity: 0.0004,
      full_legendary_rarity: 0.00003,
      description: "Monstros clássicos da região de Kanto com garantia de cartas raras.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv03.5/pack.webp"
    },
    {
      name: "151 — Coleção Clássica",
      price: 8500,
      cards_quantity: 5,
      common_rarity: 0.55915,
      rare_rarity: 0.38,
      epic_rarity: 0.06,
      legendary_rarity: 0.0008,
      full_legendary_rarity: 0.00005,
      description: "A aclamada coleção dos 151 Pokémon originais.",
      tcg_id: "sv03.5",
      image_url: "https://assets.tcgdex.net/pt/sv/sv03.5/pack.webp"
    },
    {
      name: "Céus em Evolução",
      price: 14000,
      cards_quantity: 5,
      common_rarity: 0.49852,
      rare_rarity: 0.40,
      epic_rarity: 0.10,
      legendary_rarity: 0.0014,
      full_legendary_rarity: 0.00008,
      description: "Lar dos maiores dragões como Rayquaza e as lendárias Eeveelutions.",
      tcg_id: "swsh7",
      image_url: "https://assets.tcgdex.net/pt/swsh/swsh7/pack.webp"
    },
    {
      name: "Destinos de Paldea",
      price: 20000,
      cards_quantity: 5,
      common_rarity: 0.43768,
      rare_rarity: 0.42,
      epic_rarity: 0.14,
      legendary_rarity: 0.0022,
      full_legendary_rarity: 0.00012,
      description: "Brilho e mistério com Pokémon Shiny e formas Terastal.",
      tcg_id: "sv04.5",
      image_url: "https://assets.tcgdex.net/pt/sv/sv04.5/pack.webp"
    },
    {
      name: "Astros Cintilantes",
      price: 28000,
      cards_quantity: 5,
      common_rarity: 0.37664,
      rare_rarity: 0.44,
      epic_rarity: 0.18,
      legendary_rarity: 0.0032,
      full_legendary_rarity: 0.00016,
      description: "O poder cósmico de Arceus VSTAR e Charizard.",
      tcg_id: "swsh9",
      image_url: "https://assets.tcgdex.net/pt/swsh/swsh9/pack.webp"
    },
    {
      name: "Realeza Absoluta",
      price: 35000,
      cards_quantity: 5,
      common_rarity: 0.3256,
      rare_rarity: 0.45,
      epic_rarity: 0.22,
      legendary_rarity: 0.0042,
      full_legendary_rarity: 0.0002,
      description: "Galeria de ilustrações soberbas da era Espada e Escudo.",
      tcg_id: "swsh12.5",
      image_url: "https://assets.tcgdex.net/pt/swsh/swsh12.5/pack.webp"
    },
    {
      name: "Pacote Tempestade Elemental",
      price: 42000,
      cards_quantity: 5,
      common_rarity: 0.28475,
      rare_rarity: 0.45,
      epic_rarity: 0.26,
      legendary_rarity: 0.005,
      full_legendary_rarity: 0.00025,
      description: "Forças da natureza em choque com alta taxa de Pokémon elementais raros.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv07/pack.webp"
    },

    // --- LINHA PREMIUM (50k a 100k) ---
    {
      name: "Linha Premium — Vórtice Sombrio",
      price: 50000,
      cards_quantity: 6,
      common_rarity: 0.25392,
      rare_rarity: 0.46,
      epic_rarity: 0.28,
      legendary_rarity: 0.0058,
      full_legendary_rarity: 0.00028,
      description: "★ LINHA PREMIUM ★ Densas energias sombrias com chances maciças de cartas Épicas e Místicas.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv03/pack.webp"
    },
    {
      name: "Linha Premium — Mítico Celestial",
      price: 65000,
      cards_quantity: 6,
      common_rarity: 0.21265,
      rare_rarity: 0.46,
      epic_rarity: 0.32,
      legendary_rarity: 0.007,
      full_legendary_rarity: 0.00035,
      description: "★ LINHA PREMIUM ★ Alta probabilidade de cartas Místicas de 7 dígitos e Pokémon raríssimos.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv05/pack.webp"
    },
    {
      name: "Linha Premium — Campeões da Liga",
      price: 80000,
      cards_quantity: 6,
      common_rarity: 0.17108,
      rare_rarity: 0.46,
      epic_rarity: 0.36,
      legendary_rarity: 0.0085,
      full_legendary_rarity: 0.00042,
      description: "★ LINHA PREMIUM ★ Focado nos titãs V, VMAX e ex dos maiores mestres de cada região.",
      tcg_id: null,
      image_url: "https://assets.tcgdex.net/pt/sv/sv06/pack.webp"
    },
    {
      name: "Linha Premium — Lendário Supremo (God Pull)",
      price: 100000,
      cards_quantity: 7,
      common_rarity: 0.149,
      rare_rarity: 0.46,
      epic_rarity: 0.38,
      legendary_rarity: 0.0105,
      full_legendary_rarity: 0.0005,
      description: "★ TOPO DA LINHA PREMIUM ★ O ápice do colecionismo. Máxima probabilidade de God Pulls (10M) e cartas Lendárias.",
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

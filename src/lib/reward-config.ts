export const DAILY_ROAD_REWARDS = [
  { day: 1, coins: 500, packName: null, isMilestone: false, title: "Boas-vindas à Trilha" },
  { day: 2, coins: 750, packName: null, isMilestone: false, title: "Moedas de Bônus" },
  { day: 3, coins: 1100, packName: "Pacote simples", isMilestone: false, title: "🎁 Booster Simples + 1.1k" },
  { day: 4, coins: 1500, packName: null, isMilestone: false, title: "Moedas de Treino" },
  { day: 5, coins: 2000, packName: null, isMilestone: false, title: "Baú de Moedas" },
  { day: 6, coins: 2800, packName: null, isMilestone: false, title: "Reserva de Batalha" },
  { day: 7, coins: 4500, packName: "Pacote simples", isMilestone: true, title: "🎁 Marco 1: Booster Simples + 4.5k" },
  { day: 8, coins: 3800, packName: null, isMilestone: false, title: "Moedas da Jornada" },
  { day: 9, coins: 4600, packName: null, isMilestone: false, title: "Bolsa Recheada" },
  { day: 10, coins: 5600, packName: "Pacote simples", isMilestone: false, title: "📦 Booster Simples + 5.6k" },
  { day: 11, coins: 6800, packName: null, isMilestone: false, title: "Moedas de Treinador" },
  { day: 12, coins: 8200, packName: null, isMilestone: false, title: "Cofre Avançado" },
  { day: 13, coins: 9800, packName: null, isMilestone: false, title: "Tesouro do Desafio" },
  { day: 14, coins: 12000, packName: "Pacote raro", isMilestone: true, title: "💎 Marco 2: Booster Raro + 12k" },
  { day: 15, coins: 11000, packName: null, isMilestone: false, title: "Moedas da Glória" },
  { day: 16, coins: 13000, packName: null, isMilestone: false, title: "Crescimento Exponencial" },
  { day: 17, coins: 15500, packName: "Pacote raro", isMilestone: false, title: "💎 Booster Raro + 15.5k" },
  { day: 18, coins: 18000, packName: null, isMilestone: false, title: "Saco Pesado de Ouro" },
  { day: 19, coins: 21000, packName: null, isMilestone: false, title: "Fortuna de Batalha" },
  { day: 20, coins: 24500, packName: null, isMilestone: false, title: "Cofre Imperial" },
  { day: 21, coins: 28000, packName: "Grande pacote", isMilestone: true, title: "🔥 Marco 3: Grande Pacote + 28k" },
  { day: 22, coins: 27000, packName: null, isMilestone: false, title: "Moedas de Elite" },
  { day: 23, coins: 30000, packName: null, isMilestone: false, title: "Riqueza Suprema" },
  { day: 24, coins: 34000, packName: "Grande pacote", isMilestone: false, title: "🔥 Grande Pacote + 34k" },
  { day: 25, coins: 38000, packName: null, isMilestone: false, title: "Tesouro Mestre" },
  { day: 26, coins: 42000, packName: "Pacote épicos", isMilestone: false, title: "👑 Booster Épico + 42k" },
  { day: 27, coins: 46000, packName: null, isMilestone: false, title: "Véspera do Panteão" },
  { day: 28, coins: 50000, packName: "Pacote épicos", isMilestone: true, title: "👑 Marco 4: Booster Épico + 50k" },
  { day: 29, coins: 55000, packName: "Pacote lendário", isMilestone: false, title: "⚡ Booster Místico + 55k" },
  { day: 30, coins: 65000, packName: "Pacote lendário", isMilestone: true, isGrandFinale: true, title: "🌟 GRANDE FINAL: Booster Místico + 65k Ouro!" },
];

export interface LevelMilestone {
  level: number;
  xpRequired: number;
  coins: number;
  packName: string | null;
  title: string;
  badge: string;
  description: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 2, xpRequired: 100, coins: 2000, packName: null, title: "Treinador Novato", badge: "🌱", description: "Primeiros passos no mundo TCG (+2.000 moedas)" },
  { level: 3, xpRequired: 400, coins: 3000, packName: "Pacote simples", title: "Colecionador Iniciante", badge: "📦", description: "1x Pacote Simples + 3.000 moedas" },
  { level: 4, xpRequired: 900, coins: 5000, packName: null, title: "Entusiasta de Batalha", badge: "⚡", description: "Bônus de 5.000 moedas" },
  { level: 5, xpRequired: 1600, coins: 10000, packName: "Pacote raro", title: "Guardião da Rocha", badge: "🪨", description: "1x Pacote Raro + 10.000 moedas" },
  { level: 6, xpRequired: 2500, coins: 15000, packName: null, title: "Estrategista TCG", badge: "🧠", description: "Bônus de 15.000 moedas" },
  { level: 7, xpRequired: 3600, coins: 25000, packName: "Grande pacote", title: "Caçador de Raridades", badge: "🎒", description: "1x Grande Pacote (16 cartas) + 25k" },
  { level: 8, xpRequired: 4900, coins: 35000, packName: null, title: "Veterano dos Duelos", badge: "⚔️", description: "Bônus de 35.000 moedas" },
  { level: 9, xpRequired: 6400, coins: 50000, packName: "Pacote Tempestade Elemental", title: "Mestre dos Elementos", badge: "🌪️", description: "1x Tempestade Elemental + 50k" },
  { level: 10, xpRequired: 8100, coins: 100000, packName: "Pacote épicos", title: "Campeão de Cascata", badge: "💧", description: "1x Pacote Épico + 100.000 moedas" },
  { level: 12, xpRequired: 12100, coins: 150000, packName: "Grande pacote épico", title: "Especialista em Holofoil", badge: "✨", description: "1x Grande Pacote Épico (24 cartas) + 150k" },
  { level: 15, xpRequired: 19600, coins: 250000, packName: "Pacote Vórtice Sombrio", title: "Dominador das Sombras", badge: "🔮", description: "1x Vórtice Sombrio + 250k" },
  { level: 20, xpRequired: 36100, coins: 500000, packName: "Pacote lendário", title: "Mestre Pokémon", badge: "🏆", description: "1x Pacote Lendário Garantido + 500k" },
  { level: 25, xpRequired: 57600, coins: 1000000, packName: "Pacote Mítico Celestial", title: "Milionário dos Cards", badge: "💎", description: "1.000.000 de Moedas (7 Dígitos!) + Mítico Celestial" },
  { level: 30, xpRequired: 84100, coins: 2500000, packName: "Pacote Mítico Celestial", title: "Lenda Viva", badge: "👑", description: "2.500.000 Moedas + Pacote Mítico Celestial" },
  { level: 40, xpRequired: 152100, coins: 5000000, packName: "Pacote Mítico Celestial", title: "Soberano dos Cards", badge: "🌌", description: "5.000.000 Moedas + Pacote Mítico Celestial" },
  { level: 50, xpRequired: 240100, coins: 10000000, packName: "Pacote Mítico Celestial", title: "Divindade TCG", badge: "☀️", description: "10.000.000 Moedas (8 Dígitos!) + Título Máximo" },
];


const GET_INITIALS = `SELECT COUNT(*) AS progress, COUNT(*) > $GOAL AS mission_completed FROM cards_user cu INNER JOIN cards c ON cu."cardId" = c.id WHERE cu."userId" = $USER_ID AND (c.name ILIKE '%Bulbasaur%' OR c.name ILIKE '%Ivysaur%' OR c.name ILIKE '%Venusaur%' OR c.name ILIKE '%Charmander%' OR c.name ILIKE '%Charmeleon%' OR c.name ILIKE '%Charizard%' OR c.name ILIKE '%Squirtle%' OR c.name ILIKE '%Wartortle%' OR c.name ILIKE '%Blastoise%' OR c.name ILIKE '%Chikorita%' OR c.name ILIKE '%Bayleef%' OR c.name ILIKE '%Meganium%' OR c.name ILIKE '%Cyndaquil%' OR c.name ILIKE '%Quilava%' OR c.name ILIKE '%Typhlosion%' OR c.name ILIKE '%Totodile%' OR c.name ILIKE '%Croconaw%' OR c.name ILIKE '%Feraligatr%' OR c.name ILIKE '%Treecko%' OR c.name ILIKE '%Grovyle%' OR c.name ILIKE '%Sceptile%' OR c.name ILIKE '%Torchic%' OR c.name ILIKE '%Combusken%' OR c.name ILIKE '%Blaziken%' OR c.name ILIKE '%Mudkip%' OR c.name ILIKE '%Marshtomp%' OR c.name ILIKE '%Swampert%' OR c.name ILIKE '%Turtwig%' OR c.name ILIKE '%Grotle%' OR c.name ILIKE '%Torterra%' OR c.name ILIKE '%Chimchar%' OR c.name ILIKE '%Monferno%' OR c.name ILIKE '%Infernape%' OR c.name ILIKE '%Piplup%' OR c.name ILIKE '%Prinplup%' OR c.name ILIKE '%Empoleon%' OR c.name ILIKE '%Snivy%' OR c.name ILIKE '%Servine%' OR c.name ILIKE '%Serperior%' OR c.name ILIKE '%Tepig%' OR c.name ILIKE '%Pignite%' OR c.name ILIKE '%Emboar%' OR c.name ILIKE '%Oshawott%' OR c.name ILIKE '%Dewott%' OR c.name ILIKE '%Samurott%' OR c.name ILIKE '%Chespin%' OR c.name ILIKE '%Quilladin%' OR c.name ILIKE '%Chestnaught%' OR c.name ILIKE '%Fennekin%' OR c.name ILIKE '%Braixen%' OR c.name ILIKE '%Delphox%' OR c.name ILIKE '%Froakie%' OR c.name ILIKE '%Frogadier%' OR c.name ILIKE '%Greninja%' OR c.name ILIKE '%Rowlet%' OR c.name ILIKE '%Dartrix%' OR c.name ILIKE '%Decidueye%' OR c.name ILIKE '%Litten%' OR c.name ILIKE '%Torracat%' OR c.name ILIKE '%Incineroar%' OR c.name ILIKE '%Popplio%' OR c.name ILIKE '%Brionne%' OR c.name ILIKE '%Primarina%' OR c.name ILIKE '%Grookey%' OR c.name ILIKE '%Thwackey%' OR c.name ILIKE '%Rillaboom%' OR c.name ILIKE '%Scorbunny%' OR c.name ILIKE '%Raboot%' OR c.name ILIKE '%Cinderace%' OR c.name ILIKE '%Sobble%' OR c.name ILIKE '%Drizzile%' OR c.name ILIKE '%Inteleon%');`;

const GET_LEGENDARIES = `SELECT COUNT(*) AS progress, COUNT(*) > $GOAL AS mission_completed FROM cards_user cu INNER JOIN cards c ON cu."cardId" = c.id WHERE cu."userId" = $USER_ID AND (c.name ILIKE '%Articuno%' OR c.name ILIKE '%Zapdos%' OR c.name ILIKE '%Moltres%' OR c.name ILIKE '%Mewtwo%' OR c.name ILIKE '%Raikou%' OR c.name ILIKE '%Entei%' OR c.name ILIKE '%Suicune%' OR c.name ILIKE '%Lugia%' OR c.name ILIKE '%Ho-oh%' OR c.name ILIKE '%Celebi%' OR c.name ILIKE '%Regirock%' OR c.name ILIKE '%Regice%' OR c.name ILIKE '%Registeel%' OR c.name ILIKE '%Latios%' OR c.name ILIKE '%Latias%' OR c.name ILIKE '%Kyogre%' OR c.name ILIKE '%Groudon%' OR c.name ILIKE '%Rayquaza%' OR c.name ILIKE '%Dialga%' OR c.name ILIKE '%Palkia%' OR c.name ILIKE '%Heatran%' OR c.name ILIKE '%Regigigas%' OR c.name ILIKE '%Giratina%' OR c.name ILIKE '%Cresselia%' OR c.name ILIKE '%Mesprit%' OR c.name ILIKE '%Azelf%' OR c.name ILIKE '%Uxie%' OR c.name ILIKE '%Cobalion%' OR c.name ILIKE '%Terrakion%' OR c.name ILIKE '%Virizion%' OR c.name ILIKE '%Keldeo%' OR c.name ILIKE '%Tornadus%' OR c.name ILIKE '%Thundurus%' OR c.name ILIKE '%Landorus%' OR c.name ILIKE '%Zekrom%' OR c.name ILIKE '%Reshiram%' OR c.name ILIKE '%Kyurem%' OR c.name ILIKE '%Xerneas%' OR c.name ILIKE '%Yveltal%' OR c.name ILIKE '%Zygarde%' OR c.name ILIKE '%Solgaleo%' OR c.name ILIKE '%Lunala%' OR c.name ILIKE '%Necrozma%' OR c.name ILIKE '%Zarude%' OR c.name ILIKE '%Calyrex%' OR c.name ILIKE '%Wyrdeer%' OR c.name ILIKE '%Kleavor%' OR c.name ILIKE '%Ursaluna%' OR c.name ILIKE '%Basculegion%' OR c.name ILIKE '%Sneasler%' OR c.name ILIKE '%Overqwil%' OR c.name ILIKE '%Enamorus%');`;

const GET_N_CARDS = `SELECT count(id) >= $GOAL as mission_complete, count(id) as progress from cards_user WHERE cards_user."userId" = $USER_ID`;

const MAKE_QUESTS = `SELECT count(*) AS progress, count(*) >= $GOAL AS mission_complete from quest_user QU WHERE QU."user_id" = $USER_ID AND QU.completed = true`;

const GET_DUPLICATES = `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM (SELECT "cardId" FROM cards_user WHERE "userId" = $USER_ID GROUP BY "cardId" HAVING COUNT(*) > 1) AS duplicates;`;

const OPEN_NON_TEMATIC_PACKAGES = `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM packages_user PU INNER JOIN packages P ON PU."packageId" = P.id WHERE PU."userId" = $USER_ID AND PU.opened = true AND P.tcg_id IS NULL;`;

const OPEN_TEMATIC_PACKAGES = `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM packages_user PU INNER JOIN packages P ON PU."packageId" = P.id WHERE PU."userId" = $USER_ID AND PU.opened = true AND P.tcg_id IS NOT NULL;`;

const GET_N_CARDS_WITH_MORE_THAN_X_HP = (hp: number) =>
  `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND C.hp > ${hp};`;

const GET_N_CARDS_WITH_LESS_THAN_X_HP = (hp: number) =>
  `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND C.hp < ${hp};`;

const GET_CARDS_FROM_X_TYPE = (type: string) =>
  `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND C.type = '${type}';`;

export const QUESTS = {
  GET_INITIALS,
  GET_LEGENDARIES,
  GET_N_CARDS,
  MAKE_QUESTS,
  GET_DUPLICATES,
  OPEN_NON_TEMATIC_PACKAGES,
  OPEN_TEMATIC_PACKAGES,
  GET_N_CARDS_WITH_MORE_THAN_X_HP: GET_N_CARDS_WITH_MORE_THAN_X_HP(150),
  GET_N_CARDS_WITH_LESS_THAN_X_HP: GET_N_CARDS_WITH_LESS_THAN_X_HP(70),
  GET_FIRE_CARDS: GET_CARDS_FROM_X_TYPE("FIRE"),
  GET_WATER_CARDS: GET_CARDS_FROM_X_TYPE("WATER"),
  GET_GRASS_CARDS: GET_CARDS_FROM_X_TYPE("GRASS"),
  GET_FAIRY_CARDS: GET_CARDS_FROM_X_TYPE("FAIRY"),
  GET_DRAGON_CARDS: GET_CARDS_FROM_X_TYPE("DRAGON"),
};

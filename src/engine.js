/**
 * Engine de corrida do Mario Kart.
 *
 * Regras base:
 *  - N rodadas por corrida (padrão 5).
 *  - A cada rodada sorteia-se um bloco: RETA, CURVA ou CONFRONTO.
 *  - RETA  -> dado(1-6) + VELOCIDADE. Quem vencer ganha 1 ponto.
 *  - CURVA -> dado(1-6) + MANOBRABILIDADE. Quem vencer ganha 1 ponto.
 *  - CONFRONTO -> dado(1-6) + PODER. Quem perder, perde pontos.
 *  - Ninguém pode ter pontuação negativa.
 *
 * Mecânicas extras:
 *  - No CONFRONTO, o item é sorteado:
 *      CASCO  -> o perdedor perde 1 ponto.
 *      BOMBA  -> o perdedor perde 2 pontos.
 *  - O vencedor do confronto ainda pode pegar um TURBO (+1 ponto) de forma aleatória.
 *
 * Aleatoriedade injetável:
 *  - Todas as funções que sorteiam recebem uma função `rng` (padrão `Math.random`),
 *    o que torna a engine 100% testável de forma determinística.
 *  - O log é injetável via `logger` (padrão `console.log`), permitindo rodar
 *    corridas silenciosas (ex.: em testes ou simulações em lote).
 */

const DEFAULT_ROUNDS = 5;
const DICE_SIDES = 6;

const BLOCKS = {
  RETA: { label: "RETA", attr: "VELOCIDADE", attrLabel: "velocidade", emoji: "🛣️" },
  CURVA: { label: "CURVA", attr: "MANOBRABILIDADE", attrLabel: "manobrabilidade", emoji: "🌀" },
  CONFRONTO: { label: "CONFRONTO", attr: "PODER", attrLabel: "poder", emoji: "🥊" },
};

const ITEMS = {
  CASCO: { nome: "CASCO", emoji: "🐢", penalidade: 1 },
  BOMBA: { nome: "BOMBA", emoji: "💣", penalidade: 2 },
};

const noop = () => {};

/** Rola um dado de 6 lados (1 a 6). */
function rollDice(rng = Math.random) {
  return Math.floor(rng() * DICE_SIDES) + 1;
}

/** Sorteia um bloco de pista com probabilidades iguais. */
function getRandomBlock(rng = Math.random) {
  const random = rng();
  if (random < 1 / 3) return BLOCKS.RETA;
  if (random < 2 / 3) return BLOCKS.CURVA;
  return BLOCKS.CONFRONTO;
}

/** Sorteia o item usado no confronto. */
function getRandomItem(rng = Math.random) {
  return rng() < 0.5 ? ITEMS.CASCO : ITEMS.BOMBA;
}

/** Garante que a pontuação nunca fique negativa. */
function clampScore(character) {
  if (character.PONTOS < 0) character.PONTOS = 0;
}

/** Aplica penalidade ao perdedor respeitando o piso de 0 pontos. */
function applyPenalty(loser, penalty) {
  loser.PONTOS -= penalty;
  clampScore(loser);
}

function logRoll(log, character, block, diceResult) {
  const attr = character[block.attr];
  log(
    `${character.EMOJI} ${character.NOME} 🎲 rolou ${diceResult} + ${block.attrLabel}(${attr}) = ${diceResult + attr}`
  );
}

/** Resolve um bloco de RETA ou CURVA (quem somar mais ganha 1 ponto). */
function resolveSkillBlock(c1, c2, block, d1, d2, log) {
  const total1 = d1 + c1[block.attr];
  const total2 = d2 + c2[block.attr];

  logRoll(log, c1, block, d1);
  logRoll(log, c2, block, d2);

  if (total1 > total2) {
    c1.PONTOS++;
    log(`✅ ${c1.NOME} marcou um ponto!`);
  } else if (total2 > total1) {
    c2.PONTOS++;
    log(`✅ ${c2.NOME} marcou um ponto!`);
  } else {
    log("🤝 Empate na rodada! Ninguém pontua.");
  }
}

/** Resolve um bloco de CONFRONTO, aplicando item + possível turbo. */
function resolveConfrontBlock(c1, c2, block, d1, d2, log, rng) {
  const power1 = d1 + c1.PODER;
  const power2 = d2 + c2.PODER;

  log(`${c1.NOME} confrontou com ${c2.NOME}! ${block.emoji}`);
  logRoll(log, c1, block, d1);
  logRoll(log, c2, block, d2);

  if (power1 === power2) {
    log("🤝 Confronto empatado! Nenhum ponto foi perdido.");
    return;
  }

  const winner = power1 > power2 ? c1 : c2;
  const loser = power1 > power2 ? c2 : c1;

  const item = getRandomItem(rng);
  applyPenalty(loser, item.penalidade);
  log(
    `${item.emoji} ${winner.NOME} acertou um ${item.nome} em ${loser.NOME}! ${loser.NOME} perdeu ${item.penalidade} ponto(s).`
  );

  // Turbo aleatório para o vencedor do confronto.
  if (rng() < 0.5) {
    winner.PONTOS++;
    log(`🚀 ${winner.NOME} pegou um TURBO e ganhou 1 ponto!`);
  }
}

/**
 * Executa a corrida completa entre dois personagens.
 * @param {object} c1 personagem 1 (será mutado: PONTOS)
 * @param {object} c2 personagem 2 (será mutado: PONTOS)
 * @param {object} [options]
 * @param {number} [options.rounds=5] número de rodadas
 * @param {Function} [options.rng=Math.random] fonte de aleatoriedade
 * @param {Function} [options.logger=console.log] destino dos logs
 */
async function playRaceEngine(c1, c2, options = {}) {
  const { rounds = DEFAULT_ROUNDS, rng = Math.random, logger = console.log } = options;
  const log = logger;

  for (let round = 1; round <= rounds; round++) {
    log(`\n🏁 Rodada ${round}`);

    const block = getRandomBlock(rng);
    log(`${block.emoji} Bloco: ${block.label}`);

    const d1 = rollDice(rng);
    const d2 = rollDice(rng);

    if (block.label === "CONFRONTO") {
      resolveConfrontBlock(c1, c2, block, d1, d2, log, rng);
    } else {
      resolveSkillBlock(c1, c2, block, d1, d2, log);
    }

    log(`📊 Placar: ${c1.NOME} ${c1.PONTOS} x ${c2.PONTOS} ${c2.NOME}`);
    log("-----------------------------");
  }
}

/**
 * Determina o resultado da corrida sem imprimir nada.
 * @returns {{winner: object|null, draw: boolean}}
 */
function getResult(c1, c2) {
  if (c1.PONTOS > c2.PONTOS) return { winner: c1, draw: false };
  if (c2.PONTOS > c1.PONTOS) return { winner: c2, draw: false };
  return { winner: null, draw: true };
}

/** Declara o vencedor da corrida. */
async function declareWinner(c1, c2, logger = console.log) {
  const log = logger;
  log("\n🏆 Resultado final:");
  log(`${c1.EMOJI} ${c1.NOME}: ${c1.PONTOS} ponto(s)`);
  log(`${c2.EMOJI} ${c2.NOME}: ${c2.PONTOS} ponto(s)\n`);

  const { winner, draw } = getResult(c1, c2);
  if (draw) {
    log("A corrida terminou em empate! 🤝");
  } else {
    log(`${winner.NOME} venceu a corrida! Parabéns! 🎉`);
  }
  return { winner, draw };
}

module.exports = {
  DEFAULT_ROUNDS,
  DICE_SIDES,
  BLOCKS,
  ITEMS,
  noop,
  rollDice,
  getRandomBlock,
  getRandomItem,
  applyPenalty,
  resolveSkillBlock,
  resolveConfrontBlock,
  playRaceEngine,
  getResult,
  declareWinner,
};

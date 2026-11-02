/**
 * Camada de interação com o usuário via terminal.
 * Usa o módulo nativo `readline/promises` do Node.js (Node 17+) para
 * permitir que o jogador escolha os dois personagens e o número de rodadas.
 *
 * Caso o terminal não seja interativo (ex.: execução em CI ou
 * pipe de entrada), um fallback sorteia dois personagens distintos.
 */

const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const { ROSTER, createCharacter } = require("./characters");

const DEFAULT_ROUNDS = 5;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 20;

function printRoster() {
  console.log("\n🎮 Escolha os personagens da corrida:\n");
  ROSTER.forEach((c, i) => {
    console.log(
      `  ${i + 1}) ${c.EMOJI} ${c.NOME.padEnd(12)} ` +
        `VEL ${c.VELOCIDADE} | MAN ${c.MANOBRABILIDADE} | POD ${c.PODER}`
    );
  });
  console.log("");
}

/** Sorteia dois índices distintos do roster (fallback não-interativo). */
function randomPair() {
  const first = Math.floor(Math.random() * ROSTER.length);
  let second = Math.floor(Math.random() * ROSTER.length);
  while (second === first) {
    second = Math.floor(Math.random() * ROSTER.length);
  }
  return [first, second];
}

/** Lê uma escolha válida (1..ROSTER.length) diferente de `exclude`. */
async function askChoice(rl, label, exclude = -1) {
  while (true) {
    const answer = await rl.question(`${label} (1-${ROSTER.length}): `);
    const index = Number.parseInt(answer, 10) - 1;

    if (Number.isNaN(index) || index < 0 || index >= ROSTER.length) {
      console.log("⚠️  Opção inválida, tente novamente.");
      continue;
    }
    if (index === exclude) {
      console.log("⚠️  Esse personagem já foi escolhido, selecione outro.");
      continue;
    }
    return index;
  }
}

/** Lê o número de rodadas (Enter aceita o padrão). */
async function askRounds(rl) {
  while (true) {
    const answer = await rl.question(
      `Número de rodadas [${MIN_ROUNDS}-${MAX_ROUNDS}, padrão ${DEFAULT_ROUNDS}]: `
    );
    if (answer.trim() === "") return DEFAULT_ROUNDS;

    const rounds = Number.parseInt(answer, 10);
    if (Number.isNaN(rounds) || rounds < MIN_ROUNDS || rounds > MAX_ROUNDS) {
      console.log(`⚠️  Informe um número entre ${MIN_ROUNDS} e ${MAX_ROUNDS}.`);
      continue;
    }
    return rounds;
  }
}

/**
 * Coleta a configuração da corrida junto ao usuário.
 * @returns {Promise<{players: [object, object], rounds: number}>}
 */
async function setupRace() {
  if (!input.isTTY) {
    const [i, j] = randomPair();
    console.log(
      `🤖 Terminal não interativo: sorteando ${ROSTER[i].NOME} x ${ROSTER[j].NOME}`
    );
    return {
      players: [createCharacter(ROSTER[i]), createCharacter(ROSTER[j])],
      rounds: DEFAULT_ROUNDS,
    };
  }

  printRoster();
  const rl = readline.createInterface({ input, output });
  try {
    const p1 = await askChoice(rl, "Jogador 1");
    const p2 = await askChoice(rl, "Jogador 2", p1);
    const rounds = await askRounds(rl);
    return {
      players: [createCharacter(ROSTER[p1]), createCharacter(ROSTER[p2])],
      rounds,
    };
  } finally {
    rl.close();
  }
}

module.exports = { setupRace, DEFAULT_ROUNDS, MIN_ROUNDS, MAX_ROUNDS };

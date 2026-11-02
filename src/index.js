/**
 * 🏁 Simulador de Corridas do Mario Kart — ponto de entrada.
 *
 * Fluxo:
 *  1. O jogador escolhe dois personagens e o número de rodadas
 *     (ou tudo é sorteado/padrão em terminal não-interativo).
 *  2. A engine roda as rodadas com blocos aleatórios (RETA, CURVA, CONFRONTO).
 *  3. O vencedor é declarado ao final.
 *
 * Execução:
 *   npm start
 *   node src/index.js --rounds=10   (define o número de rodadas via CLI)
 */

const { setupRace, MIN_ROUNDS, MAX_ROUNDS } = require("./prompt");
const { playRaceEngine, declareWinner } = require("./engine");

/** Lê --rounds=N dos argumentos de linha de comando, se presente e válido. */
function parseRoundsArg(argv) {
  const arg = argv.find((a) => a.startsWith("--rounds="));
  if (!arg) return null;

  const value = Number.parseInt(arg.split("=")[1], 10);
  if (Number.isNaN(value) || value < MIN_ROUNDS || value > MAX_ROUNDS) {
    console.log(
      `⚠️  --rounds inválido (use ${MIN_ROUNDS}-${MAX_ROUNDS}). Ignorando.`
    );
    return null;
  }
  return value;
}

async function main() {
  console.log("=======================================");
  console.log("🏎️  SIMULADOR DE CORRIDAS - MARIO KART");
  console.log("=======================================");

  const { players, rounds } = await setupRace();
  const [player1, player2] = players;

  // CLI sobrepõe o número de rodadas definido no prompt.
  const finalRounds = parseRoundsArg(process.argv.slice(2)) ?? rounds;

  console.log(
    `\n🚨 Corrida de ${finalRounds} rodada(s) entre ` +
      `${player1.EMOJI} ${player1.NOME} e ${player2.EMOJI} ${player2.NOME} começando...`
  );

  await playRaceEngine(player1, player2, { rounds: finalRounds });
  await declareWinner(player1, player2);
}

main().catch((err) => {
  console.error("❌ Erro ao executar a corrida:", err);
  process.exit(1);
});

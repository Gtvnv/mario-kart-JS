/**
 * Testes da engine usando o runner nativo do Node.js (node:test).
 * A aleatoriedade é injetada via `rng`, deixando os resultados determinísticos.
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  BLOCKS,
  ITEMS,
  rollDice,
  getRandomBlock,
  getRandomItem,
  applyPenalty,
  resolveSkillBlock,
  resolveConfrontBlock,
  getResult,
  playRaceEngine,
  noop,
} = require("../src/engine");

const { ROSTER, createCharacter } = require("../src/characters");

/** Cria um rng que devolve, em sequência, os valores fornecidos. */
function seq(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

function mario() {
  return createCharacter(ROSTER.find((c) => c.NOME === "Mario"));
}
function luigi() {
  return createCharacter(ROSTER.find((c) => c.NOME === "Luigi"));
}

test("rollDice sempre retorna entre 1 e 6", () => {
  assert.equal(rollDice(() => 0), 1);
  assert.equal(rollDice(() => 0.999), 6);
});

test("getRandomBlock mapeia as faixas corretas", () => {
  assert.equal(getRandomBlock(() => 0).label, "RETA");
  assert.equal(getRandomBlock(() => 0.5).label, "CURVA");
  assert.equal(getRandomBlock(() => 0.9).label, "CONFRONTO");
});

test("getRandomItem alterna entre casco e bomba", () => {
  assert.equal(getRandomItem(() => 0.2).nome, "CASCO");
  assert.equal(getRandomItem(() => 0.8).nome, "BOMBA");
});

test("applyPenalty nunca deixa a pontuação negativa", () => {
  const c = mario();
  c.PONTOS = 1;
  applyPenalty(c, 2);
  assert.equal(c.PONTOS, 0);
});

test("RETA: quem soma mais ganha 1 ponto", () => {
  const c1 = mario(); // VELOCIDADE 4
  const c2 = luigi(); // VELOCIDADE 3
  resolveSkillBlock(c1, c2, BLOCKS.RETA, 6, 1, noop); // 10 vs 4
  assert.equal(c1.PONTOS, 1);
  assert.equal(c2.PONTOS, 0);
});

test("CONFRONTO: perdedor leva bomba (-2) e vencedor pega turbo (+1)", () => {
  const c1 = mario(); // PODER 3
  const c2 = luigi(); // PODER 4
  c2.PONTOS = 3;
  // rng: primeiro getRandomItem (>=0.5 -> BOMBA), depois turbo (<0.5 -> ganha)
  const rng = seq([0.9, 0.1]);
  // Mario rola 6 (=9), Luigi rola 1 (=5) -> Mario vence
  resolveConfrontBlock(c1, c2, BLOCKS.CONFRONTO, 6, 1, noop, rng);
  assert.equal(c2.PONTOS, 1, "Luigi perde 2 (3 -> 1)");
  assert.equal(c1.PONTOS, 1, "Mario ganha turbo");
});

test("CONFRONTO empatado não altera pontos", () => {
  const c1 = mario();
  const c2 = luigi();
  c1.PONTOS = 2;
  c2.PONTOS = 2;
  // Mario PODER 3 + 4 = 7 ; Luigi PODER 4 + 3 = 7 -> empate
  resolveConfrontBlock(c1, c2, BLOCKS.CONFRONTO, 4, 3, noop, () => 0.9);
  assert.equal(c1.PONTOS, 2);
  assert.equal(c2.PONTOS, 2);
});

test("getResult identifica vencedor e empate", () => {
  const c1 = mario();
  const c2 = luigi();
  c1.PONTOS = 3;
  c2.PONTOS = 1;
  assert.equal(getResult(c1, c2).winner.NOME, "Mario");
  assert.equal(getResult(c1, c2).draw, false);

  c2.PONTOS = 3;
  assert.equal(getResult(c1, c2).draw, true);
  assert.equal(getResult(c1, c2).winner, null);
});

test("playRaceEngine roda o número de rodadas pedido sem lançar erro", async () => {
  const c1 = mario();
  const c2 = luigi();
  await playRaceEngine(c1, c2, { rounds: 10, rng: seq([0.1, 0.5, 0.9]), logger: noop });
  assert.ok(c1.PONTOS >= 0 && c2.PONTOS >= 0, "pontuações não-negativas");
});

test("ITEMS e BLOCKS expõem os valores esperados", () => {
  assert.equal(ITEMS.CASCO.penalidade, 1);
  assert.equal(ITEMS.BOMBA.penalidade, 2);
  assert.equal(Object.keys(BLOCKS).length, 3);
});

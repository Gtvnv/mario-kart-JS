/**
 * Roster de personagens disponíveis para a corrida.
 * Cada personagem tem os três atributos usados pela engine:
 *  - VELOCIDADE: usado nos blocos de RETA
 *  - MANOBRABILIDADE: usado nos blocos de CURVA
 *  - PODER: usado nos blocos de CONFRONTO
 *
 * Função util `createCharacter` garante que cada corrida comece
 * com uma CÓPIA do personagem (PONTOS zerado), evitando que os
 * atributos originais do roster sejam mutados entre partidas.
 */

const ROSTER = [
  { NOME: "Mario", VELOCIDADE: 4, MANOBRABILIDADE: 3, PODER: 3, EMOJI: "🔴" },
  { NOME: "Peach", VELOCIDADE: 3, MANOBRABILIDADE: 4, PODER: 2, EMOJI: "👑" },
  { NOME: "Yoshi", VELOCIDADE: 2, MANOBRABILIDADE: 4, PODER: 3, EMOJI: "🦖" },
  { NOME: "Bowser", VELOCIDADE: 5, MANOBRABILIDADE: 2, PODER: 5, EMOJI: "🐲" },
  { NOME: "Luigi", VELOCIDADE: 3, MANOBRABILIDADE: 4, PODER: 4, EMOJI: "🟢" },
  { NOME: "Donkey Kong", VELOCIDADE: 2, MANOBRABILIDADE: 2, PODER: 5, EMOJI: "🦍" },
];

/**
 * Cria uma instância "jogável" de um personagem do roster.
 * @param {object} base personagem do ROSTER
 * @returns {object} cópia com PONTOS = 0
 */
function createCharacter(base) {
  return { ...base, PONTOS: 0 };
}

module.exports = { ROSTER, createCharacter };

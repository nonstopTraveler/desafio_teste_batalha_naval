const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

const {
  TAMANHO,
  NAVIOS,
  criarTabuleiro,
  posicaoValida,
  calcularPosicoes,
  posicionarNavio,
  posicionarAleatorio,
  todosAfundados,
  atirar,
  nomeCasa,
  novoJogo,
  jogarTiro,
} = require('./batalha-naval.js');

// ---------- Ajudas para os testes ----------

// Gerador de números "aleatórios" previsível (sempre devolve valores entre 0 e 1).
function criarAleatorio(semente) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function contarOcupadas(tabuleiro) {
  return tabuleiro.celulas.flat().filter((c) => c !== null).length;
}

// Tabuleiro com os 4 navios em posições conhecidas, cada um em uma linha:
// Porta-aviões linha 0 (colunas 0-4), Encouraçado linha 2 (0-3),
// Submarino linha 4 (0-2), Destroier linha 6 (0-1).
function tabuleiroPronto() {
  const t = criarTabuleiro();
  posicionarNavio(t, 'Porta-aviões', 0, 0, 'horizontal');
  posicionarNavio(t, 'Encouraçado', 2, 0, 'horizontal');
  posicionarNavio(t, 'Submarino', 4, 0, 'horizontal');
  posicionarNavio(t, 'Destroier', 6, 0, 'horizontal');
  return t;
}

// ---------- Regras básicas ----------

describe('Constantes do jogo', () => {
  test('o tabuleiro tem tamanho 10', () => {
    assert.equal(TAMANHO, 10);
  });

  test('existem 4 tipos de navio', () => {
    assert.equal(NAVIOS.length, 4);
  });

  test('os tamanhos são 5, 4, 3 e 2', () => {
    assert.deepEqual(NAVIOS.map((n) => n.tamanho), [5, 4, 3, 2]);
  });

  test('cada navio tem o nome certo', () => {
    assert.deepEqual(
      NAVIOS.map((n) => n.nome),
      ['Porta-aviões', 'Encouraçado', 'Submarino', 'Destroier']
    );
  });

  test('os navios ocupam 14 casas no total', () => {
    assert.equal(NAVIOS.reduce((total, n) => total + n.tamanho, 0), 14);
  });
});

describe('Criação do tabuleiro 10 x 10', () => {
  test('tem 10 linhas', () => {
    assert.equal(criarTabuleiro().celulas.length, 10);
  });

  test('cada linha tem 10 colunas', () => {
    assert.ok(criarTabuleiro().celulas.every((linha) => linha.length === 10));
  });

  test('tem 100 casas', () => {
    assert.equal(criarTabuleiro().celulas.flat().length, 100);
  });

  test('começa sem nenhum navio', () => {
    const t = criarTabuleiro();
    assert.equal(contarOcupadas(t), 0);
    assert.equal(t.navios.length, 0);
  });

  test('começa sem nenhum tiro', () => {
    const t = criarTabuleiro();
    assert.equal(t.tiros.length, 10);
    assert.ok(t.tiros.flat().every((tiro) => tiro === null));
  });

  test('dois tabuleiros são independentes', () => {
    const a = criarTabuleiro();
    const b = criarTabuleiro();
    posicionarNavio(a, 'Destroier', 0, 0, 'horizontal');
    assert.equal(contarOcupadas(b), 0);
  });
});

describe('posicaoValida', () => {
  test('aceita as quatro pontas do tabuleiro', () => {
    assert.equal(posicaoValida(0, 0), true);
    assert.equal(posicaoValida(0, 9), true);
    assert.equal(posicaoValida(9, 0), true);
    assert.equal(posicaoValida(9, 9), true);
  });

  test('recusa números fora de 0 a 9', () => {
    assert.equal(posicaoValida(-1, 0), false);
    assert.equal(posicaoValida(0, -1), false);
    assert.equal(posicaoValida(10, 0), false);
    assert.equal(posicaoValida(0, 10), false);
  });

  test('recusa números que não são inteiros', () => {
    assert.equal(posicaoValida(1.5, 2), false);
    assert.equal(posicaoValida(NaN, 2), false);
    assert.equal(posicaoValida(Infinity, 2), false);
  });

  test('recusa valores que não são número', () => {
    assert.equal(posicaoValida('3', 4), false);
    assert.equal(posicaoValida(null, 4), false);
    assert.equal(posicaoValida(undefined, undefined), false);
  });
});

// ---------- Posicionamento ----------

describe('calcularPosicoes', () => {
  test('navio horizontal ocupa casas na mesma linha', () => {
    assert.deepEqual(calcularPosicoes('Destroier', 3, 4, 'horizontal'), [[3, 4], [3, 5]]);
  });

  test('navio vertical ocupa casas na mesma coluna', () => {
    assert.deepEqual(calcularPosicoes('Submarino', 1, 2, 'vertical'), [[1, 2], [2, 2], [3, 2]]);
  });

  test('cada navio ocupa a quantidade certa de casas', () => {
    NAVIOS.forEach((navio) => {
      assert.equal(calcularPosicoes(navio.nome, 0, 0, 'horizontal').length, navio.tamanho);
      assert.equal(calcularPosicoes(navio.nome, 0, 0, 'vertical').length, navio.tamanho);
    });
  });

  test('o porta-aviões cabe encostado na borda direita (colunas 5 a 9)', () => {
    const posicoes = calcularPosicoes('Porta-aviões', 0, 5, 'horizontal');
    assert.deepEqual(posicoes[4], [0, 9]);
  });

  test('o porta-aviões não cabe se passar da borda direita (coluna 6)', () => {
    assert.equal(calcularPosicoes('Porta-aviões', 0, 6, 'horizontal'), null);
  });

  test('o porta-aviões cabe encostado na borda de baixo (linhas 5 a 9)', () => {
    const posicoes = calcularPosicoes('Porta-aviões', 5, 0, 'vertical');
    assert.deepEqual(posicoes[4], [9, 0]);
  });

  test('o porta-aviões não cabe se passar da borda de baixo (linha 6)', () => {
    assert.equal(calcularPosicoes('Porta-aviões', 6, 0, 'vertical'), null);
  });

  test('o destroier cabe na última casa possível (linha 8 vertical e coluna 8 horizontal)', () => {
    assert.notEqual(calcularPosicoes('Destroier', 8, 9, 'vertical'), null);
    assert.notEqual(calcularPosicoes('Destroier', 9, 8, 'horizontal'), null);
  });

  test('o destroier não cabe começando na última casa', () => {
    assert.equal(calcularPosicoes('Destroier', 9, 9, 'horizontal'), null);
    assert.equal(calcularPosicoes('Destroier', 9, 9, 'vertical'), null);
  });

  test('recusa navio inexistente', () => {
    assert.equal(calcularPosicoes('Jangada', 0, 0, 'horizontal'), null);
    assert.equal(calcularPosicoes(undefined, 0, 0, 'horizontal'), null);
  });

  test('recusa orientação inválida', () => {
    assert.equal(calcularPosicoes('Destroier', 0, 0, 'diagonal'), null);
    assert.equal(calcularPosicoes('Destroier', 0, 0, undefined), null);
  });

  test('recusa início fora do tabuleiro', () => {
    assert.equal(calcularPosicoes('Destroier', -1, 0, 'horizontal'), null);
    assert.equal(calcularPosicoes('Destroier', 0, 10, 'vertical'), null);
    assert.equal(calcularPosicoes('Destroier', '0', 0, 'vertical'), null);
  });
});

describe('posicionarNavio', () => {
  test('posiciona cada navio e marca a quantidade certa de casas', () => {
    NAVIOS.forEach((navio) => {
      const t = criarTabuleiro();
      const r = posicionarNavio(t, navio.nome, 0, 0, 'horizontal');
      assert.equal(r.ok, true);
      assert.equal(contarOcupadas(t), navio.tamanho);
    });
  });

  test('as casas ficam marcadas com o nome do navio', () => {
    const t = criarTabuleiro();
    posicionarNavio(t, 'Submarino', 2, 3, 'vertical');
    assert.equal(t.celulas[2][3], 'Submarino');
    assert.equal(t.celulas[3][3], 'Submarino');
    assert.equal(t.celulas[4][3], 'Submarino');
    assert.equal(t.celulas[5][3], null);
  });

  test('aceita navio no canto do tabuleiro', () => {
    const t = criarTabuleiro();
    assert.equal(posicionarNavio(t, 'Destroier', 8, 9, 'vertical').ok, true);
    assert.equal(t.celulas[9][9], 'Destroier');
  });

  test('recusa navio que sai do tabuleiro', () => {
    const t = criarTabuleiro();
    const r = posicionarNavio(t, 'Porta-aviões', 0, 7, 'horizontal');
    assert.equal(r.ok, false);
    assert.equal(contarOcupadas(t), 0);
  });

  test('recusa navios sobrepostos', () => {
    const t = criarTabuleiro();
    posicionarNavio(t, 'Porta-aviões', 0, 0, 'horizontal');
    const r = posicionarNavio(t, 'Encouraçado', 0, 3, 'vertical'); // cruza a coluna 3 da linha 0
    assert.equal(r.ok, false);
    assert.equal(contarOcupadas(t), 5);
  });

  test('uma posição recusada não deixa sobras no tabuleiro', () => {
    const t = criarTabuleiro();
    posicionarNavio(t, 'Porta-aviões', 0, 4, 'vertical');
    const antes = JSON.stringify(t);
    posicionarNavio(t, 'Encouraçado', 0, 2, 'horizontal'); // bate na coluna 4
    assert.equal(JSON.stringify(t), antes);
  });

  test('aceita navios lado a lado, sem sobrepor', () => {
    const t = criarTabuleiro();
    assert.equal(posicionarNavio(t, 'Porta-aviões', 0, 0, 'horizontal').ok, true);
    assert.equal(posicionarNavio(t, 'Encouraçado', 1, 0, 'horizontal').ok, true);
  });

  test('recusa posicionar o mesmo navio duas vezes', () => {
    const t = criarTabuleiro();
    posicionarNavio(t, 'Destroier', 0, 0, 'horizontal');
    assert.equal(posicionarNavio(t, 'Destroier', 5, 5, 'vertical').ok, false);
    assert.equal(contarOcupadas(t), 2);
  });

  test('recusa navio inexistente, orientação e posição inválidas', () => {
    const t = criarTabuleiro();
    assert.equal(posicionarNavio(t, 'Jangada', 0, 0, 'horizontal').ok, false);
    assert.equal(posicionarNavio(t, 'Destroier', 0, 0, 'torto').ok, false);
    assert.equal(posicionarNavio(t, 'Destroier', 'a', 0, 'horizontal').ok, false);
    assert.equal(contarOcupadas(t), 0);
  });

  test('recusa tabuleiro inválido', () => {
    assert.equal(posicionarNavio(null, 'Destroier', 0, 0, 'horizontal').ok, false);
    assert.equal(posicionarNavio({}, 'Destroier', 0, 0, 'horizontal').ok, false);
  });

  test('os 4 navios juntos ocupam 14 casas', () => {
    assert.equal(contarOcupadas(tabuleiroPronto()), 14);
    assert.equal(tabuleiroPronto().navios.length, 4);
  });
});

describe('posicionarAleatorio', () => {
  test('posiciona os 4 navios, ocupando 14 casas', () => {
    const t = criarTabuleiro();
    assert.equal(posicionarAleatorio(t, criarAleatorio(1)).ok, true);
    assert.equal(t.navios.length, 4);
    assert.equal(contarOcupadas(t), 14);
  });

  test('cada navio fica com o tamanho certo no tabuleiro', () => {
    const t = criarTabuleiro();
    posicionarAleatorio(t, criarAleatorio(2));
    NAVIOS.forEach((navio) => {
      const casas = t.celulas.flat().filter((c) => c === navio.nome).length;
      assert.equal(casas, navio.tamanho);
    });
  });

  test('com a mesma semente o resultado é igual', () => {
    const a = criarTabuleiro();
    const b = criarTabuleiro();
    posicionarAleatorio(a, criarAleatorio(7));
    posicionarAleatorio(b, criarAleatorio(7));
    assert.deepEqual(a.celulas, b.celulas);
  });

  test('só posiciona os navios que faltam', () => {
    const t = criarTabuleiro();
    posicionarNavio(t, 'Porta-aviões', 9, 0, 'horizontal');
    posicionarAleatorio(t, criarAleatorio(3));
    assert.equal(t.navios.length, 4);
    assert.equal(t.celulas[9][0], 'Porta-aviões');
    assert.equal(contarOcupadas(t), 14);
  });

  test('funciona em 200 sementes diferentes', () => {
    for (let semente = 1; semente <= 200; semente++) {
      const t = criarTabuleiro();
      assert.equal(posicionarAleatorio(t, criarAleatorio(semente)).ok, true);
      assert.equal(contarOcupadas(t), 14);
    }
  });

  test('desiste sem travar nem quebrar se o gerador só sorteia a mesma casa', () => {
    const t = criarTabuleiro();
    // sempre sorteia a casa [9,9], onde nenhum navio cabe
    const r = posicionarAleatorio(t, () => 0.9999999);
    assert.equal(r.ok, false);
    assert.equal(contarOcupadas(t), 0);
  });

  test('recusa tabuleiro inválido', () => {
    assert.equal(posicionarAleatorio(null).ok, false);
  });
});

// ---------- Tiros ----------

describe('Tiros', () => {
  test('tiro na água', () => {
    const t = tabuleiroPronto();
    const r = atirar(t, 9, 9);
    assert.equal(r.ok, true);
    assert.equal(r.resultado, 'agua');
    assert.equal(t.tiros[9][9], 'agua');
  });

  test('tiro em um navio é acerto', () => {
    const t = tabuleiroPronto();
    const r = atirar(t, 0, 0);
    assert.equal(r.resultado, 'acerto');
    assert.equal(r.navio, 'Porta-aviões');
    assert.equal(t.tiros[0][0], 'acerto');
  });

  test('acertar não afunda o navio antes da última casa', () => {
    const t = tabuleiroPronto();
    for (let coluna = 0; coluna < 4; coluna++) {
      assert.equal(atirar(t, 0, coluna).resultado, 'acerto');
    }
  });

  test('o navio afunda quando todas as casas são atingidas (porta-aviões, 5 tiros)', () => {
    const t = tabuleiroPronto();
    let r;
    for (let coluna = 0; coluna < 5; coluna++) r = atirar(t, 0, coluna);
    assert.equal(r.resultado, 'afundou');
    assert.equal(r.navio, 'Porta-aviões');
  });

  test('cada navio afunda com a quantidade certa de tiros', () => {
    const linhas = { 'Porta-aviões': 0, 'Encouraçado': 2, 'Submarino': 4, 'Destroier': 6 };
    NAVIOS.forEach((navio) => {
      const t = tabuleiroPronto();
      let r;
      for (let coluna = 0; coluna < navio.tamanho; coluna++) r = atirar(t, linhas[navio.nome], coluna);
      assert.equal(r.resultado, 'afundou', navio.nome);
    });
  });

  test('recusa atirar duas vezes no mesmo lugar', () => {
    const t = tabuleiroPronto();
    atirar(t, 0, 0);
    assert.equal(atirar(t, 0, 0).ok, false);
    assert.equal(atirar(t, 9, 9).ok, true);
    assert.equal(atirar(t, 9, 9).ok, false);
  });

  test('um tiro repetido não conta como novo acerto', () => {
    const t = tabuleiroPronto();
    atirar(t, 6, 0);
    atirar(t, 6, 0);
    assert.equal(atirar(t, 6, 1).resultado, 'afundou'); // destroier tem 2 casas
  });

  test('recusa tiro fora do tabuleiro', () => {
    const t = tabuleiroPronto();
    assert.equal(atirar(t, -1, 0).ok, false);
    assert.equal(atirar(t, 0, 10).ok, false);
    assert.equal(atirar(t, 10, 10).ok, false);
  });

  test('recusa tiro com valores inválidos', () => {
    const t = tabuleiroPronto();
    assert.equal(atirar(t, '0', 0).ok, false);
    assert.equal(atirar(t, 1.5, 0).ok, false);
    assert.equal(atirar(t, undefined, undefined).ok, false);
    assert.equal(atirar(t, null, 0).ok, false);
  });

  test('um tiro recusado não altera o tabuleiro', () => {
    const t = tabuleiroPronto();
    atirar(t, 0, 0);
    const antes = JSON.stringify(t);
    atirar(t, 0, 0);
    atirar(t, 99, 99);
    assert.equal(JSON.stringify(t), antes);
  });

  test('recusa atirar antes de posicionar todos os navios', () => {
    const t = criarTabuleiro();
    assert.equal(atirar(t, 0, 0).ok, false);
    posicionarNavio(t, 'Destroier', 0, 0, 'horizontal');
    assert.equal(atirar(t, 0, 0).ok, false);
  });

  test('recusa tabuleiro inválido', () => {
    assert.equal(atirar(null, 0, 0).ok, false);
    assert.equal(atirar({}, 0, 0).ok, false);
  });
});

describe('Fim de jogo', () => {
  test('o jogo não termina com navios ainda de pé', () => {
    const t = tabuleiroPronto();
    assert.equal(todosAfundados(t), false);
    assert.equal(atirar(t, 6, 0).fim, false);
  });

  test('afundar só alguns navios não termina o jogo', () => {
    const t = tabuleiroPronto();
    atirar(t, 6, 0);
    const r = atirar(t, 6, 1); // afunda o destroier
    assert.equal(r.resultado, 'afundou');
    assert.equal(r.fim, false);
    assert.equal(todosAfundados(t), false);
  });

  test('afundar todos os navios termina o jogo', () => {
    const t = tabuleiroPronto();
    let ultimo;
    const alvos = [[0, 5], [2, 4], [4, 3], [6, 2]]; // [linha, tamanho]
    alvos.forEach(([linha, tamanho]) => {
      for (let coluna = 0; coluna < tamanho; coluna++) ultimo = atirar(t, linha, coluna);
    });
    assert.equal(ultimo.fim, true);
    assert.equal(todosAfundados(t), true);
  });

  test('tabuleiro sem navios ou inválido nunca está "todo afundado"', () => {
    assert.equal(todosAfundados(criarTabuleiro()), false);
    assert.equal(todosAfundados(null), false);
  });
});

// ---------- Simulação ----------

describe('Partidas completas simuladas', () => {
  test('100 jogos atirando em todas as 100 casas: 14 acertos, 4 afundados e 1 fim', () => {
    for (let semente = 1; semente <= 100; semente++) {
      const aleatorio = criarAleatorio(semente);
      const t = criarTabuleiro();
      posicionarAleatorio(t, aleatorio);

      // todas as casas, em ordem embaralhada
      const casas = [];
      for (let l = 0; l < TAMANHO; l++) for (let c = 0; c < TAMANHO; c++) casas.push([l, c]);
      for (let i = casas.length - 1; i > 0; i--) {
        const j = Math.floor(aleatorio() * (i + 1));
        [casas[i], casas[j]] = [casas[j], casas[i]];
      }

      let acertos = 0;
      let afundados = 0;
      let fins = 0;
      casas.forEach(([l, c]) => {
        const r = atirar(t, l, c);
        assert.equal(r.ok, true);
        if (r.resultado !== 'agua') acertos += 1;
        if (r.resultado === 'afundou') afundados += 1;
        if (r.fim) fins += 1;
      });

      assert.equal(acertos, 14);
      assert.equal(afundados, 4);
      assert.equal(fins, 1);
      assert.equal(todosAfundados(t), true);
    }
  });
});

// ---------- Partida entre dois jogadores ----------

describe('nomeCasa', () => {
  test('converte posições em nomes como A1 e J10', () => {
    assert.equal(nomeCasa(0, 0), 'A1');
    assert.equal(nomeCasa(2, 1), 'B3');
    assert.equal(nomeCasa(9, 9), 'J10');
  });

  test('devolve null para posição inválida', () => {
    assert.equal(nomeCasa(10, 0), null);
    assert.equal(nomeCasa(-1, 0), null);
    assert.equal(nomeCasa('0', 0), null);
  });
});

describe('novoJogo', () => {
  test('cada jogador recebe um tabuleiro 10 x 10 com os 4 navios', () => {
    const jogo = novoJogo('Danilo', 'Ana', criarAleatorio(4));
    assert.equal(jogo.tabuleiros.length, 2);
    jogo.tabuleiros.forEach((t) => {
      assert.equal(t.celulas.length, 10);
      assert.equal(t.navios.length, 4);
      assert.equal(contarOcupadas(t), 14);
    });
  });

  test('os dois tabuleiros são diferentes entre si', () => {
    const jogo = novoJogo('Danilo', 'Ana', criarAleatorio(4));
    assert.notDeepEqual(jogo.tabuleiros[0].celulas, jogo.tabuleiros[1].celulas);
  });

  test('começa em andamento, com o jogador 1 na vez e sem vencedor', () => {
    const jogo = novoJogo('Danilo', 'Ana');
    assert.equal(jogo.status, 'jogando');
    assert.equal(jogo.vez, 0);
    assert.equal(jogo.vencedor, null);
    assert.deepEqual(jogo.jogadores, ['Danilo', 'Ana']);
  });

  test('remove espaços das pontas dos nomes', () => {
    assert.deepEqual(novoJogo('  Danilo ', ' Ana').jogadores, ['Danilo', 'Ana']);
  });

  test('recusa nomes vazios, iguais, longos ou que não são texto', () => {
    assert.throws(() => novoJogo('', 'Ana'));
    assert.throws(() => novoJogo('   ', 'Ana'));
    assert.throws(() => novoJogo('Ana', ' ana'));
    assert.throws(() => novoJogo('a'.repeat(21), 'Ana'));
    assert.throws(() => novoJogo(null, 'Ana'));
    assert.throws(() => novoJogo('Danilo', 42));
  });
});

describe('jogarTiro', () => {
  test('o tiro vai para o tabuleiro do adversário', () => {
    const jogo = novoJogo('Danilo', 'Ana', criarAleatorio(5));
    jogarTiro(jogo, 0, 0);
    assert.notEqual(jogo.tabuleiros[1].tiros[0][0], null);
    assert.equal(jogo.tabuleiros[0].tiros[0][0], null);
  });

  test('a vez alterna depois de cada tiro', () => {
    const jogo = novoJogo('Danilo', 'Ana', criarAleatorio(5));
    jogarTiro(jogo, 0, 0);
    assert.equal(jogo.vez, 1);
    jogarTiro(jogo, 0, 0);
    assert.equal(jogo.vez, 0);
  });

  test('os dois jogadores podem atirar na mesma casa, cada um no tabuleiro do outro', () => {
    const jogo = novoJogo('Danilo', 'Ana', criarAleatorio(5));
    assert.equal(jogarTiro(jogo, 3, 3).ok, true);
    assert.equal(jogarTiro(jogo, 3, 3).ok, true);
  });

  test('tiro repetido é recusado e a vez não muda', () => {
    const jogo = novoJogo('Danilo', 'Ana', criarAleatorio(5));
    jogarTiro(jogo, 0, 0); // Danilo
    jogarTiro(jogo, 5, 5); // Ana
    assert.equal(jogarTiro(jogo, 0, 0).ok, false); // Danilo repete
    assert.equal(jogo.vez, 0);
  });

  test('tiro fora do tabuleiro é recusado e a vez não muda', () => {
    const jogo = novoJogo('Danilo', 'Ana', criarAleatorio(5));
    assert.equal(jogarTiro(jogo, 10, 0).ok, false);
    assert.equal(jogarTiro(jogo, 'a', 0).ok, false);
    assert.equal(jogo.vez, 0);
  });

  test('a mensagem informa quem atirou, onde e o resultado', () => {
    const jogo = novoJogo('Danilo', 'Ana');
    jogo.tabuleiros[1] = tabuleiroPronto();
    jogarTiro(jogo, 0, 0);
    assert.match(jogo.mensagem, /Danilo/);
    assert.match(jogo.mensagem, /A1/);
    assert.match(jogo.mensagem, /Porta-aviões/);
  });

  test('recusa partida inválida', () => {
    assert.equal(jogarTiro(null, 0, 0).ok, false);
    assert.equal(jogarTiro({}, 0, 0).ok, false);
  });
});

describe('Vitória na partida', () => {
  // Atira em todos os navios do adversário. O outro jogador joga na água, nas linhas 8 e 9.
  function jogarAteAfundarTudo(jogo, vencedor) {
    const alvos = [];
    jogo.tabuleiros[1 - vencedor].navios.forEach((n) => alvos.push(...n.posicoes));
    let agua = 0;
    let ultimo;
    alvos.forEach(([l, c]) => {
      ultimo = jogarTiro(jogo, l, c);
      if (jogo.status === 'jogando') {
        jogarTiro(jogo, 8 + Math.floor(agua / 10), agua % 10);
        agua += 1;
      }
    });
    return ultimo;
  }

  test('o jogador 1 vence ao afundar todos os navios do jogador 2', () => {
    const jogo = novoJogo('Danilo', 'Ana');
    jogo.tabuleiros[0] = tabuleiroPronto();
    jogo.tabuleiros[1] = tabuleiroPronto();
    const ultimo = jogarAteAfundarTudo(jogo, 0);
    assert.equal(ultimo.fim, true);
    assert.equal(jogo.status, 'fim');
    assert.equal(jogo.vencedor, 0);
  });

  test('o jogador 2 também pode vencer', () => {
    const jogo = novoJogo('Danilo', 'Ana');
    jogo.tabuleiros[0] = tabuleiroPronto();
    jogo.tabuleiros[1] = tabuleiroPronto();
    jogo.vez = 1;
    jogarAteAfundarTudo(jogo, 1);
    assert.equal(jogo.vencedor, 1);
  });

  test('depois do fim não é possível atirar', () => {
    const jogo = novoJogo('Danilo', 'Ana');
    jogo.tabuleiros[0] = tabuleiroPronto();
    jogo.tabuleiros[1] = tabuleiroPronto();
    jogarAteAfundarTudo(jogo, 0);
    assert.equal(jogarTiro(jogo, 9, 9).ok, false);
  });

  test('100 partidas aleatórias sempre terminam com um vencedor que afundou toda a frota', () => {
    for (let semente = 1; semente <= 100; semente++) {
      const aleatorio = criarAleatorio(semente);
      const jogo = novoJogo('Danilo', 'Ana', aleatorio);
      let tiros = 0;
      while (jogo.status === 'jogando' && tiros < 300) {
        const alvo = jogo.tabuleiros[1 - jogo.vez];
        const livres = [];
        for (let l = 0; l < TAMANHO; l++) {
          for (let c = 0; c < TAMANHO; c++) if (alvo.tiros[l][c] === null) livres.push([l, c]);
        }
        const [l, c] = livres[Math.floor(aleatorio() * livres.length)];
        assert.equal(jogarTiro(jogo, l, c).ok, true);
        tiros += 1;
      }
      assert.equal(jogo.status, 'fim');
      assert.ok(tiros < 300);
      assert.equal(todosAfundados(jogo.tabuleiros[1 - jogo.vencedor]), true);
      assert.equal(todosAfundados(jogo.tabuleiros[jogo.vencedor]), false);
    }
  });
});

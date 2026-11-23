// Lógica da Batalha Naval: tabuleiro 10x10 com 4 navios.
// Sem nada de tela, só regras, para poder testar tudo no Node.

const TAMANHO = 10;

const NAVIOS = [
  { nome: 'Porta-aviões', tamanho: 5 },
  { nome: 'Encouraçado', tamanho: 4 },
  { nome: 'Submarino', tamanho: 3 },
  { nome: 'Destroier', tamanho: 2 },
];

// Cria um tabuleiro vazio.
// celulas: guarda o nome do navio em cada casa (ou null se for água)
// tiros: guarda o que aconteceu em cada tiro ('agua', 'acerto' ou null se ainda não atirou)
function criarTabuleiro() {
  return {
    celulas: Array.from({ length: TAMANHO }, () => Array(TAMANHO).fill(null)),
    tiros: Array.from({ length: TAMANHO }, () => Array(TAMANHO).fill(null)),
    navios: [], // cada navio posicionado: { nome, tamanho, posicoes, acertos }
  };
}

function tabuleiroValido(tabuleiro) {
  return (
    Boolean(tabuleiro) &&
    Array.isArray(tabuleiro.celulas) &&
    Array.isArray(tabuleiro.tiros) &&
    Array.isArray(tabuleiro.navios)
  );
}

// Linha e coluna precisam ser inteiros de 0 a 9.
function posicaoValida(linha, coluna) {
  return (
    Number.isInteger(linha) && Number.isInteger(coluna) &&
    linha >= 0 && linha < TAMANHO &&
    coluna >= 0 && coluna < TAMANHO
  );
}

// Lista as casas que o navio ocuparia a partir de (linha, coluna).
// Devolve null se o navio não existe, a orientação é inválida ou ele sai do tabuleiro.
function calcularPosicoes(nome, linha, coluna, orientacao) {
  const navio = NAVIOS.find((n) => n.nome === nome);
  if (!navio) return null;
  if (orientacao !== 'horizontal' && orientacao !== 'vertical') return null;
  if (!posicaoValida(linha, coluna)) return null;

  const posicoes = [];
  for (let i = 0; i < navio.tamanho; i++) {
    const l = orientacao === 'vertical' ? linha + i : linha;
    const c = orientacao === 'horizontal' ? coluna + i : coluna;
    if (!posicaoValida(l, c)) return null; // saiu do tabuleiro
    posicoes.push([l, c]);
  }
  return posicoes;
}

function erro(texto) {
  return { ok: false, erro: texto };
}

// Coloca um navio no tabuleiro. Navios podem ficar lado a lado, mas não sobrepostos.
function posicionarNavio(tabuleiro, nome, linha, coluna, orientacao) {
  if (!tabuleiroValido(tabuleiro)) return erro('Tabuleiro inválido.');
  const navio = NAVIOS.find((n) => n.nome === nome);
  if (!navio) return erro('Esse navio não existe.');
  if (tabuleiro.navios.some((n) => n.nome === nome)) return erro('Esse navio já foi posicionado.');

  const posicoes = calcularPosicoes(nome, linha, coluna, orientacao);
  if (!posicoes) return erro('O navio não cabe nessa posição.');
  if (posicoes.some(([l, c]) => tabuleiro.celulas[l][c] !== null)) {
    return erro('Já existe um navio nessa posição.');
  }

  posicoes.forEach(([l, c]) => {
    tabuleiro.celulas[l][c] = nome;
  });
  tabuleiro.navios.push({ nome, tamanho: navio.tamanho, posicoes, acertos: 0 });
  return { ok: true, posicoes };
}

// Posiciona sozinho os navios que ainda faltam. O parâmetro "aleatorio" existe
// para os testes usarem números previsíveis.
function posicionarAleatorio(tabuleiro, aleatorio = Math.random) {
  if (!tabuleiroValido(tabuleiro)) return erro('Tabuleiro inválido.');

  for (const navio of NAVIOS) {
    if (tabuleiro.navios.some((n) => n.nome === navio.nome)) continue;
    let colocou = false;
    for (let tentativa = 0; tentativa < 1000 && !colocou; tentativa++) {
      const linha = Math.min(Math.floor(aleatorio() * TAMANHO), TAMANHO - 1);
      const coluna = Math.min(Math.floor(aleatorio() * TAMANHO), TAMANHO - 1);
      const orientacao = aleatorio() < 0.5 ? 'horizontal' : 'vertical';
      colocou = posicionarNavio(tabuleiro, navio.nome, linha, coluna, orientacao).ok;
    }
    if (!colocou) return erro('Não foi possível posicionar todos os navios.');
  }
  return { ok: true };
}

function todosPosicionados(tabuleiro) {
  return tabuleiroValido(tabuleiro) && tabuleiro.navios.length === NAVIOS.length;
}

// true quando todos os navios foram afundados.
function todosAfundados(tabuleiro) {
  return todosPosicionados(tabuleiro) && tabuleiro.navios.every((n) => n.acertos === n.tamanho);
}

// Dá um tiro na casa (linha, coluna).
// Resultado: 'agua', 'acerto' ou 'afundou'. "fim" fica true quando o último navio afunda.
function atirar(tabuleiro, linha, coluna) {
  if (!tabuleiroValido(tabuleiro)) return erro('Tabuleiro inválido.');
  if (!todosPosicionados(tabuleiro)) return erro('Posicione todos os navios antes de atirar.');
  if (!posicaoValida(linha, coluna)) return erro('Posição fora do tabuleiro.');
  if (tabuleiro.tiros[linha][coluna] !== null) return erro('Você já atirou nessa posição.');

  const nome = tabuleiro.celulas[linha][coluna];
  if (nome === null) {
    tabuleiro.tiros[linha][coluna] = 'agua';
    return { ok: true, resultado: 'agua', fim: false };
  }

  const navio = tabuleiro.navios.find((n) => n.nome === nome);
  navio.acertos += 1;
  tabuleiro.tiros[linha][coluna] = 'acerto';

  if (navio.acertos === navio.tamanho) {
    return { ok: true, resultado: 'afundou', navio: nome, fim: todosAfundados(tabuleiro) };
  }
  return { ok: true, resultado: 'acerto', navio: nome, fim: false };
}

// ---------- Partida entre dois jogadores ----------

const LETRAS = 'ABCDEFGHIJ';

// Nome da casa como no jogo de tabuleiro: coluna em letra e linha em número.
// Exemplo: nomeCasa(2, 1) -> 'B3'. Posição inválida devolve null.
function nomeCasa(linha, coluna) {
  if (!posicaoValida(linha, coluna)) return null;
  return LETRAS[coluna] + (linha + 1);
}

// Começa uma partida: cada jogador recebe um tabuleiro com os navios já posicionados.
function novoJogo(nome1, nome2, aleatorio = Math.random) {
  if (typeof nome1 !== 'string' || typeof nome2 !== 'string') {
    throw new Error('Os nomes devem ser textos.');
  }
  const a = nome1.trim();
  const b = nome2.trim();
  if (a === '' || b === '') throw new Error('Informe o nome dos dois jogadores.');
  if (a.length > 20 || b.length > 20) throw new Error('Cada nome pode ter no máximo 20 caracteres.');
  if (a.toLowerCase() === b.toLowerCase()) throw new Error('Os jogadores precisam ter nomes diferentes.');

  const tabuleiros = [criarTabuleiro(), criarTabuleiro()];
  tabuleiros.forEach((t) => {
    if (!posicionarAleatorio(t, aleatorio).ok) throw new Error('Não foi possível posicionar os navios.');
  });

  return {
    jogadores: [a, b],
    tabuleiros, // tabuleiros[0] é do jogador 1 e tabuleiros[1] é do jogador 2
    vez: 0, // quem atira agora
    status: 'jogando', // ou 'fim'
    vencedor: null, // 0 ou 1 quando o jogo termina
    mensagem: `${a} começa.`,
  };
}

// Quem está na vez atira no tabuleiro do adversário. Depois de um tiro válido a vez passa
// para o outro jogador, a não ser que o jogo tenha acabado.
function jogarTiro(jogo, linha, coluna) {
  if (!jogo || !Array.isArray(jogo.tabuleiros)) return erro('Partida inválida.');
  if (jogo.status !== 'jogando') return erro('A partida já terminou.');

  const resultado = atirar(jogo.tabuleiros[1 - jogo.vez], linha, coluna);
  if (!resultado.ok) return resultado;

  const nome = jogo.jogadores[jogo.vez];
  const casa = nomeCasa(linha, coluna);
  if (resultado.fim) {
    jogo.status = 'fim';
    jogo.vencedor = jogo.vez;
    jogo.mensagem = `${nome} atirou em ${casa}, afundou o ${resultado.navio} e destruiu toda a frota!`;
  } else {
    if (resultado.resultado === 'agua') jogo.mensagem = `${nome} atirou em ${casa}: água.`;
    else if (resultado.resultado === 'acerto') jogo.mensagem = `${nome} atirou em ${casa}: acertou o ${resultado.navio}!`;
    else jogo.mensagem = `${nome} atirou em ${casa}: afundou o ${resultado.navio}!`;
    jogo.vez = 1 - jogo.vez;
  }
  return resultado;
}

if (typeof module !== 'undefined') {
  module.exports = {
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
  };
}

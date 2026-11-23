// Parte visual do jogo: lê a partida de batalha-naval.js e desenha na tela.
// As regras ficam no batalha-naval.js; aqui só mostramos e recebemos cliques.

let jogo = null; // a partida atual
let jogadorTela = 0; // de quem é a tela que está aparecendo
let aguardandoTroca = false; // true depois de atirar, até clicar em "Encerrar jogada"
let mensagemTela = '';

const $ = (id) => document.getElementById(id);

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach((tela) => {
    tela.hidden = tela.id !== id;
  });
}

// Casas que pertencem a navios já afundados (para pintar de outra cor).
function casasAfundadas(tabuleiro) {
  const casas = new Set();
  tabuleiro.navios
    .filter((n) => n.acertos === n.tamanho)
    .forEach((n) => n.posicoes.forEach(([l, c]) => casas.add(l + ',' + c)));
  return casas;
}

// Monta uma grade 10x10 com letras em cima e números ao lado.
// "ataque": casas clicáveis, mostra só os tiros. "propria": mostra os navios e os tiros recebidos.
function desenharGrade(elemento, tabuleiro, modo) {
  elemento.innerHTML = '';
  const afundadas = casasAfundadas(tabuleiro);

  elemento.appendChild(document.createElement('span')); // canto vazio
  for (let c = 0; c < TAMANHO; c++) {
    const letra = document.createElement('span');
    letra.className = 'rotulo';
    letra.textContent = LETRAS[c];
    elemento.appendChild(letra);
  }

  for (let l = 0; l < TAMANHO; l++) {
    const numero = document.createElement('span');
    numero.className = 'rotulo';
    numero.textContent = l + 1;
    elemento.appendChild(numero);

    for (let c = 0; c < TAMANHO; c++) {
      const tiro = tabuleiro.tiros[l][c];
      const celula = document.createElement(modo === 'ataque' ? 'button' : 'div');
      celula.className = 'celula';

      if (modo === 'propria' && tabuleiro.celulas[l][c] !== null) celula.classList.add('navio');
      if (tiro === 'agua') {
        celula.classList.add('agua');
        celula.textContent = '•';
      } else if (tiro === 'acerto') {
        celula.classList.add('acerto');
        celula.textContent = '✕';
        if (afundadas.has(l + ',' + c)) celula.classList.add('afundado');
      }

      if (modo === 'ataque') {
        celula.type = 'button';
        celula.setAttribute('aria-label', `Atirar em ${nomeCasa(l, c)}`);
        celula.disabled = tiro !== null || aguardandoTroca;
        celula.addEventListener('click', () => atirarEm(l, c));
      }
      elemento.appendChild(celula);
    }
  }
}

// Lista os navios e marca os que já afundaram.
function desenharFrota(elemento, tabuleiro) {
  elemento.innerHTML = '';
  tabuleiro.navios.forEach((navio) => {
    const item = document.createElement('li');
    const afundou = navio.acertos === navio.tamanho;
    item.className = afundou ? 'afundou' : '';
    item.textContent = `${navio.nome} (${navio.tamanho})` + (afundou ? ' afundado' : '');
    elemento.appendChild(item);
  });
}

function desenharJogo() {
  const adversario = jogo.tabuleiros[1 - jogadorTela];
  const meu = jogo.tabuleiros[jogadorTela];

  $('jogo-titulo').textContent = `Vez de ${jogo.jogadores[jogadorTela]}`;
  $('mensagem').textContent = mensagemTela;
  desenharGrade($('grade-ataque'), adversario, 'ataque');
  desenharGrade($('grade-propria'), meu, 'propria');
  desenharFrota($('frota-inimiga'), adversario);
  desenharFrota($('frota-propria'), meu);

  $('botao-encerrar').hidden = !aguardandoTroca;
  $('dica').textContent = aguardandoTroca
    ? 'Veja o resultado do seu tiro e clique em "Encerrar jogada" para passar a vez.'
    : 'Clique em uma casa do tabuleiro do adversário para atirar.';
  mostrarTela('tela-jogo');
}

function desenharTransicao() {
  $('transicao-mensagem').textContent = jogo.mensagem;
  $('transicao-titulo').textContent = `Vez de ${jogo.jogadores[jogo.vez]}`;
  mostrarTela('tela-transicao');
}

function desenharFim() {
  $('fim-titulo').textContent = `${jogo.jogadores[jogo.vencedor]} venceu!`;
  $('fim-mensagem').textContent = jogo.mensagem;
  const lista = $('fim-frotas');
  lista.innerHTML = '';
  jogo.jogadores.forEach((nome, i) => {
    const restantes = jogo.tabuleiros[i].navios.filter((n) => n.acertos < n.tamanho).length;
    const item = document.createElement('li');
    item.textContent = `${nome}: ${restantes} ${restantes === 1 ? 'navio restante' : 'navios restantes'}`;
    lista.appendChild(item);
  });
  mostrarTela('tela-fim');
}

// ---------- Ações ----------

function atirarEm(linha, coluna) {
  const resultado = jogarTiro(jogo, linha, coluna);
  if (!resultado.ok) {
    mensagemTela = resultado.erro;
    desenharJogo();
    return;
  }
  if (jogo.status === 'fim') {
    desenharFim();
    return;
  }
  mensagemTela = jogo.mensagem;
  aguardandoTroca = true;
  desenharJogo();
}

function comecarPartida(novo) {
  jogo = novo;
  jogadorTela = jogo.vez;
  aguardandoTroca = false;
  mensagemTela = '';
  desenharTransicao();
}

// ---------- Eventos ----------

$('form-jogadores').addEventListener('submit', (evento) => {
  evento.preventDefault();
  try {
    comecarPartida(novoJogo($('nome1').value, $('nome2').value));
    $('erro-nomes').textContent = '';
  } catch (e) {
    $('erro-nomes').textContent = e.message;
  }
});

$('botao-pronto').addEventListener('click', () => {
  jogadorTela = jogo.vez;
  aguardandoTroca = false;
  mensagemTela = '';
  desenharJogo();
});

$('botao-encerrar').addEventListener('click', () => {
  aguardandoTroca = false;
  desenharTransicao();
});

$('botao-nova').addEventListener('click', () => comecarPartida(novoJogo(jogo.jogadores[0], jogo.jogadores[1])));
$('botao-trocar').addEventListener('click', () => {
  jogo = null;
  mostrarTela('tela-inicio');
});

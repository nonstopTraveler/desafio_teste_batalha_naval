# Desafio Batalha Naval

Projeto da disciplina de Projeto, Implementação e Teste de Software. É um jogo de Batalha Naval para duas pessoas no mesmo dispositivo, que roda no navegador, com a lógica em JavaScript e casos de teste automatizados que garantem que as regras funcionam.

## Regras implementadas

- Tabuleiro de 10 x 10 (100 casas), linhas e colunas numeradas de 0 a 9.
- 4 navios por tabuleiro:

| Navio | Casas |
| --- | --- |
| 1 Porta-aviões | 5 |
| 1 Encouraçado | 4 |
| 1 Submarino | 3 |
| 1 Destroier | 2 |

  Ao todo são 14 casas ocupadas.
- Os navios ficam na horizontal ou na vertical e não podem sair do tabuleiro.
- Navios não podem se sobrepor, mas podem ficar lado a lado.
- Cada navio é posicionado uma única vez.
- Só é possível atirar depois de posicionar os 4 navios.
- Um tiro resulta em `agua`, `acerto` ou `afundou`.
- Atirar duas vezes no mesmo lugar ou fora do tabuleiro é recusado.
- O jogo termina quando todos os navios são afundados.
- Na partida, cada jogador recebe um tabuleiro com os navios posicionados automaticamente e escondidos do adversário. Os jogadores atiram no tabuleiro um do outro, alternando a vez depois de cada tiro. Vence quem afundar toda a frota do adversário primeiro.

## Como jogar

Abra o arquivo `index.html` no navegador (duplo clique). Não precisa de servidor nem de internet.

1. Digite o nome dos dois jogadores e clique em **Iniciar partida**.
2. Antes de cada vez aparece uma tela pedindo que o próximo jogador assuma o dispositivo. Clique em **Estou pronto** para ver os tabuleiros.
3. Clique em uma casa do **Tabuleiro do adversário** para atirar. Água aparece como `•` e acerto como `✕` (vermelho). Navios afundados ficam em vermelho escuro.
4. O **Seu tabuleiro** mostra seus navios e os tiros que o adversário já deu.
5. Depois do tiro, veja o resultado e clique em **Encerrar jogada** para passar a vez.

## Como executar os testes

Requer Node.js 18 ou superior.

```bash
npm test
```

O comando executa `node --test test.js`. Não há dependências para instalar.

## Tecnologias

- JavaScript puro.
- Node.js 18+ com `node:test` e `node:assert/strict`.

## Organização dos arquivos

```text
desafio_batalha_naval/
├── index.html         Telas do jogo (inicial, troca de jogador, partida e final)
├── style.css          Visual do jogo
├── game.js            Interface: desenha a partida na tela e recebe os cliques
├── batalha-naval.js   Lógica do jogo (usada pela interface e pelos testes)
├── test.js            Testes automatizados
├── package.json
└── README.md
```

### Funções (`batalha-naval.js`)

| Função | O que faz |
| --- | --- |
| `criarTabuleiro()` | Cria um tabuleiro 10 x 10 vazio. |
| `posicaoValida(linha, coluna)` | Confere se a posição é inteira e está entre 0 e 9. |
| `calcularPosicoes(nome, linha, coluna, orientacao)` | Lista as casas que o navio ocuparia, ou `null` se não cabe. |
| `posicionarNavio(tabuleiro, nome, linha, coluna, orientacao)` | Coloca um navio e devolve `{ ok }` ou `{ ok: false, erro }`. |
| `posicionarAleatorio(tabuleiro, aleatorio)` | Posiciona sozinho os navios que faltam. |
| `atirar(tabuleiro, linha, coluna)` | Dá um tiro e informa `agua`, `acerto` ou `afundou` e se o jogo acabou (`fim`). |
| `todosAfundados(tabuleiro)` | `true` quando todos os navios afundaram. |
| `nomeCasa(linha, coluna)` | Nome da casa, como `B3`, ou `null` se for inválida. |
| `novoJogo(nome1, nome2)` | Cria a partida com dois tabuleiros e os navios posicionados. Lança erro se os nomes forem inválidos. |
| `jogarTiro(jogo, linha, coluna)` | Quem está na vez atira no tabuleiro do adversário, alterna a vez e detecta o vencedor. |

## Grupos de testes

| Grupo | O que verifica |
| --- | --- |
| Constantes do jogo | Tabuleiro de tamanho 10, 4 navios com tamanhos 5, 4, 3 e 2, total de 14 casas. |
| Criação do tabuleiro 10 x 10 | 10 linhas, 10 colunas, 100 casas, tudo vazio e tabuleiros independentes. |
| `posicaoValida` | Cantos aceitos e valores fora do intervalo, não inteiros ou de outro tipo recusados. |
| `calcularPosicoes` | Horizontal e vertical, tamanho de cada navio, limites das bordas e entradas inválidas. |
| `posicionarNavio` | Marcação das casas, canto do tabuleiro, saída do tabuleiro, sobreposição, navio repetido e tabuleiro inalterado após erro. |
| `posicionarAleatorio` | Os 4 navios posicionados com o tamanho certo, reprodutível com semente, 200 sementes diferentes. |
| Tiros | Água, acerto, afundar cada navio, tiro repetido, fora do tabuleiro, valores inválidos e tiro antes de posicionar. |
| Fim de jogo | O jogo só termina quando todos os navios afundam. |
| Partidas completas simuladas | 100 jogos atirando em todas as casas: 14 acertos, 4 navios afundados e um único fim de jogo. |
| `nomeCasa` | Conversão de posições em nomes como A1 e J10. |
| `novoJogo` | Dois tabuleiros com 4 navios, nomes válidos e estado inicial. |
| `jogarTiro` | Tiro no tabuleiro do adversário, alternância de vez, tiro repetido ou inválido e mensagens. |
| Vitória na partida | Vitória de cada jogador, bloqueio de tiros após o fim e 100 partidas aleatórias completas. |



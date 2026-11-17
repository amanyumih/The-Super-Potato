# Protótipo de sensação

Uma fase curta para sentir como a batata se mexe e luta num jogo de ação em 2D: correr, pular, dar
dash e bater com o cajado em cogumelos e cenouras. É a fatia **VIS-PRO-001** do roadmap.

Jogue pelo link: <https://claude.ai/artifact/WEow1m2sHgagqRMdTjhL2a> (privado, só você abre).
No computador também dá para abrir o arquivo `index.html` desta pasta com dois cliques.

É um rascunho para decidir o rumo. A arte é provisória, desenhada por código olhando os seus
personagens. O jogo de verdade será refeito no motor escolhido, com os seus desenhos.

## Como se joga

| Ação | Teclado | Celular | Controle |
|---|---|---|---|
| Andar | ← → ou A D | alavanca | direcional |
| Pular (segure para ir mais alto) | Z ou Espaço | PULO | A |
| Golpe com o cajado | X ou J | GOLPE | X |
| Golpe para cima | ↑ + golpe | alavanca para cima + GOLPE | ↑ + X |
| Golpe para baixo, no ar | ↓ + golpe | alavanca para baixo + GOLPE | ↓ + X |
| Dash | C, K ou Shift | DASH | B ou RB |
| Bola de purê (gasta 3 de amido) | V ou L | PURÊ | Y |
| Descer de um galho | ↓ + pular | alavanca para baixo + PULO | ↓ + A |
| Pausa | Esc ou P | botão Pausa | Start |
| Voltar à última tocha | R | menu de pausa | menu de pausa |

Três golpes seguidos terminam num golpe forte, que tira 2 de vida. Cada golpe que acerta enche 1 de
amido. A tocha acesa cura e vira o ponto de volta. O golpe para baixo quica nos inimigos e nos
espinhos.

As cenouras flutuam no ar e atiram rodelas de cenoura com uma bazuquinha. O cajado rebate a rodela, e
cada rodela rebatida também enche 1 de amido. Uma bola de purê que encontra uma rodela no ar desmancha
as duas. Para acertar uma cenoura, pule ou fique embaixo dela e use o golpe para cima.

No alto da página há três botões para estudar o jogo:

- **Medidas** (tecla H) mostra as áreas de acerto e mede o último pulo e o último dash.
- **Ajustes** abre nove controles que mudam a sensação na hora. **Copiar valores** copia os números
  para você colar na conversa.
- **Som** (tecla M) liga e desliga os efeitos.

## Os tempos, medidos

Estes números saem do próprio jogo (`PB.debug.medir()`), não da intenção. São o ponto de partida da
fatia SIS-MOV-001. Um bloco tem 48 px.

| O quê | Valor | Em blocos |
|---|---|---|
| Corrida | 340 px/s | 7,1 por segundo |
| Arrancar até a velocidade máxima | 0,10 s | |
| Parar depois de soltar | 0,08 s, em 12 px | 0,3 |
| Pulo cheio, segurando o botão | 176 px de altura, 0,70 s no ar | 3,7 |
| Pulo curto, só um toque | 43 px de altura | 0,9 |
| Distância de um pulo correndo | 238 px | 5,0 |
| Queda | 1,55 vez mais pesada que a subida | |
| Tolerância na beirada | 0,10 s | |
| Memória do botão de pulo | 0,12 s | |
| Dash | 150 px em 0,17 s, descanso de 0,40 s | 3,1 |
| Golpe | preparo 0,05 s, ativo 0,10 s, recuperação 0,15 s | |
| Golpe forte | recuperação de 0,22 s, total de 0,37 s | |
| Tempo para emendar o combo | 0,45 s | |
| Alcance do golpe | 88 px | 1,8 |
| Pausa de impacto | 65 ms; golpe forte, 120 ms; ao apanhar, 140 ms | |
| Quique do golpe para baixo | 82% do impulso do pulo, cerca de 116 px | 2,4 |
| Sem levar dano depois de apanhar | 1,1 s, sendo 0,28 s sem controle | |
| Bola de purê | 760 px/s, 2 de dano | |

Os inimigos avisam antes de atacar:

| Inimigo | Vida | Aviso | Ataque | Depois |
|---|---|---|---|---|
| Cogumelo | 3 | 0,60 s: incha, treme e fica roxo | fumaça de 110 px de raio por 1,5 s | descansa 1,3 s |
| Cenoura soldado | 4 | 0,50 s: aponta a bazuquinha, mostra "!" e a rodela aparece na boca do cano | atira a rodela a 430 px/s, reta, por até 690 px | o coice a empurra para trás; espera 2,2 s para atirar de novo |

A cenoura não anda: ela flutua a 110 px do chão, balançando, e vai e volta devagar, com uma sombra no
chão embaixo dela. Não tem pernas nem investida. A rodela é uma rodela de cenoura, a munição da
bazuquinha, como a bola de purê é a arma da batata. Não é um bicho e não tem vida. Ela vai reta para
onde a batata estava na hora do tiro e some ao bater na terra, ao ser rebatida ou ao encontrar uma bola
de purê. A cenoura só atira de até 600 px e com o caminho livre.

## O que observar enquanto joga

1. O pulo parece pesado, leve ou certo? E a queda?
2. O dash é curto, longo ou certo? Dá vontade de usar o tempo todo?
3. O golpe tem peso? A pausa de impacto incomoda ou ajuda?
4. Dá tempo de ver o aviso de cada inimigo?
5. No celular, os botões estão no lugar certo para os seus dedos?

Mexa em **Ajustes** até gostar e mande os valores copiados.

## Como está montado

| Arquivo | O que tem |
|---|---|
| `js/ajuste.js` | todos os números de sensação, o desenho da fase em blocos e os textos das placas |
| `js/motor.js` | teclado, toque e controle; som; colisão; partículas; câmera |
| `js/batata.js` | a batata: corrida, pulo, dash, golpes, purê e dano |
| `js/inimigos.js` | cogumelo, cenoura, rodela e o espantalho de treino |
| `js/desenho.js` | tudo o que aparece na tela |
| `js/jogo.js` | o laço do jogo, as telas, os ajustes e as ferramentas de medição |
| `js/testes.js` | os testes e o robô que atravessa a fase |

O jogo anda em passos fixos de 1/120 de segundo. Por isso ele se comporta igual em qualquer tela e os
testes dão sempre o mesmo resultado.

Para mudar a fase, edite as listas `chao`, `plataformas`, `espinhos` e `coisas` em `js/ajuste.js`.

## Testes

Abra `index.html#teste` (ou o link com `#teste` no fim). Em menos de um segundo aparecem 24 linhas e,
no alto, `TODOS OS 24 TESTES PASSARAM`. Eles conferem o pulo, o dash, o combo, o purê, cada inimigo,
a rodela, os espinhos, a tocha, a morte e o fim da fase. Os dois últimos são um robô que joga a fase inteira:
uma vez vazia, sem levar dano, e outra com os inimigos. Se um ajuste deixar um pulo impossível, o
robô não chega e o teste falha.

No console do navegador: `PB.debug.testar()` roda os testes e `PB.debug.medir()` devolve as medidas.

## O que foi conferido e o que não foi

Conferido em 15/11/2026, no computador:

- a página abre sem nenhum erro no console;
- os 21 testes daquele dia passavam em dois navegadores: servida por um servidor local e aberta
  direto do arquivo no Edge;
- os 14 efeitos sonoros tocam sem erro (ninguém ouviu para dizer se estão bons);
- o visual, em capturas de tela do começo, do combate, do planalto e do fim da fase;
- o layout em tela de celular em pé (375×812) e deitado (760×360), com toques simulados na alavanca
  e nos botões.

Em 16/11/2026 a rodela deixou de ser um inimigo voador e virou a arma que a cenoura atira, como no
roteiro. Conferido de novo: os 23 testes passam no Edge, e a cenoura levantando a rodela e a rodela
no ar foram olhadas em capturas.

Em 17/11/2026 as cenouras passaram a flutuar e a atirar com uma bazuquinha, como a autora descreveu,
e a rodela ganhou as cores de uma rodela de cenoura. Os testes passaram de 23 para 24: saiu o da
investida e entraram o de flutuar e o do golpe para cima na cenoura.

Não conferido:

- um celular de verdade: o conforto dos botões e a velocidade do jogo no aparelho;
- o controle (gamepad): o código está lá, mas nenhum foi ligado;
- o link publicado aberto num navegador: ele pede o seu login, então o teste foi feito com os mesmos
  arquivos neste computador.

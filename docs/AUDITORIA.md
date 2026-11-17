# Auditoria de The Super Potato

Feita em 14 e 15/11/2026 sobre o código do GitHub (`amanyumih/Super-Potato`, ramo `main`, commit `7b4666c`).
Os consertos entraram no `main` do GitHub em 15/11/2026, pelo pull request 1 (ramo
`auditoria-correcoes`).

## Resumo

O jogo é uma visual novel curta em Ren'Py: 117 falas, cerca de 1.200 palavras, 7 escolhas e 9 finais.
Do jeito que estava no GitHub, **ele não abria**. Com o ícone reposto para poder testar, apareceram mais
dois caminhos que travavam o jogo e uma batalha impossível de vencer.

| Gravidade | Achados | Consertados | Em aberto |
|---|---|---|---|
| Crítica (não abre ou trava) | 4 | 4 | 0 |
| Alta (o jogador vê o defeito) | 9 | 9 | 0 |
| Média (qualidade e manutenção) | 12 | 12 | 0 |
| Decisão sua ou trabalho maior | 12 | 10 | 2 |

Estado depois dos consertos: lint do Ren'Py sem nenhum aviso, 31 testes automatizados passando
(duas rodadas seguidas) e pacote para PC gerado em teste (`THEPOTATO-0.3-pc.zip`, 63,5 MB).

Em 16/11/2026, a pedido seu, nove dos doze pontos em aberto foram resolvidos (versão 0.4). O lint
continua sem avisos e os testes passaram de 31 para 42.

## Como foi feito

1. Leitura completa de `script.rpy`, `screens.rpy`, `gui.rpy` e `options.rpy`.
2. Comparação com a cópia original de 2018 que está no seu computador. O `script.rpy` do GitHub é uma
   versão um pouco **mais antiga** que a da cópia local (4 linhas diferentes), e faltava um arquivo.
3. Lint do Ren'Py 8.5.3 no código original.
4. Testes automatizados (sistema de testes do Ren'Py 8.5) escritos para reproduzir cada defeito no
   código original, com capturas de tela. Só depois vieram os consertos.
5. Leitura da tabela de caracteres de cada fonte, para saber o que cada uma consegue desenhar.
6. Os mesmos testes, adaptados, rodando no código consertado.

## Achados críticos

### A1. O jogo do GitHub não abre
`options.rpy` aponta para `gui/window_icon.png`, mas esse arquivo nunca foi enviado ao GitHub.
O Ren'Py para logo na abertura com `FileNotFoundError: Couldn't find file 'gui/window_icon.png'`.
**Conserto:** arquivo reposto a partir da cópia original do projeto.

### A2. O final "batata traidora" trava o jogo
Na escolha "Mandar ele ir catar coquinho", a linha do final tinha `{color=000000{cps=20}`: faltava
fechar a chave. Erro: `Color string '000000{cps=20' must be 3, 4, 6, or 8 hex digits long`.
**Conserto:** tags corrigidas. Teste: `final_batata_traidora`.

### A3. "Não fazer nada" quando o cogumelo ataca trava o jogo
A linha tinha `{size=+ 20}` com um espaço. Erro: `invalid literal for int() with base 10: '+ 20'`.
Acontecia em 1 de cada 3 vezes que o jogador escolhia "Não fazer nada".
**Conserto:** `{size=+20}`. Teste: `ficar_parado_e_apanhar_nao_trava_o_jogo`.

### A4. Era impossível vencer a batalha
A luta repetia `while (vidaB > 0) or (vidaI > 0)`: continuava enquanto **um dos dois** estivesse vivo,
ou seja, só acabava com os dois mortos. No teste, depois de 5 golpes certeiros o cogumelo ficou com 0 de
vida e o menu de luta voltou a aparecer; o cogumelo "morto" continuou batendo até a batata cair, com o
placar final em -50 a -150. O resultado era sempre "Final trágico". O "Final Feliz" e o "Final do esforço
implacável" nunca apareciam.
**Conserto:** a condição virou `and` e os três finais da luta foram ligados aos três resultados possíveis
(só a batata cai, só o cogumelo cai, os dois caem juntos). Testes: `final_feliz`, `final_tragico`,
`final_do_esforco_implacavel`.

## Achados de gravidade alta

| Nº | Problema | Conserto |
|---|---|---|
| B1 | A fonte da interface (DEATH CROW) só tem as letras A–Z. Números, pontuação e acentos **não apareciam**: as páginas dos saves ficavam invisíveis, a versão não aparecia no menu, "Preferências" virava "PREFER NCIAS". | Fonte reserva para números e pontuação; letras acentuadas usam a letra sem acento da própria fonte. |
| B2 | A barra de vida era uma só, mostrava ora a vida da batata, ora a do cogumelo, numa escala de 150 para um cogumelo de 250, e nunca saía da tela: ficava nos finais e nos créditos. | Duas barras com nome e número; somem quando a luta acaba. |
| B3 | O texto das escolhas era cinza-claro sobre amarelo-claro (e branco ao passar o mouse): quase ilegível. | Texto escuro. |
| B4 | Metade da interface estava em inglês (preferências, ajuda, confirmações, "Return", "Load", "empty slot"). | Tudo em português, incluindo os avisos do próprio Ren'Py. |
| B5 | O nome e a versão do jogo tinham tags `{color}`. Elas vazavam para o título da janela, para os saves e para o nome do pacote. | Nome e versão limpos; a cor do título ficou no estilo. Versão passou a 0.3. |
| B6 | O repositório guardava o conteúdo da pasta `game/` na raiz. O launcher do Ren'Py não reconhece isso como projeto. | Arquivos movidos para `game/`. |
| B7 | O repositório tinha arquivos compilados, cache, seus saves pessoais e 13 MB de zips e imagens de divulgação das fontes, que iriam junto no jogo empacotado. | Removidos; `.gitignore` criado. De 35,9 MB em 177 arquivos para 20,7 MB em 137. |
| B8 | O nome do jogador não tinha limite de tamanho e aceitava `{ } [ ]`, que o Ren'Py lê como comando. A fonte dos nomes não tem acentos. Nome em branco virava "Mr.Fritas", que é o apelido do vidente. | Limite de 16 letras, sem `{ } [ ]`, acentos pela fonte reserva, nome em branco vira "Batata". |
| B9 | Créditos: 7 segundos de tela vazia antes do texto aparecer, versão errada do Ren'Py ("6.15.7.374"), texto branco ilegível sobre fundo claro, menu rápido e barra de vida por cima. | Rolagem sem tempo morto, versão automática, contorno escuro no texto, tela limpa. |

## Achados de gravidade média

| Nº | Problema | Conserto |
|---|---|---|
| C1 | Outras 7 falas com tags de texto fechadas fora de ordem (3) ou sem fechar (4). | Corrigidas. |
| C2 | Variáveis da luta em `init python` e sorteio pelo `random` do Python: voltar uma fala e avançar de novo mudava o resultado. | `default` e `renpy.random`. |
| C3 | `im.Scale` (obsoleto no Ren'Py 8) em 5 imagens. | `Transform`. |
| C4 | A tela de digitar o nome definia `xalign` e `xpos` juntos, que brigam entre si. | `xanchor`. |
| C5 | `bg carrotao.png` tem 1269×714 e deixava uma faixa preta na direita e embaixo. | Imagem ajustada à tela por código. |
| C6 | O sprite do cogumelo azul tinha riscos soltos no canto superior esquerdo, visíveis no jogo. | Riscos apagados (771 pixels). |
| C7 | A animação de ataque tem dois quadros, mas o primeiro era trocado antes de aparecer. | Pausa de 0,15 s entre os quadros. |
| C8 | O ícone tinha 401×701 e saía achatado. | Margem transparente; agora é quadrado. |
| C9 | A tela de preferências mostrava três volumes num jogo sem áudio. | Escondidos até existir áudio. |
| C10 | Código morto: tradução pela API antiga `library.translations`, tela `botaoMenu` sem uso, imagem dos créditos definida duas vezes (a primeira com uma fonte que não carregava). | Removido. |
| C11 | "Você perdeu -75 de vida": dois negativos. | "Você perdeu 75 de vida". |
| C12 | 39 erros de português no roteiro (acentos, concordância, digitação, ponto final). | Corrigidos em commit separado; lista em `REVISAO_DE_TEXTO.md`. |

## Em aberto: decisão sua

Sobraram dois pontos. Nenhum impede o jogo de funcionar.

- **D7. O repositório não tem licença.** Sem ela, ninguém tem permissão de usar o código ou a arte.
- **D10. `bg obrigado.jpg` tem 1280×960:** os 240 pixels de baixo ficam fora da tela.

## Pontos em aberto resolvidos em 16/11/2026

Você pediu estes nove. Cada um está num commit separado, fácil de desfazer. Entraram no `main` do
GitHub em 17/11/2026, pelo pull request 3.

| Ponto | O que era | O que foi feito |
|---|---|---|
| D2 | A DEATH CROW, só de maiúsculas enfeitadas, confundia o H com o N nos menus. | A interface passou para a Londrina Solid, de licença livre (OFL), com minúsculas e acentos. A DEATH CROW ficou só no título do menu principal, onde ainda se lê "TNE". |
| D3 | A batalha era sorte pura: 18,75% de vitória atacando sempre. | Antes de cada escolha, a pose do cogumelo e uma frase mostram o que ele vai fazer. Esquivar de um ataque deixa o cogumelo sem fôlego, e o golpe seguinte tira o dobro. "Não fazer nada" enquanto ele se esquiva recupera 25 de vida. |
| D4 | O jogo não tinha nenhum som. | Três músicas e nove efeitos provisórios, gerados por código (`ferramentas/gerar_audio.py`), e os controles de volume de volta nas preferências. |
| D5 | Roteiro num arquivo só, com comandos fora dos labels. | Quatro arquivos (`personagens.rpy`, `script.rpy`, `batalha.rpy`, `creditos.rpy`), com tudo dentro de labels. Nenhuma fala mudou. |
| D6 | Quatro nomes diferentes para o jogo. | The Super Potato no menu, na janela e na tela Sobre. O pacote sai como `TheSuperPotato`. |
| D8 | Nome do personagem, menu rápido e escolhas com pouco contraste. | Nomes em tons mais escuros das mesmas cores, menu rápido maior e escuro, e contorno no texto das escolhas para tapar os pontinhos do fundo. |
| D9 | Três fontes sem uso. | Tikiland, Sunshiny Italic e I Hate Comic Sans saíram do repositório. |
| D11 | Vida da batata: 100 ou 150? | Decisão sua: 100. |
| D12 | Nomes completos nos créditos. | Você liberou tirar: os créditos e a tela Sobre mostram só os primeiros nomes. |

Como cada um foi conferido:

- **D3.** As regras ficam numa função só, usada pela luta e por uma simulação. Em 10 mil lutas
  simuladas, quem lê as pistas vence todas, em 7 rodadas na média. Quem só ataca vence 18,7%, empata
  12,6% e perde 68,7%. Os três finais da luta continuam alcançáveis.
- **D5.** As 179 linhas com texto e as 471 linhas de código foram comparadas antes e depois: são as
  mesmas. Os 31 testes da época passaram sem nenhuma alteração.
- **D8.** Contraste medido contra o amarelo da caixa de fala: todos os nomes ficaram acima de 4,5
  para 1, e o menu rápido passou de 2 para 7. O texto da escolha com o mouse em cima virou branco,
  porque esse botão é verde-escuro e o preto não aparecia.
- **D2 e D8.** Conferidos em capturas de tela do menu, das preferências, de uma fala e das escolhas.
- **D4.** Os testes conferem que os 12 arquivos existem e que a história e a luta pedem cada uma a
  sua música. **Ninguém ouviu o resultado.** Os arquivos estão em `.wav` e somam 5 MB.

O que ficou de fora, para você saber:

- O repositório continua se chamando `Super-Potato`. Mudar isso é nas configurações do GitHub.
- A pasta dos saves continua `THEPOTATO-1535474925`, para ninguém perder o que já salvou.
- As falas usam cinza `#808080` sobre a caixa amarelo-clara, com contraste de 3,3 para 1. O recomendado
  para texto de leitura é 4,5. Não mexi, porque a cor está escrita em cada fala do roteiro.

## D1 resolvido em 17/11/2026: licença das fontes

A Sunshiny (nome dos personagens) era "grátis para uso pessoal" e pedia licença para uso comercial, e
a DEATH CROW (título) e a Soft Marshmallow (falas) estavam no repositório sem arquivo de licença.
Publicar o jogo com elas era um risco. As três saíram e entraram fontes de licença livre (SIL Open
Font License), escolhidas por serem parecidas com as antigas e terem os acentos do português:

| Uso | Antes | Agora |
|---|---|---|
| Falas | Soft Marshmallow | Itim |
| Nomes dos personagens | Sunshiny | Chelsea Market |
| Título do menu principal | DEATH CROW | Pirata One |
| Interface (desde o D2) | DEATH CROW | Londrina Solid |

Cada fonte tem o arquivo de licença ao lado, em `game/fonts`. Conferido em capturas de tela do
menu, das preferências, de uma fala, das escolhas, da luta e dos créditos.

## O que a auditoria não cobriu

- Celular, navegador, Mac e Linux. Tudo foi testado em Windows 10 com Ren'Py 8.5.3.
- Jogar com controle e com a leitura em voz alta.
- Desempenho em computador fraco.
- A qualidade da história em si. Só a ortografia foi revisada.
- O jogo rodando no Ren'Py 7.0 original. O alvo passou a ser o Ren'Py 8.5.

## Como repetir a verificação

Dê dois cliques em `testar.bat`. Ele roda o lint e os 42 testes. `testar.bat capturas` gera as capturas
de tela em `tests/screenshots`.

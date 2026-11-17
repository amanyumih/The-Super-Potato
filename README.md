# The Super Potato

Uma história com escolhas sobre a última batata de Potatoesvill, feita em [Ren'Py](https://www.renpy.org/).

As cenouras do clã Carrotao destruíram a cidade. Você é a batata que sobrou: foge pelo túnel secreto,
encontra o vidente Esfrishe e decide o que fazer com um cajado que solta faíscas. São 7 escolhas, 9 finais
e uma luta contra um cogumelo venenoso.

Versão atual: **0.4**. É a 0.2 de 2018 com os consertos da auditoria de novembro de 2026 e, desde
16/11/2026, com batalha em que dá para ler o inimigo, som provisório e interface mais legível.

## Como jogar

1. Baixe o SDK do Ren'Py 8.5 ou mais novo em <https://www.renpy.org/latest.html> e extraia.
2. Dê dois cliques em `jogar.bat`.

O `jogar.bat` procura o SDK em `%LOCALAPPDATA%\Programs`. Se o seu estiver em outro lugar, crie a variável
de ambiente `RENPY_SDK` com o caminho da pasta, ou abra o projeto pelo launcher do Ren'Py.

## Como testar

Dê dois cliques em `testar.bat`. Ele roda o lint do Ren'Py e 42 testes automatizados: o jogo abre,
todos os finais são alcançáveis, a batalha segue as regras, os sons existem e nenhum caminho trava.

`testar.bat capturas` gera capturas de tela em `tests/screenshots`, para conferir o visual.

## O que tem em cada pasta

| Caminho | O que é |
|---|---|
| `game/script.rpy` | A história, do começo aos finais |
| `game/personagens.rpy` | Quem fala, o nome do jogador e as imagens |
| `game/batalha.rpy` | A luta contra o cogumelo e as barras de vida |
| `game/creditos.rpy` | O agradecimento e os créditos |
| `game/som.rpy`, `game/audio` | Os nomes dos sons e os arquivos de música e efeitos |
| `game/screens.rpy` | As telas: menus, caixa de fala, escolhas, salvar e carregar |
| `game/gui.rpy` | Tamanhos, cores e fontes da interface |
| `game/options.rpy` | Nome, versão e o que entra no jogo empacotado |
| `game/tl/None/common.rpym` | Textos do próprio Ren'Py em português |
| `game/images`, `game/gui`, `game/fonts` | Arte, peças da interface e fontes |
| `game/testes` | Testes automatizados |
| `docs/AUDITORIA.md` | O que foi encontrado e consertado |
| `docs/roadmap.html` | O roadmap das fatias: o que vem depois |
| `prototipo/` | Protótipo do jogo de ação, para abrir no navegador |
| `ferramentas/gerar_audio.py` | O programa que gera a trilha e os efeitos provisórios |

## Para onde o jogo vai

A meta é transformar esta história num jogo de ação e aventura em 2D, com combate, exploração e
habilidades. A visual novel fica como o capítulo zero. O plano completo está em `docs/roadmap.html`,
publicado em <https://claude.ai/artifact/XXr7RPtG2T9fwztsYh8NVQ> (link privado da autora).

## Protótipo do jogo de ação

A pasta `prototipo/` tem uma fase curta para sentir o movimento e o combate: a batata corre, pula, dá
dash e bate com o cajado em cogumelos e em cenouras soldado, que atiram rodelas. Funciona no teclado,
no toque e no controle.

- Jogar: abra `prototipo/index.html` com dois cliques, ou use o link
  <https://claude.ai/artifact/WEow1m2sHgagqRMdTjhL2a> (privado da autora).
- Testar: abra `prototipo/index.html#teste`. Tem de aparecer `TODOS OS 23 TESTES PASSARAM`.
- Controles, tempos medidos e o que falta conferir: `prototipo/LEIA-ME.md`.

É um rascunho com arte provisória, feito para decidir o rumo. Não usa o Ren'Py e não entra no pacote
da visual novel.

## Créditos

O jogo foi feito em 2018 por quatro pessoas, que cuidaram da arte, do roteiro e da programação. Os
nomes aparecem nos créditos do jogo.

As quatro fontes em `game/fonts` são de licença livre (SIL Open Font License), e a licença de cada
uma está ao lado dela: Itim nas falas, Chelsea Market nos nomes, Londrina Solid na interface e
Pirata One no título.

A trilha e os efeitos sonoros são provisórios e foram gerados por `ferramentas/gerar_audio.py`, sem
gravação nem arquivo de terceiros.

# The Super Potato: regras para quem mexe no projeto

Visual novel em Ren'Py 8.5 (pasta `game/`), em português do Brasil. A meta de longo prazo é um jogo de
ação e aventura em 2D com a mesma história; o plano está em `docs/roadmap.html`.

## Comandos

- Jogar: `jogar.bat`
- Lint e testes: `testar.bat` (tem de terminar com `Status: PASSED` e o lint sem avisos)
- Capturas de tela para conferir o visual: `testar.bat capturas`, depois olhe `tests/screenshots`

O SDK fica em `%LOCALAPPDATA%\Programs\renpy-8.5.3-sdk`. Para rodar o Ren'Py pelo terminal:
`<sdk>\lib\py3-windows-x86_64\python.exe <sdk>\renpy.py <pasta do projeto> lint`

## Regras

1. Antes de dizer que algo está pronto, rode `testar.bat`. Mudou o visual? Gere as capturas e olhe.
   Se não rodou, diga que não rodou.
2. Todo conserto de defeito vem com um teste em `game/testes/testes.rpy` que falharia sem o conserto.
3. Texto que o jogador lê é em português, com acento. Nomes próprios da história não mudam:
   Potatoesvill, Carrotao, Esfrishe, Mr.Fritas.
4. Não reescreva falas da história sem pedir. Erro de digitação pode corrigir; estilo e sentido, não.
5. A arte em `game/images` e `game/gui` é da autora. Não redesenhe nem substitua sem pedir.
6. Nada de tags de texto (`{color}`, `{size}`) em `config.name` e `config.version`.
7. Variável que muda durante o jogo é declarada com `default`. Sorteio é pela função `sortear`.
8. Fontes: só entram fontes de licença livre que tenham os acentos do português, sempre com o arquivo
   de licença ao lado em `game/fonts`. Hoje são Itim (falas), Chelsea Market (nomes), Londrina Solid
   (interface) e Pirata One (título). Fonte nova entra pela função `fonte_com_reserva` em `gui.rpy`.
9. Arquivos gerados não entram no Git: `.rpyc`, `game/cache`, `game/saves`, `tests/screenshots`.
10. Trabalhe num ramo e descreva o commit em português, dizendo o que mudou e por quê.

## Como o jogo está montado

- `game/personagens.rpy`: quem fala, o nome do jogador e as imagens.
- `game/script.rpy`: a história. Cada trecho fica dentro de um label e nada roda fora deles.
- `game/batalha.rpy`: a luta, em `label batalha`, e as barras de vida.
- `game/creditos.rpy`: o agradecimento e os créditos. Todo final termina com `jump obrigado`.
- `game/som.rpy`: os nomes dos sons (`SOM_...`). O roteiro usa esses nomes, nunca o arquivo direto.

Cada rodada da batalha sorteia o que o cogumelo faz (1 esquiva, 2 ataca, 3 fica parado) antes de o menu
aparecer, e a pose e a frase da pista mostram o que vem. Esquivar de um ataque deixa o cogumelo sem
fôlego: a rodada seguinte é sempre 3 e o golpe tira o dobro. As regras ficam em `resolver_rodada`; a luta
e a simulação (`simular_lutas`) usam a mesma função, então não repita a conta em outro lugar. Os testes
fixam o sorteio com a variável `sorteio_forcado`.

A trilha e os efeitos são provisórios, gerados por `ferramentas/gerar_audio.py`. Ninguém ouviu ainda:
não diga que o som está bom.

## Protótipo do jogo de ação (pasta `prototipo/`)

Página de navegador sem dependências: canvas 2D e scripts comuns, sem etapa de build. Leia
`prototipo/LEIA-ME.md` antes de mexer.

- Jogar: abrir `prototipo/index.html`. Testar: abrir `prototipo/index.html#teste`, que tem de mostrar
  `TODOS OS 23 TESTES PASSARAM`. No console, `PB.debug.testar()` e `PB.debug.medir()`.
- Na história, a rodela é a arma que as cenouras atiram (as "rodelas cortadoras" do roteiro), como a
  bola de purê é a da batata. Não é um bicho e não tem vida. Correção da autora em 16/11/2026.
- Todo número de sensação e o desenho da fase ficam em `prototipo/js/ajuste.js`. Mudou um número?
  Rode os testes: o robô acusa pulo que ficou impossível. Atualize a tabela do `LEIA-ME.md` com o que
  `PB.debug.medir()` devolver.
- Regra nova no jogo ou defeito consertado ganha um teste em `prototipo/js/testes.js`.
- Todo ataque de inimigo avisa antes, por pelo menos 0,3 s.
- Ao servir a pasta por um servidor local, o navegador guarda os `.js` antigos. Recarregue sem cache
  (Ctrl+F5) antes de concluir que uma mudança não funcionou.
- Publicado em <https://claude.ai/artifact/WEow1m2sHgagqRMdTjhL2a>. Para republicar no mesmo link:
  `file_path` = `prototipo/index.html`, `root` = `prototipo`, `files` com os sete arquivos de
  `prototipo/js`, e `url` igual ao link.
- É rascunho. O jogo de verdade nasce na fatia SIS-ENG-001, no motor escolhido, e não reaproveita
  este código; reaproveita os números.

## Ao terminar uma fatia do roadmap

Relatório curto: arquivos alterados, comandos rodados e o resultado, prova de cada critério de conclusão e
o que não foi verificado. Depois atualize o estado da fatia e o histórico em `docs/roadmap.html` (os dados
ficam no bloco de script do fim do arquivo) e republique a página no mesmo link, junto com as imagens de
`docs/img`: <https://claude.ai/artifact/XXr7RPtG2T9fwztsYh8NVQ>.

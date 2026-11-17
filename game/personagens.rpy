## The Super Potato - personagens e imagens
##
## Quem fala na história, o nome do jogador e as imagens que precisam de ajuste.
## A história fica em script.rpy, a luta em batalha.rpy e o fim em creditos.rpy.

## Nome do jogador. Este valor vale até ele escolher o seu, no começo da história.
default namae = "Batata"

## Personagens
## A cor é a do nome, que aparece em cima da caixa de fala amarelo-clara.
## São as cores de sempre, mais escuras: todas têm contraste acima de 4,5 para 1.
define n = Character("Narrador", image="narrador", color ="3F5F8F")
define m = Character("Desconhecido", image="desconhecido", color ="5A5A5A")
define p = Character ("[namae]", image="potato", color = "0A6B66")
define e = Character("Esfrishe", image="vidente", color ="0A6B66")
define cz = Character("Cogumelo azul", image="cogumelo", color ="8A2FB0")
define ca = Character("Cogumelo vermelho", color="B01030")

## Imagens ao lado da caixa de falas
image side narrador = Transform("images/narrador.png", xsize=318, ysize=556, xoffset=-30, yoffset=175)
image side potato = Transform("images/potato corada.png", xsize=318, ysize=556, xoffset=-30, yoffset=175)
image side vidente = Transform("images/vidente.png", xsize=318, ysize=556, xoffset=-75, yoffset=175)
image side desconhecido = Transform("images/desconhecido.png", xsize=318, ysize=556, xoffset=-30, yoffset=175)
image side cogumelo = Transform("images/cogumelo azul.png", xsize=285, ysize=350, xoffset=-60, yoffset=50)

## Este fundo foi salvo com 1269x714 e deixava uma faixa preta na direita e embaixo.
## Aqui ele é esticado (menos de 1%) para cobrir a tela de 1280x720.
image bg carrotao = Transform("images/bg carrotao.png", xsize=1280, ysize=720)

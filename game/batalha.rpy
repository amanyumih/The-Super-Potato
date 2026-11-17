## The Super Potato - a batalha contra o cogumelo
##
## Aqui ficam as regras da luta, o label batalha e as barras de vida.
## A história chega aqui por "jump batalha", no fim do label treinamento.
##
## Como a luta funciona:
##   A cada rodada o cogumelo se esquiva, ataca ou fica parado. Antes de o
##   jogador escolher, a pose do cogumelo e uma frase entregam o que vem aí.
##   Cada escolha é a resposta certa para uma coisa:
##     ele vai atacar        -> Esquiva: ele erra e fica sem fôlego
##     ele está parado       -> Atacar: o golpe acerta (em dobro, se ele estiver sem fôlego)
##     ele vai se esquivar   -> Não fazer nada: a batata respira e recupera vida
##   Quem ataca sem olhar acaba trocando golpes e perde quase sempre.

## ---------------------------------------------------------------------------
## Sistema de vida e de luta
## ---------------------------------------------------------------------------

## Vida máxima de cada lutador e dano de cada golpe (não mudam durante o jogo).
## O cogumelo tem "mais que o dobro" da vida da batata, como o Esfrishe avisa.
define VIDA_BATATA_MAX = 100
define VIDA_COGUMELO_MAX = 250
define DANO_NA_BATATA = 75
define DANO_NO_COGUMELO = 50
## Golpe certeiro: acertar o cogumelo enquanto ele está sem fôlego tira o dobro.
define DANO_CERTEIRO = 100
## Quanto a batata recupera ao respirar enquanto o cogumelo se esquiva à toa.
define VIDA_RECUPERADA = 25

## Vida atual. Com "default" o valor entra nos saves e volta ao normal a cada novo jogo.
default vidaB = VIDA_BATATA_MAX
default vidaI = VIDA_COGUMELO_MAX

## O que o cogumelo fez na rodada: o número sorteado e o texto que aparece na tela.
default sorteio = 0
default mao = ""

## A pista da rodada: a frase que descreve a pose do cogumelo antes de ele agir.
default pista = ""

## O cogumelo fica sem fôlego na rodada seguinte a um ataque que a batata esquivou.
default sem_folego = False

## Resultado da rodada, calculado por resolver_rodada.
default dano_batata = 0
default dano_cogumelo = 0
default cura = 0
default proximo_sem_folego = False

## Sistema de xingamento: o comentário do Esfrishe na rodada.
default frase = 0
default fr = ""

## Só para os testes automatizados: quando não é None, todo sorteio devolve
## este valor. No jogo normal fica sempre None.
default sorteio_forcado = None

init python:
    def sortear(minimo, maximo):
        """
        Sorteia um número inteiro entre minimo e maximo (os dois incluídos).
        Usa renpy.random para o resultado não mudar quando o jogador volta
        uma fala (rollback) e avança de novo.
        """
        if store.sorteio_forcado is not None:
            return store.sorteio_forcado
        return renpy.random.randint(minimo, maximo)

    def resolver_rodada(acao, escolha, sem_folego=False):
        """
        As regras de uma rodada, num lugar só. A luta e a simulação usam esta função.

        acao: o que o cogumelo faz (1 = esquiva, 2 = ataca, 3 = fica parado).
        escolha: o que o jogador escolheu ("atacar", "esquiva" ou "nada").
        sem_folego: o cogumelo está sem fôlego nesta rodada.

        Devolve (dano na batata, dano no cogumelo, vida recuperada pela batata,
        cogumelo sem fôlego na próxima rodada).
        """
        dano_b = dano_c = recupera = 0
        proximo = False
        if escolha == "atacar":
            if acao == 2:
                dano_b = DANO_NA_BATATA
                dano_c = DANO_NO_COGUMELO
            elif acao == 3:
                dano_c = DANO_CERTEIRO if sem_folego else DANO_NO_COGUMELO
        elif escolha == "esquiva":
            if acao == 2:
                proximo = True
        else:
            if acao == 2:
                dano_b = DANO_NA_BATATA
            elif acao == 1:
                recupera = VIDA_RECUPERADA
        return dano_b, dano_c, recupera, proximo

    ## As frases que descrevem a pose do cogumelo. A chave é o que ele vai fazer;
    ## 0 é o cogumelo sem fôlego. Há mais de uma por pose para a luta não ficar repetida.
    PISTAS = {
        1: ["O cogumelo dobra o caule e balança de um lado para o outro, pronto para saltar.",
            "O cogumelo fica na ponta do caule, olhando para os lados."],
        2: ["O chapéu do cogumelo incha e solta um fio de fumaça roxa.",
            "O cogumelo estufa o chapéu e aponta os punhos para você."],
        3: ["O cogumelo boceja e fica olhando para o nada.",
            "O cogumelo coça o chapéu, distraído."],
        0: ["O cogumelo ainda tosse a própria fumaça, sem fôlego."],
    }

    def pistas_possiveis(acao, sem_folego=False):
        return ["{color=808080}" + frase_da_pose + "{/color}" for frase_da_pose in PISTAS[0 if sem_folego else acao]]

    def pista_da_rodada(acao, sem_folego=False):
        return renpy.random.choice(pistas_possiveis(acao, sem_folego))

    ## Dois jeitos de jogar, para a simulação: quem lê a pista e quem só ataca.
    def politica_leitora(acao, sem_folego):
        return {1: "nada", 2: "esquiva", 3: "atacar"}[acao]

    def politica_so_ataca(acao, sem_folego):
        return "atacar"

    def simular_lutas(politica, quantas=10000, semente=2018):
        """
        Joga lutas inteiras só com as regras, sem tela, para medir as chances.
        politica(acao, sem_folego) devolve a escolha do jogador em cada rodada.
        Devolve quantas vitórias, derrotas e empates aconteceram e a média de rodadas.
        """
        import random
        dado = random.Random(semente)
        conta = {"vitoria": 0, "derrota": 0, "empate": 0, "rodadas": 0.0}
        for luta in range(quantas):
            batata, cogumelo, cansado = VIDA_BATATA_MAX, VIDA_COGUMELO_MAX, False
            while batata > 0 and cogumelo > 0:
                acao = 3 if cansado else dado.randint(1, 3)
                dano_b, dano_c, recupera, cansado = resolver_rodada(acao, politica(acao, cansado), cansado)
                batata = min(VIDA_BATATA_MAX, batata + recupera) - dano_b
                cogumelo -= dano_c
                conta["rodadas"] += 1
            if batata > 0:
                conta["vitoria"] += 1
            elif cogumelo <= 0:
                conta["empate"] += 1
            else:
                conta["derrota"] += 1
        conta["rodadas"] /= quantas
        return conta


## ---------------------------------------------------------------------------
## Poses do cogumelo: a pista visual do que ele vai fazer
## ---------------------------------------------------------------------------
## Todas ficam no centro, de pé no chão. cogumelo_normal desfaz qualquer pose.

transform cogumelo_normal:
    xalign 0.5 yalign 1.0 xoffset 0 yoffset 0 zoom 1.0

## Vai se esquivar: balança de um lado para o outro.
transform pose_esquiva:
    xalign 0.5 yalign 1.0 xoffset 0 yoffset 0 zoom 1.0
    block:
        ease 0.3 xoffset 36
        ease 0.3 xoffset -36
        repeat

## Vai atacar: incha e treme.
transform pose_ataque:
    xalign 0.5 yalign 1.0 xoffset 0 yoffset 0 zoom 1.0
    ease 0.25 zoom 1.08
    block:
        linear 0.05 xoffset 5
        linear 0.05 xoffset -5
        repeat

## Vai ficar parado: respira devagar.
transform pose_parado:
    xalign 0.5 yalign 1.0 xoffset 0 yoffset 0 zoom 1.0
    block:
        ease 1.4 yoffset 8
        ease 1.4 yoffset 0
        repeat

## Sem fôlego: murcho, ofegante.
transform pose_sem_folego:
    xalign 0.5 yalign 1.0 xoffset 0 yoffset 0 zoom 1.0
    ease 0.3 yoffset 26 zoom 0.94
    block:
        ease 0.5 yoffset 32
        ease 0.5 yoffset 26
        repeat


label batalha:
    ## Toda luta começa com a vida cheia, o cogumelo descansado e as barras de vida na tela.
    $ vidaB = VIDA_BATATA_MAX
    $ vidaI = VIDA_COGUMELO_MAX
    $ sem_folego = False
    show screen barras_de_vida
    play music SOM_BATALHA fadein 0.5

    "{color=808080}O cogumelo te encara, planejando alguma ação, você tem algumas opções.{/color}"
    "{color=808080}Repare nele antes de escolher: o corpo do cogumelo entrega o que ele vai fazer.{/color}"

    ## A luta dura enquanto OS DOIS estiverem de pé.
    ## (Antes a condição usava "or": a luta só acabava quando os dois morriam,
    ## então era impossível vencer.)
    while vidaB > 0 and vidaI > 0:

        ## Comentário do Esfrishe nesta rodada.
        $ frase = sortear(1, 5)

        if frase == 1:
            $ fr = "{color=808080}... (idiotas){/color}"
        elif frase == 2:
            $ fr = "{color=808080}... (Não sabem lutar?){/color}"
        elif frase == 3:
            $ fr = "{color=808080}... (Daqui a pouco eu mesmo mato esse...){/color}"
        elif frase == 4:
            $ fr = "{color=808080}... (Parecem dois patetas que não sabem atacar, cheios de medo.){/color}"
        else:
            $ fr = "{color=808080}... (Misericórdia){/color}"

        ## O que o cogumelo faz nesta rodada: 1 = esquiva, 2 = ataca, 3 = fica parado.
        ## Sem fôlego, ele não consegue fazer nada, saia o que sair no sorteio.
        if sem_folego:
            $ sorteio = 3
        else:
            $ sorteio = sortear(1, 3)

        if sorteio == 1:
            $ mao = "{color=8B0000}se esquivou{/color}"
        elif sorteio == 2:
            $ mao = "{color=8B0000}te atacou{/color}"
        else:
            $ mao = "{color=8B0000}não fez nada{/color}"

        ## A pista: antes de o jogador escolher, a pose e uma frase mostram o que vem aí.
        $ pista = pista_da_rodada(sorteio, sem_folego)
        if sem_folego:
            show cogumelo azul at pose_sem_folego
        elif sorteio == 1:
            show cogumelo azul at pose_esquiva
        elif sorteio == 2:
            show cogumelo azul at pose_ataque
        else:
            show cogumelo azul at pose_parado

        menu:
            ## A frase da pista fica na tela enquanto o jogador escolhe.
            "[pista]"

            "Esquiva":
                $ dano_batata, dano_cogumelo, cura, proximo_sem_folego = resolver_rodada(sorteio, "esquiva", sem_folego)
                show cogumelo azul at cogumelo_normal

                "{color=DA70D6}Cogumelo{/color} [mao]"
                if sorteio == 1:
                    scene bg casa do vidente
                    show cogumelo azul at center
                    show cogumelo azul at right with moveinleft
                    e "[fr]"
                elif sorteio == 2:
                    scene bg casa do vidente
                    show cogumelo azul at center
                    show cogumelo azul at left with moveinleft
                    play sound SOM_FUMACA
                    show fumaca at center
                    show fumaca at left with moveinleft
                    centered  "{color=FF0000}{size=+25} MISS {/size}{/color}"
                    scene bg casa do vidente
                    ## Esquivar do ataque abre a guarda dele para a próxima rodada.
                    "{color=808080}O cogumelo errou o bote e ficou sem fôlego. É a sua chance!{/color}"
                else:
                    show cogumelo vermelho with dissolve
                    ca "{color=808080}Hehe... Poderia ter atacado, neném :P{/color}"

            "Atacar":
                $ dano_batata, dano_cogumelo, cura, proximo_sem_folego = resolver_rodada(sorteio, "atacar", sem_folego)
                show cogumelo azul at cogumelo_normal

                "{color=DA70D6}Cogumelo{/color} [mao]"
                if sorteio == 1:
                    ## O cogumelo se esquiva: o golpe passa no vazio.
                    scene bg casa do vidente
                    show cogumelo azul at center
                    show cogumelo azul at right with moveinleft

                    show ataque b
                    pause 0.15
                    scene bg casa do vidente
                    show cogumelo azul at right
                    show ataque b2
                    play sound SOM_ERRO
                    pause (1)
                    scene bg casa do vidente
                    centered  "{color=FF0000}{size=+25} MISS {/size}{/color}"

                elif sorteio == 2:
                    ## Os dois se acertam.
                    $ vidaB -= dano_batata
                    $ vidaI -= dano_cogumelo
                    play sound SOM_GOLPE

                    show ataque b
                    pause 0.15
                    scene bg casa do vidente
                    show cogumelo azul
                    show ataque b2
                    with vpunch
                    with vpunch
                    with vpunch
                    scene bg casa do vidente
                    show cogumelo azul
                    centered  "{color=FF0000}{size=+25} -[DANO_NO_COGUMELO] {/size}{/color}"
                    play sound SOM_DANO
                    show fumaca with vpunch
                    with vpunch
                    with vpunch
                    "{color=FF0000}{size=+25} Você perdeu [DANO_NA_BATATA] de vida{/size}{/color}"
                    scene bg casa do vidente
                else:
                    ## Só a batata acerta. Com o cogumelo sem fôlego, o golpe é certeiro e tira o dobro.
                    $ vidaI -= dano_cogumelo
                    if sem_folego:
                        play sound SOM_CERTEIRO
                    else:
                        play sound SOM_GOLPE

                    show ataque b
                    pause 0.15
                    scene bg casa do vidente
                    show cogumelo azul
                    show ataque b2
                    with vpunch
                    with vpunch
                    with vpunch
                    scene bg casa do vidente
                    show cogumelo azul
                    if sem_folego:
                        centered "{color=FF0000}{size=+25} GOLPE CERTEIRO! -[DANO_CERTEIRO] {/size}{/color}"
                    else:
                        centered "{color=FF0000}{size=+25} -[DANO_NO_COGUMELO] {/size}{/color}"


            "Não fazer nada":
                $ dano_batata, dano_cogumelo, cura, proximo_sem_folego = resolver_rodada(sorteio, "nada", sem_folego)
                show cogumelo azul at cogumelo_normal

                "{color=DA70D6}Cogumelo {/color}[mao]"
                if sorteio == 1:
                    cz "{color=808080}Muito bem pensado... (droga!){/color}"
                    ## Enquanto ele pula à toa, a batata respira e recupera um pouco de vida.
                    if vidaB < VIDA_BATATA_MAX:
                        $ vidaB = min(VIDA_BATATA_MAX, vidaB + cura)
                        play sound SOM_CURA
                        n "{color=2E8B57}{size=+20} Você recuperou [VIDA_RECUPERADA] de vida{/size}{/color}"
                elif sorteio == 2:
                    cz "{color=DC143C}{size=+30}TOMA ESSA!!!{/size}{/color}"
                    $ vidaB -= dano_batata
                    play sound SOM_DANO
                    show fumaca with vpunch
                    with vpunch
                    with hpunch
                    n "{color=FF0000}{size=+20} Você perdeu [DANO_NA_BATATA] de vida{/size}{/color}"
                    scene bg casa do vidente
                else:
                    cz "{color=F08080}Hehe... Fez purê nas calças?{/color}"

        ## O cogumelo só fica sem fôlego na rodada seguinte a um ataque esquivado.
        $ sem_folego = proximo_sem_folego

    ## Fim da luta: as barras saem da tela e o resultado decide o final.
    hide screen barras_de_vida
    stop music fadeout 1.5

    if vidaB <= 0 and vidaI > 0:
        ## Só a batata caiu.
        play sound SOM_DERROTA
        "{color=808080}Quando você estava prestes a morrer, alguém te empurra penhasco abaixo.{/color}"
        scene bg em pedacos with hpunch
        with hpunch
        with vpunch
        with vpunch
        "{size=+30}{color=483D8B}Final trágico{/color}{/size}"
        jump obrigado

    elif vidaI <= 0 and vidaB > 0:
        ## Só o cogumelo caiu: vitória.
        scene bg casa do vidente
        play sound SOM_VITORIA
        "{color=DC143C}Você ganhou o combate!!{/color}"
        n "Você observa o cogumelo virar fumaça enquanto o senhor Esfrishe se aproxima de você."
        e "Muito bem, você é realmente quem eu esperava que fosse, fico feliz em conhecê-lo finalmente."
        e "Espero que possamos nos dar bem a partir de agora, estou orgulhoso."
        n "Esfrishe aproxima a mão da sua cabeça, fazendo cafuné."
        scene bg final feliz with dissolve
        "{color=F0E68C}{size=+30}Final Feliz{/size}{/color}"
        jump obrigado

    else:
        ## Os dois caíram no mesmo golpe.
        play sound SOM_DERROTA
        "{color=808080}Vocês dois se esforçaram tanto para ganhar que acabaram morrendo juntos.{/color}"
        "{color=00008B}Final do esforço implacável!{/color}"
        jump obrigado


## ---------------------------------------------------------------------------
## Barras de vida da batalha
## ---------------------------------------------------------------------------
##
## Uma barra para a batata e outra para o cogumelo. A tela lê vidaB e vidaI
## sozinha: basta mudar as variáveis que as barras acompanham.
##
## Para mostrar:  show screen barras_de_vida
## Para esconder: hide screen barras_de_vida

screen barras_de_vida():
    zorder 50

    frame:
        style "vida_moldura"

        vbox:
            spacing 8

            hbox:
                spacing 10
                text "[namae]" style "vida_nome"
                bar value AnimatedValue(max(vidaB, 0), VIDA_BATATA_MAX, 0.4) style "vida_barra"
                text "%d/%d" % (max(vidaB, 0), VIDA_BATATA_MAX) style "vida_numero"

            hbox:
                spacing 10
                text "Cogumelo" style "vida_nome"
                bar value AnimatedValue(max(vidaI, 0), VIDA_COGUMELO_MAX, 0.4) style "vida_barra"
                text "%d/%d" % (max(vidaI, 0), VIDA_COGUMELO_MAX) style "vida_numero"

style vida_moldura:
    xpos 16
    ypos 16
    padding (14, 10, 14, 10)
    background Solid("#000000c0")

style vida_nome:
    size 20
    color "#ffffff"
    min_width 170
    yalign 0.5

style vida_numero:
    size 18
    color "#ffffff"
    min_width 80
    yalign 0.5

style vida_barra:
    xsize 220
    ysize 16
    yalign 0.5
    left_bar Frame("images/bottom.png", 4, 4)
    right_bar Frame("images/top.png", 4, 4)
    thumb None

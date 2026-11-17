## The Super Potato - a história
##
## Como o jogo está dividido:
##   personagens.rpy  quem fala, o nome do jogador e as imagens
##   script.rpy       a história, do começo aos finais (este arquivo)
##   batalha.rpy      a luta contra o cogumelo e as barras de vida
##   creditos.rpy     o agradecimento e os créditos
##
## Cada trecho da história fica dentro de um label e nada roda fora deles.
## Para seguir a ordem, leia o label de cima para baixo e acompanhe os "jump".
##
## Os textos da interface (menus e botões) ficam em screens.rpy e em
## tl/None/common.rpym.


label start:


    play music SOM_HISTORIA fadein 2.0
    scene bg potatoesvill with fade


    n "{cps=20} {color=808080}Numa era muito distante ou nem tanto assim, existia uma cidade chamada Potatoesvill.{/color}{/cps}"
    n "{cps=20}{color=808080}Essa cidade estava habitada de BATATAS que viviam felizes com suas famílias e amigos, desenvolvendo sua tecnologia precária.{/color}{/cps}"

    scene bg carrotao with fade

    n "{cps=20}{color=808080}Entretanto, certo dia, surgiu o clã Carrotao, nele viviam CENOURINHAS invejosas com o desejo de conquistar as batatas.{/color}{/cps}"
    n "{cps=20}{color=808080}Pelo simples fato de as cenouras invejarem as sardas das batatas, declararam guerra contra Potatoesvill.{/color}{/cps}"

    scene bg potatodestruida with vpunch
    scene bg potatodestruida with vpunch
    scene bg potatodestruida with vpunch

    show rodela voadora at right with moveinleft
    show rodela voadora at center with moveinleft
    show rodela voadora at left with moveinleft
    scene bg potatodestruida with dissolve

    n "{cps=20}{color=808080}Em questão de dias, o exército de cenouras estava atacando, trazendo muitas rodelas cortadoras, restando apenas cascas, sucos e pedaços espalhados no campo.{/color}{/cps}"
    show batata attake at left with moveinright
    show bola de pure at center with moveinleft
    show cenoura at right with moveinright

    n "{cps=20}{color=808080}Mesmo assim, as BATATAS lutaram com bravura e coragem, utilizando o único recurso que tinham, batata amassada quente.{/color}{/cps}"
    scene bg potatodestruida with dissolve

    n "{cps=20}{color=808080}Mesmo causando queimaduras leves nas cenouras, nenhuma desistiu e continuaram cortando todas as batatas ao meio.{/color}{/cps}"

    show rodela voadora at right with moveinright
    show batata attake at center
    show rodela voadora at center with moveinright
    show batata partida2 at center
    show rodela voadora at left with moveinright
    scene bg potatodestruida with dissolve


    n "{cps=20}{color=808080}Após meses, todas as batatas foram derrotadas, espalhadas no campo.{/color}{/cps}"


    scene bg cenouras partindo with vpunch


    n "{cps=20}{color=808080}Mesmo após tanto sofrimento, a tribo Carrotao partiu deixando tudo em pedaços, levando apenas as cascas dos mortos.{/color}{/cps}"

    scene bg potato with fade
    show potato corada with dissolve

    n "{cps=20}{color=808080}Felizmente, uma pequena, indefesa e inocente batata sobreviveu.{/color}{/cps}"


    python:
        ## length limita o tamanho do nome; exclude barra os caracteres que o
        ## Ren'Py lê como comando dentro de um texto ({ } e [ ]) e que travavam o jogo.
        namae = renpy.input ("{cps=20}{color=808080}Escolha seu nome, jogador:{/color}{/cps}", length=16, exclude="{}[]")
        namae = namae.strip ()
        if not namae:
            namae = "Batata"

    n "{cps=20}{color=808080}[namae]! Você é o sobrevivente!{/color}{/cps}"


    scene bg fuga with fade

    n "{cps=20}{color=808080}Você foi orientado com relutância pelos seus pais para fugir pelo túnel secreto da cidade de Potatoesvill, por causa de um vidente que avisou a todos.{/color}{/cps}"
    n "{cps=20}{color=808080}Entretanto, ninguém acreditou nele, tiraram sarro, vaiaram e o xingaram.{/color}{/cps}"
    n "{cps=20}{color=808080}Apenas pela crença da extinção das cenouras.{/color}{/cps}"
    n "{cps=20}{color=808080}Resultando na morte de milhares, pagaram os preconceitos com suas vidas.{/color}{/cps}"
    n "{cps=20}{color=808080}[namae] segue o túnel secreto encontrando uma floresta.{/color}{/cps}"
    n "{cps=20}{color=808080}Após caminhar por alguns minutos, uma cortina de musgos e cipós lhe parece suspeita.{/color}{/cps}"
    n "{cps=20}{color=808080}Assim que você atravessa a cortina.{/color}{/cps}"

    scene bg casa do vidente with slideleft

    n "{cps=20}{color=808080}Descobre uma caverna antiga localizada na ponta de um penhasco. {/color}{/cps}"
    show vidente lendo with dissolve
    n "{cps=20}{color=808080}Próximo à caverna há uma batata velha lendo um velho livro gigante.{/color}{/cps}"
    n "{cps=20}{color=808080}Assim que você o observa, a Batata velha fecha o livro o encarando momentaneamente.{/color}{/cps}"
    show vidente with vpunch
    m "{cps=20}{color=808080}Você finalmente chegou, pequeno, estava lhe esperando.{/color}{/cps}"
    p "{cps=20}{color=808080}Quem é você?{/color}{/cps}"
    m "{cps=20}{color=808080}Logo saberás, pequeno [namae].{/color}{/cps}"

    scene bg casa do vidente with dissolve
    show cajado with vpunch

    n "{cps=20}{color=808080}A batata desaparece diante de seus olhos, deixando para trás um cajado que emana muito poder.{/color}{/cps}"
    "{cps=20}{color=808080}Qual sua ação?{/color}{/cps}"

    menu:
        "Pegar o cajado":
            jump cajado
        "Voltar para salvar seus pais":
            jump guerra
        "Entrar na caverna":
            scene bg caverna vidente dentro with dissolve
            n "{color=808080}[namae] entrou na caverna meio vazia e estratégica para observar os arredores.{/color}"
            n "{color=808080}Há uma coleção de cajados num baú.{/color}"
            n "{color=808080}Repentinamente uma fumaça tromba em suas costas.{/color}"
            jump treinamento


label cajado:
    n "{cps=20}{color=808080}Você se aproxima do cajado com passos cautelosos.{/color}{/cps}"
    show cajado with vpunch
    n "{cps=20}{color=808080}Conforme mais próximo você ficava, mais faíscas ele soltava.{/color}{/cps}"
    n "{cps=20}{color=808080}Um enorme e irresistível desejo de tocá-lo surge em você.{/color}{/cps}"
    n "{cps=20}{color=808080}Repentinamente os ventos se tornam turbulentos, as nuvens se dissipam aos céus.{/color}{/cps}"
    n "{cps=20}{color=808080}Quando finalmente tocou no cajado...{/color}{/cps}"

    scene bg penhasco with vpunch
    scene bg penhasco with vpunch

    n "{cps=20}{color=808080}Uma barreira o impulsionou para longe o derrubando para a beira do penhasco.{/color}{/cps}"
    n "{cps=20}{color=808080}A única alternativa foi agarrar a ponta do penhasco quebradiço.{/color}{/cps}"
    n "{cps=20}{color=808080}Seus braços estão cansados e suas forças estão acabando.{/color}{/cps}"

    menu:
        "Desistir":
            n "{cps=20}{color=808080}Você solta a beira do penhasco e começa a observar a beirada diminuindo cada vez mais rápido, antes que pudesse pensar em algo, seu corpo se dividiu em vários pedaços.{/color}{/cps}"

            scene bg em pedacos with vpunch
            scene bg em pedacos with vpunch
            scene bg em pedacos with vpunch
            scene bg em pedacos with hpunch
            scene bg em pedacos with vpunch
            scene bg em pedacos with hpunch

            n "{color=808080}Você virou pedaços de batata.{/color}"
            centered "{cps=10}{color=000000}{size=+30}Final ruim 1{/size}{/color}{/cps}"
            jump obrigado

        "Lutar pela vida":
            n "{cps=20}{color=808080}Você se segura o máximo que pode com as suas duas raízes, mas aos poucos a ponta do penhasco começa a rachar.{/color}{/cps}"
            "{cps=20}{color=808080}Você precisa escolher para onde você irá.{/color}{/cps}"

    menu:
        "Usar todas as suas forças para voltar à terra":
            jump subir
        "Segurar em outra parte do penhasco, mesmo longe e estreita...":
            n "{cps=20}{color=808080}Na tentativa de segurar em outro ponto a terra se rompe fazendo-o cair.{/color}{/cps}"
            n "{cps=20}{color=808080}O vento era violento, observar a caverna que parecia ser tão grande diminuir rapidamente era assustador.{/color}{/cps}"
            n "{cps=20}{color=808080}Em questão de segundos você não enxergava mais o penhasco em que estava.{/color}{/cps}"

            scene bg black com tracos with dissolve
            n "{cps=20}{color=808080}A última coisa que fez foi fechar os olhos lamentando por seus pais.{/color}{/cps}"

            scene bg em pedacos with vpunch
            scene bg em pedacos with vpunch
            scene bg em pedacos with vpunch
            scene bg em pedacos with hpunch
            scene bg em pedacos with vpunch
            scene bg em pedacos with hpunch

            n "{color=000000}Você virou pedaços de batata.{/color}"
            centered "{size=+30}{cps=20}{color=808080}Final ruim 2{/color}{/cps}{/size}"
            jump obrigado


label subir:
    n "{cps=20}{color=808080}Você impulsiona seu corpo com os braços para subir, mas como esperado a terra se rompe.{/color}{/cps}"
    show vidente with dissolve
    n "{cps=20}{color=808080}Pensando nos seus últimos momentos, aquela batata velha segura seu braço emanando uma aura poderosa.{/color}{/cps}"
    m "{cps=20}{color=808080}Prometa que nunca mais irá fazer isso.{/color}{/cps}"

    menu:
        "Prometer":
            jump prometer

        "Mandar ele ir catar coquinho":
            n "{cps=20}{color=808080}Ele te observa com desaprovação por alguns instantes.{/color}{/cps}"
            m "{cps=20}{color=808080}Você não é quem eu pensei que fosse...{/color}{/cps}"
            n "{cps=20}{color=808080}Ele solta seu braço o jogando penhasco abaixo.{/color}{/cps}"
            n "{cps=20}{color=808080}Antes que percebesse a caverna enorme estava minúscula, e em um piscar de olhos não havia como enxergá-la, e em outro, suas costas se espatifam no chão.{/color}{/cps}"

            scene bg em pedacos with vpunch
            scene bg em pedacos with vpunch
            scene bg em pedacos with vpunch
            scene bg em pedacos with hpunch
            scene bg em pedacos with hpunch
            scene bg em pedacos with hpunch


            n "{color=808080}Você virou pedaços de purê.{/color}"
            centered "{color=000000}{cps=20}{size=+30}Final batata traidora.{/size}{/cps}{/color}"
            jump obrigado


label prometer:
    n "{cps=20}{color=808080}Você promete que nunca mais se aproximará do cajado.{/color}{/cps}"
    scene bg casa do vidente with fade
    show vidente with dissolve
    n "{cps=20}{color=808080}Em um instante você já estava no chão ao lado do vidente.{/color}{/cps}"
    jump treinamento


label treinamento:
    show vidente with dissolve
    m "{cps=20}{color=808080}Pequeno [namae], eu sei que está perdido, já passei por isso...{/color}{/cps}"
    m "{cps=20}{color=808080}Eu sou Esfrishe, mas pode me chamar de Mr.Fritas, sou o vidente em quem sua família confiou.{/color}{/cps}"
    n "{cps=20}{color=808080}O Mr.Fritas entra na caverna pegando um dos seus suportes de madeira.{/color}{/cps}"
    e "{cps=20}{color=808080}Agora é hora do treinamento intensivo! Venha.{/color}{/cps}"
    n "{cps=20}{color=808080}Mr.Fritas o guia para o exterior da caverna jogando um cajado em você.{/color}{/cps}"
    scene bg casa do vidente with vpunch
    show cogumelo azul with dissolve
    n "{cps=20}{color=808080}Quando você menos espera, Esfrishe invoca um cogumelo.{/color}{/cps}"
    e "{cps=20}{color=808080}Tenha cuidado, ele é venenoso e possui mais que o dobro da sua vida.{/color}{/cps}"

    menu:
        "Fugir":
            scene bg black com tracos with fade
            play sound SOM_FUMACA
            show fumaca
            n "{cps=20}{color=808080}No momento em que você vira as costas para o inimigo, uma fumaça roxa deixa sua visão borrada.{/color}{/cps}"
            ## Mostra as barras com a vida cheia e só então zera, para a barra descer na tela.
            show screen barras_de_vida
            with Dissolve(0.3)
            $ vidaB = 0
            centered "{size=+30}{color=C71585}{cps=35}Você morreu asfixiado{/cps}{/color}{/size}"
            hide screen barras_de_vida
            jump obrigado

        "Enfrentar":
            jump batalha


label guerra:
    scene bg floresta dia
    n "{cps=20}{color=808080}Você corre para a floresta novamente, tentando se lembrar de onde veio, mas acaba se perdendo no caminho.{/color}{/cps}"
    scene bg floresta noite with fade
    n "{cps=20}{color=808080}Começou a escurecer, alguns sons de predadores surgiam.{/color}{/cps}"
    n "{cps=20}{color=808080}O primeiro um pouco mais distante, parecia sons de pegadas de gigantes.{/color}{/cps}"
    n "{cps=20}{color=808080}O segundo parecia um zumbido robótico.{/color}{/cps}"

    menu:
        "Correr":
            jump correr

        "Ficar em silêncio":
            jump silêncio


label correr:
    show batata run with dissolve
    show batata run at left with moveinleft
    scene bg corre with fade
    n "{cps=20}{color=808080}Você corre o mais rápido possível, passando árvore por árvore, arranhando-se nos galhos.{/color}{/cps}"
    n "{cps=20}{color=808080}O som do zumbido começa a se aproximar rapidamente, seus batimentos cardíacos aceleram.{/color}{/cps}"
    n "{cps=20}{color=808080}Você suava frio e sua respiração estava arfante.{/color}{/cps}"
    show rodela voadora at right with moveinleft
    show rodela voadora at center with moveinleft
    show rodela voadora at left with moveinleft
    scene bg corre2 with vpunch
    n "{cps=20}{color=808080}Repentinamente, o som de um disparo o assusta, uma árvore faz um estrondo no chão prendendo sua atenção.{/color}{/cps}"
    n "{cps=20}{color=808080}Sem tempo, continua correndo com lágrimas escorrendo.{/color}{/cps}"
    scene bg black with vpunch
    n "{cps=20}{color=808080}Quando você menos espera, seu corpo não o obedecia mais, não sentia mais seus braços e uma enorme dor abdominal o desorientava.{/color}{/cps}"
    scene bg partido ao meio with fade
    n "{cps=20}{color=808080}No momento em que cuspiu sucos, percebeu que não tinha mais vida.{/color}{/cps}"
    n "{cps=20}{color=808080}A última coisa que observou foi uma espécie de gosma o envolvendo.{/color}{/cps}"
    centered "{cps=20}{color=FF7F50}{size=+30}Final cenoura{/size}{/color}{/cps}"
    jump obrigado


label silêncio:
    n "{cps=20}{color=808080}Você petrifica sem emitir nenhum ruído, escondido entre o grande matagal.{/color}{/cps}"
    scene bg floresta noite with vpunch
    scene bg floresta noite with vpunch
    scene bg floresta noite with vpunch
    n "{cps=20}{color=808080}Sons de pegadas pesadas passam ao seu lado, o chão em que está parece um terremoto; por falta de equilíbrio, você cai em cima de algumas folhas mortas, emitindo sons altos.{/color}{/cps}"
    n "{cps=20}{color=808080}Quase que instantaneamente as pisadas fortes pararam, um grunhido nunca ouvido antes ecoa.{/color}{/cps}"
    scene bg floresta noite with hpunch
    scene bg floresta noite with hpunch
    show batata run with dissolve
    n "{cps=20}{color=808080}A movimentação lenta lhe dá brecha para você correr, sem mais delongas, você corre por sua vida.{/color}{/cps}"
    show batata run at left with moveinleft
    scene bg passagem secreta with fade
    n "{cps=20}{color=808080}Quando estava prestes a pular num buraco...{/color}{/cps}"
    scene bg black cry with fade
    n "{cps=20}{color=808080}Uma mão gigante o captura tapando sua visão quando você estava prestes a pular no buraco.{/color}{/cps}"
    n "{cps=20}{color=808080}Você lutava batendo na mão gigante, mas não causava sequer um dano, os passos lentos e pesados o levaram a uma fogueira enorme.{/color}{/cps}"
    scene bg black cry with vpunch
    scene bg black cry with vpunch
    scene bg black cry with vpunch
    scene bg black cry with vpunch
    n "{cps=20}{color=808080}Antes que pudesse reagir, uma lâmina retira toda a sua casca lentamente, você soltava sucos e água, sentir toda sua casca desaparecer com tanta dor, resultou em aceitação do destino.{/color}{/cps}"
    n "{cps=20}{color=808080}Você virou sopa.{/color}{/cps}"
    scene bg humano with fade
    centered "{size=+30}{cps=20}{color=D2B48C}Final ensopado{/color}{/cps}{/size}"
    jump obrigado

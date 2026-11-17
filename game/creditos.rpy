## The Super Potato - agradecimento e créditos
##
## Todo final da história termina com "jump obrigado".

label obrigado:
    ## Garantia: nenhuma barra de vida sobra na tela depois de um final.
    hide screen barras_de_vida
    play music SOM_MENU fadein 2.0
    scene bg obrigado with fade
    centered "{cps=20}{size=+15}{color=FF1493}Obrigado por jogar a versão beta!{/color} {color=4B0082} Espero que tenha gostado :3 {/color}{/size}{/cps}"
    jump credits


label credits:
    ## Durante os créditos somem o menu rápido e a caixa de fala.
    $ quick_menu = False
    window hide
    $ credits_speed = 20
    scene bg black say
    with dissolve
    show theend:
        yanchor 0.5 ypos 0.5
        xanchor 0.5 xpos 0.5
    with dissolve
    with Pause(2)
    hide theend
    show cred at rolar_creditos(credits_speed)
    with Pause(credits_speed)
    hide cred
    show thanks:
        yanchor 0.5 ypos 0.5
        xanchor 0.5 xpos 0.5
    with dissolve
    with Pause(3)
    hide thanks
    return

## Faz os créditos subirem: começam logo abaixo da tela e terminam logo acima,
## sem tempo morto no começo.
transform rolar_creditos(tempo):
    xalign 0.5
    ypos 1.0
    yanchor 0.0
    linear tempo ypos 0.0 yanchor 1.0

init python:
    ## Quem fez o quê. Para mudar os créditos, altere só esta lista.
    credits = (('Arte, roteiro e programação', 'Amanda Mayumi'),)
    credits_s = "{size=60}Créditos{/size}\n\n"
    c1 = ''
    for c in credits:
        if not c1==c[0]:
            credits_s += "\n{size=60}" + c[0] + "{/size}\n"
        credits_s += "{size=60}" + c[1] + "{/size}\n"
        c1=c[0]
    ## A versão vem do próprio Ren'Py, então nunca fica desatualizada.
    credits_s += "\n{size=40}Engine{/size}\n{size=60}Ren'Py\n" + renpy.version_only + "{/size}"

init:
    ## O contorno escuro mantém o texto legível sobre o fundo claro e escuro dos créditos.
    image cred = Text(credits_s, text_align=0.5, outlines=[(3, "#000000", 0, 0)])
    image theend = Text("{size=60}Fim{/size}", text_align=0.5, outlines=[(3, "#000000", 0, 0)])
    image thanks = Text("{size=40}Continua...(talvez){/size}", text_align=0.5, outlines=[(3, "#000000", 0, 0)])

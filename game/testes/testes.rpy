## Testes automatizados de The Super Potato
##
## O que eles garantem: o jogo abre, todos os finais são alcançáveis, a batalha
## segue as regras e nenhum caminho trava o jogo.
##
## Como rodar: dê dois cliques em "testar.bat" na raiz do projeto (ou use o
## botão "Run Testcases" no launcher do Ren'Py). Precisa do Ren'Py 8.5 ou mais novo.
##
## Esta pasta não entra no jogo empacotado (veja build.classify em options.rpy).
##
## Para a batalha ser repetível, os testes usam a variável sorteio_forcado
## (definida em batalha.rpy): com ela, o cogumelo faz sempre a mesma coisa.
##   1 = esquiva, 2 = ataca, 3 = fica parado.
## Depois de um ataque esquivado o cogumelo fica sem fôlego: na rodada seguinte
## ele fica parado, saia o que sair no sorteio.


testsuite global:
    setup:
        $ _test.timeout = 45.0
        pause until screen "main_menu"

    ## Todo teste começa no menu principal.
    before testcase:
        if not screen "main_menu":
            if eval main_menu:
                run ShowMenu("main_menu")
            else:
                run MainMenu(confirm=False)
        pause until screen "main_menu"

    teardown:
        exit


    ## -----------------------------------------------------------------------
    ## Começo do jogo e nome do jogador
    ## -----------------------------------------------------------------------
    testsuite comeco:

        testcase nome_digitado_aparece_na_historia:
            run Start()
            advance until screen "input"
            pause 0.5
            type "Fritz"
            keysym "K_RETURN" until not screen "input"
            advance until "Fritz! Você é o sobrevivente!"
            assert eval (namae == "Fritz")

        testcase nome_vazio_vira_batata:
            run Start()
            advance until screen "input"
            pause 0.5
            keysym "K_RETURN" until not screen "input"
            advance until "Batata! Você é o sobrevivente!"
            assert eval (namae == "Batata")

        testcase nome_tem_limite_de_tamanho:
            run Start()
            advance until screen "input"
            pause 0.5
            type "abcdefghijklmnopqrstuvwxyz"
            keysym "K_RETURN" until not screen "input"
            advance until "sobrevivente"
            assert eval (len(namae) == 16)

        testcase entrar_na_caverna_leva_ao_treinamento:
            run Start()
            advance until screen "input"
            pause 0.5
            keysym "K_RETURN" until not screen "input"
            advance until screen "choice"
            click "Entrar na caverna"
            advance until "Mr.Fritas"
            advance until screen "choice"
            assert "Enfrentar"


    ## -----------------------------------------------------------------------
    ## Todos os finais são alcançáveis
    ## -----------------------------------------------------------------------
    testsuite finais:

        testcase final_ruim_1:
            run Start("cajado")
            advance until screen "choice"
            click "Desistir"
            advance until "Final ruim 1"
            advance until "Obrigado por jogar"

        testcase final_ruim_2:
            run Start("cajado")
            advance until screen "choice"
            click "Lutar pela vida"
            advance until screen "choice"
            click "Segurar em outra parte"
            advance until "Final ruim 2"
            advance until "Obrigado por jogar"

        testcase final_batata_traidora:
            run Start("cajado")
            advance until screen "choice"
            click "Lutar pela vida"
            advance until screen "choice"
            click "Usar todas"
            advance until screen "choice"
            click "catar coquinho"
            advance until "Final batata traidora"
            advance until "Obrigado por jogar"

        testcase prometer_leva_ao_treinamento:
            run Start("subir")
            advance until screen "choice"
            click "Prometer"
            advance until "Mr.Fritas"

        testcase fugir_do_cogumelo:
            run Start("treinamento")
            advance until screen "choice"
            click "Fugir"
            advance until "asfixiado"
            assert eval (vidaB == 0)
            assert screen "barras_de_vida"
            advance until "Obrigado por jogar"
            ## A barra de vida não pode sobrar na tela depois do final.
            assert not screen "barras_de_vida"

        testcase final_tragico:
            ## O cogumelo acerta duas vezes: 100 - 75 - 75.
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            click "Atacar"
            advance until screen "choice"
            click "Atacar"
            advance until "Final trágico"
            assert eval (vidaB <= 0 and vidaI > 0)
            assert not screen "barras_de_vida"
            advance until "Obrigado por jogar"

        testcase final_feliz:
            ## Cinco golpes certeiros sem apanhar: 250 - 5 x 50.
            run Start("batalha")
            $ sorteio_forcado = 3
            advance until screen "choice"
            click "Atacar"
            advance until screen "choice"
            click "Atacar"
            advance until screen "choice"
            click "Atacar"
            advance until screen "choice"
            click "Atacar"
            advance until screen "choice"
            click "Atacar"
            advance until "ganhou o combate"
            assert eval (vidaI <= 0 and vidaB > 0)
            advance until "Final Feliz"
            assert not screen "barras_de_vida"
            advance until "Obrigado por jogar"

        testcase final_do_esforco_implacavel:
            ## Os dois caem no mesmo golpe.
            ## O sorteio de cada rodada acontece antes do menu aparecer; por isso
            ## trocar o valor durante um menu só vale a partir da rodada seguinte.
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            $ sorteio_forcado = 3
            click "Atacar"
            advance until screen "choice"
            assert eval (vidaB == 25 and vidaI == 200)
            click "Atacar"
            advance until screen "choice"
            click "Atacar"
            advance until screen "choice"
            $ sorteio_forcado = 2
            click "Atacar"
            advance until screen "choice"
            assert eval (vidaB == 25 and vidaI == 50)
            click "Atacar"
            advance until "esforço implacável"
            assert eval (vidaB <= 0 and vidaI <= 0)
            advance until "Obrigado por jogar"

        testcase final_cenoura:
            run Start("guerra")
            advance until screen "choice"
            click "Correr"
            advance until "final cenoura"
            advance until "Obrigado por jogar"

        testcase final_ensopado:
            run Start("guerra")
            advance until screen "choice"
            click "Ficar em silêncio"
            advance until "Final ensopado"
            advance until "Obrigado por jogar"

        testcase voltar_para_salvar_os_pais_leva_a_floresta:
            run Start()
            advance until screen "input"
            pause 0.5
            keysym "K_RETURN" until not screen "input"
            advance until screen "choice"
            click "Voltar para salvar"
            advance until "predadores"
            advance until screen "choice"
            assert "Correr"


    ## -----------------------------------------------------------------------
    ## Regras da batalha
    ## -----------------------------------------------------------------------
    testsuite batalha:

        testcase luta_comeca_com_vida_cheia_e_barras:
            run Start("batalha")
            advance until screen "choice"
            assert eval (vidaB == VIDA_BATATA_MAX and vidaI == VIDA_COGUMELO_MAX)
            assert screen "barras_de_vida"

        testcase esquivar_do_ataque_nao_tira_vida:
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            click "Esquiva"
            advance until "MISS"
            advance until screen "choice"
            assert eval (vidaB == 100 and vidaI == 250)

        testcase atacar_quando_ele_esquiva_erra:
            run Start("batalha")
            $ sorteio_forcado = 1
            advance until screen "choice"
            click "Atacar"
            advance until "MISS"
            advance until screen "choice"
            assert eval (vidaB == 100 and vidaI == 250)

        testcase ficar_parado_e_apanhar_nao_trava_o_jogo:
            ## Este caminho travava o jogo ({size=+ 20} com espaço).
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            click "Não fazer nada"
            advance until "Você perdeu 75 de vida"
            advance until screen "choice"
            assert eval (vidaB == 25 and vidaI == 250)

        testcase ficar_parado_sem_apanhar:
            run Start("batalha")
            $ sorteio_forcado = 3
            advance until screen "choice"
            click "Não fazer nada"
            advance until "purê nas calças"
            advance until screen "choice"
            assert eval (vidaB == 100 and vidaI == 250)

        testcase nova_partida_recomeca_com_vida_cheia:
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            click "Atacar"
            advance until screen "choice"
            assert eval (vidaB == 25)
            run MainMenu(confirm=False)
            pause until screen "main_menu"
            run Start("batalha")
            advance until screen "choice"
            assert eval (vidaB == 100 and vidaI == 250)

        testcase salvar_e_carregar_no_meio_da_luta:
            ## A vida e as barras têm de voltar iguais depois de carregar.
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            click "Atacar"
            advance until screen "choice"
            assert eval (vidaB == 25 and vidaI == 200)
            run QuickSave()
            run MainMenu(confirm=False)
            pause until screen "main_menu"
            run QuickLoad(confirm=False)
            pause until screen "choice"
            assert eval (vidaB == 25 and vidaI == 200)
            assert screen "barras_de_vida"

        testcase sorteio_de_verdade_fica_na_faixa:
            ## Sem valor fixo: o sorteio real tem de cair entre 1 e 3.
            run Start("batalha")
            advance until screen "choice"
            assert eval (sorteio in (1, 2, 3))
            assert eval (frase in (1, 2, 3, 4, 5))


        ## --- Pistas (D3): o cogumelo entrega o que vai fazer antes de o jogador escolher ---

        testcase pista_de_esquiva:
            run Start("batalha")
            $ sorteio_forcado = 1
            advance until screen "choice"
            assert eval (sorteio == 1 and pista in pistas_possiveis(1))
            assert eval (pista not in pistas_possiveis(2) and pista not in pistas_possiveis(3))

        testcase pista_de_ataque:
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            assert eval (sorteio == 2 and pista in pistas_possiveis(2))

        testcase pista_de_parado:
            run Start("batalha")
            $ sorteio_forcado = 3
            advance until screen "choice"
            assert eval (sorteio == 3 and pista in pistas_possiveis(3))

        testcase esquivar_do_ataque_deixa_o_cogumelo_sem_folego:
            ## Depois de errar o bote, o cogumelo fica parado na rodada seguinte,
            ## saia o que sair no sorteio, e o golpe certeiro tira o dobro.
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            click "Esquiva"
            advance until "sem fôlego"
            advance until screen "choice"
            assert eval (sem_folego and sorteio == 3 and vidaB == 100 and vidaI == 250)
            assert eval (pista in pistas_possiveis(3, True))
            click "Atacar"
            advance until "GOLPE CERTEIRO"
            advance until screen "choice"
            assert eval (vidaI == 150 and vidaB == 100 and not sem_folego)

        testcase respirar_recupera_vida_quando_ele_se_esquiva:
            ## Uma troca de golpes deixa a batata com 25; respirar numa esquiva devolve 25.
            run Start("batalha")
            $ sorteio_forcado = 2
            advance until screen "choice"
            $ sorteio_forcado = 1
            click "Atacar"
            advance until screen "choice"
            assert eval (vidaB == 25 and vidaI == 200)
            click "Não fazer nada"
            advance until "Você recuperou 25 de vida"
            advance until screen "choice"
            assert eval (vidaB == 50 and vidaI == 200)

        testcase respirar_com_a_vida_cheia_nao_passa_do_maximo:
            run Start("batalha")
            $ sorteio_forcado = 1
            advance until screen "choice"
            click "Não fazer nada"
            advance until "Muito bem pensado"
            advance until screen "choice"
            assert eval (vidaB == 100 and vidaI == 250)

        testcase regras_da_rodada_num_lugar_so:
            ## (dano na batata, dano no cogumelo, vida recuperada, sem fôlego na próxima)
            assert eval (resolver_rodada(2, "atacar") == (75, 50, 0, False))
            assert eval (resolver_rodada(3, "atacar") == (0, 50, 0, False))
            assert eval (resolver_rodada(3, "atacar", True) == (0, 100, 0, False))
            assert eval (resolver_rodada(1, "atacar") == (0, 0, 0, False))
            assert eval (resolver_rodada(2, "esquiva") == (0, 0, 0, True))
            assert eval (resolver_rodada(2, "nada") == (75, 0, 0, False))
            assert eval (resolver_rodada(1, "nada") == (0, 0, 25, False))

        testcase quem_le_as_pistas_vence_e_quem_so_ataca_perde:
            ## 10 mil lutas simuladas de cada jeito, com as mesmas regras do jogo.
            $ lutas_lendo = simular_lutas(politica_leitora)
            $ lutas_atacando = simular_lutas(politica_so_ataca)
            assert eval (lutas_lendo["vitoria"] > 7000)
            assert eval (lutas_atacando["vitoria"] < 5000 and lutas_atacando["derrota"] > 5000)
            assert eval (lutas_lendo["rodadas"] < 10)

    ## -----------------------------------------------------------------------
    ## Som (D4)
    ## -----------------------------------------------------------------------
    testsuite som:

        testcase nenhum_arquivo_de_som_falta:
            assert eval (len(TODOS_OS_SONS) == 12)
            assert eval (all(renpy.loadable(arquivo) for arquivo in TODOS_OS_SONS))

        testcase as_preferencias_mostram_os_volumes:
            ## Com música e sons ligados, a tela de preferências desenha os dois controles de volume.
            assert eval (config.has_music and config.has_sound)
            run ShowMenu("preferences")
            pause until screen "preferences"
            pause 0.3

        testcase a_historia_e_a_luta_pedem_cada_uma_a_sua_musica:
            run Start()
            advance until "Potatoesvill"
            assert eval (musica_pedida() == SOM_HISTORIA)
            run MainMenu(confirm=False)
            pause until screen "main_menu"
            run Start("batalha")
            advance until screen "choice"
            assert eval (musica_pedida() == SOM_BATALHA)

    ## -----------------------------------------------------------------------
    ## Menus abrem sem erro
    ## -----------------------------------------------------------------------
    testsuite menus:

        testcase telas_do_menu_principal:
            parameter tela = ["load", "preferences", "about", "help"]
            run ShowMenu(tela)
            pause until screen tela
            pause 0.3

        testcase telas_dentro_do_jogo:
            parameter tela = ["save", "history", "preferences"]
            run Start()
            advance until "Potatoesvill"
            run ShowMenu(tela)
            pause until screen tela
            pause 0.3
            run Return()

        testcase creditos_rolam_ate_o_fim_e_voltam_ao_menu:
            run Start("credits")
            pause 1.0
            assert not screen "main_menu"
            pause until screen "main_menu" timeout 60.0


    ## -----------------------------------------------------------------------
    ## Capturas de tela para conferir o visual (desligadas por padrão).
    ## Para gerar: testar.bat capturas
    ## -----------------------------------------------------------------------
    testsuite capturas:
        enabled False

        testcase menu_principal:
            pause 1.0
            screenshot "01_menu_principal.png"

        testcase telas_de_menu:
            parameter tela = ["load", "preferences", "about", "help"]
            run ShowMenu(tela)
            pause until screen tela
            pause 0.8
            screenshot f"02_{tela}.png"

        testcase inicio_e_nome:
            run Start()
            advance until "Potatoesvill"
            pause 3.0
            screenshot "10_primeira_fala.png"
            advance until "Carrotao"
            pause 3.5
            screenshot "11_fundo_carrotao.png"
            advance until screen "input"
            pause 0.5
            pause 0.5
            screenshot "12_nome.png"
            keysym "K_RETURN" until not screen "input"
            ## Nome com acento: confere se a caixa do nome mostra as letras acentuadas.
            $ namae = "João Ângelo"
            advance until "Quem é você"
            pause 1.5
            screenshot "13_fala_do_jogador.png"
            advance until screen "choice"
            pause 0.6
            screenshot "14_escolhas.png"
            run ShowMenu("save")
            pause until screen "save"
            pause 0.8
            screenshot "15_salvar.png"
            run Return()

        testcase batalha_e_barras:
            ## Entra na luta pelo caminho normal, para o cenário estar na tela.
            run Start("treinamento")
            $ namae = "João Ângelo"
            $ sorteio_forcado = 2
            advance until screen "choice"
            click "Enfrentar"
            advance until "O cogumelo te encara"
            advance until screen "choice"
            pause 0.6
            screenshot "20_batalha_inicio.png"
            click "Atacar"
            advance until "Você perdeu"
            pause 1.2
            screenshot "21_batalha_dano.png"

        testcase obrigado:
            run Start("obrigado")
            advance until "Obrigado por jogar"
            pause 4.0
            screenshot "30_obrigado.png"

        testcase creditos:
            run Start("credits")
            pause 2.2
            screenshot "31_fim.png"
            pause 4.5
            screenshot "32_creditos_comeco.png"
            pause 6.0
            screenshot "33_creditos_meio.png"

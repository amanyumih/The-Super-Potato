## The Super Potato - som
##
## A trilha e os efeitos são PROVISÓRIOS. Foram gerados por código
## (ferramentas/gerar_audio.py), nota por nota, só para o jogo não ficar mudo.
## Não usam gravação nem arquivo de terceiros.
##
## Para trocar um som, ponha o arquivo novo em game/audio e mude o nome aqui.
## Os comandos "play" do roteiro usam estes nomes, então não precisa mexer neles.
## O Ren'Py toca .ogg, .opus, .mp3 e .wav.

## Roda antes de screens.rpy, que usa SOM_CLIQUE nos botões.
init offset = -2

## Músicas (tocam em laço)
define SOM_MENU = "audio/tema_menu.wav"
define SOM_HISTORIA = "audio/tema_historia.wav"
define SOM_BATALHA = "audio/tema_batalha.wav"

## Efeitos
define SOM_CLIQUE = "audio/clique.wav"
define SOM_GOLPE = "audio/golpe.wav"
define SOM_CERTEIRO = "audio/certeiro.wav"
define SOM_ERRO = "audio/erro.wav"
define SOM_DANO = "audio/dano.wav"
define SOM_FUMACA = "audio/fumaca.wav"
define SOM_CURA = "audio/cura.wav"
define SOM_VITORIA = "audio/vitoria.wav"
define SOM_DERROTA = "audio/derrota.wav"

## Os testes usam esta lista para conferir que nenhum arquivo está faltando.
define TODOS_OS_SONS = [
    SOM_MENU, SOM_HISTORIA, SOM_BATALHA,
    SOM_CLIQUE, SOM_GOLPE, SOM_CERTEIRO, SOM_ERRO, SOM_DANO, SOM_FUMACA, SOM_CURA, SOM_VITORIA, SOM_DERROTA,
]

## Música do menu principal.
define config.main_menu_music = SOM_MENU

## Volume de partida, para quem abre o jogo pela primeira vez: a música mais
## baixa que os efeitos. O jogador muda em Preferências.
define config.default_music_volume = 0.55
define config.default_sfx_volume = 0.8

## O botão "Testar" das preferências toca este efeito.
define config.sample_sound = SOM_GOLPE

init python:
    def musica_pedida():
        """
        O arquivo de música que o jogo mandou tocar por último. Serve aos testes:
        funciona mesmo num computador sem placa de som.
        """
        try:
            arquivos = renpy.audio.audio.get_channel("music").context.last_filenames
        except Exception:
            arquivos = None
        return arquivos[0] if arquivos else renpy.music.get_playing("music")

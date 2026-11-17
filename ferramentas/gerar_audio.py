# -*- coding: utf-8 -*-
"""
Gera a trilha e os efeitos sonoros PROVISÓRIOS de The Super Potato.

Tudo é sintetizado por este programa, nota por nota: não há gravação nem arquivo
de terceiros, então não existe questão de licença. A ideia é o jogo não ficar mudo
enquanto a trilha de verdade não chega. Para trocar um som, basta pôr outro arquivo
com o mesmo nome em game/audio (ou mudar o nome em game/som.rpy).

Como rodar (na raiz do projeto):
    <sdk do Ren'Py>\\lib\\py3-windows-x86_64\\python.exe ferramentas\\gerar_audio.py

Só usa a biblioteca padrão do Python. Leva cerca de um minuto.
"""
import math
import os
import random
import struct
import wave

TAXA = 32000                     # amostras por segundo
PASTA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "game", "audio")
DOIS_PI = 2 * math.pi
NOMES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def freq(nota):
    """'A4' -> 440.0. Aceita sustenido ('F#5') e bemol ('Bb4')."""
    letra, resto = nota[0], nota[1:]
    semitom = NOMES[letra]
    if resto[0] == "#":
        semitom, resto = semitom + 1, resto[1:]
    elif resto[0] == "b":
        semitom, resto = semitom - 1, resto[1:]
    return 440.0 * 2 ** ((semitom - 9) / 12.0 + int(resto) - 4)


# ---------------------------------------------------------------------------
# Timbres: cada um devolve uma lista de amostras entre -1 e 1
# ---------------------------------------------------------------------------

def caixinha(f, dur, forca=1.0):
    """Caixinha de música: uma nota de sino pequeno, que morre devagar."""
    n = int(TAXA * (dur + 1.6))
    parciais = ((1.0, 1.0, 0.9), (2.0, 0.28, 0.45), (3.01, 0.10, 0.25), (5.4, 0.05, 0.10))
    saida = [0.0] * n
    for mult, amp, tau in parciais:
        w = DOIS_PI * f * mult / TAXA
        if f * mult > TAXA * 0.45:
            continue
        for i in range(n):
            saida[i] += amp * math.sin(w * i) * math.exp(-i / (tau * TAXA))
    ataque = int(TAXA * 0.004)
    for i in range(min(ataque, n)):
        saida[i] *= i / ataque
    return [s * forca for s in saida]


def cama(f, dur, forca=1.0):
    """Um som longo e macio, para os acordes de fundo."""
    n = int(TAXA * (dur + 1.2))
    sobe, desce = int(TAXA * 0.7), int(TAXA * 1.2)
    w1, w2, w3 = DOIS_PI * f * 0.997 / TAXA, DOIS_PI * f * 1.003 / TAXA, DOIS_PI * f * 2 / TAXA
    saida = []
    for i in range(n):
        env = min(1.0, i / sobe) * min(1.0, (n - i) / desce)
        saida.append(forca * env * (0.45 * math.sin(w1 * i) + 0.45 * math.sin(w2 * i) + 0.10 * math.sin(w3 * i)))
    return saida


def grave(f, dur, forca=1.0):
    """Baixo redondo."""
    n = int(TAXA * (dur + 0.3))
    w = DOIS_PI * f / TAXA
    saida = []
    for i in range(n):
        env = min(1.0, i / (TAXA * 0.01)) * math.exp(-i / (TAXA * max(0.25, dur * 0.8)))
        saida.append(forca * env * (math.sin(w * i) + 0.25 * math.sin(2 * w * i)))
    return saida


def dedilhado(f, dur, forca=1.0):
    """Corda beliscada, curta: o motor da música de luta."""
    n = int(TAXA * (dur + 0.25))
    w = DOIS_PI * f / TAXA
    saida = []
    for i in range(n):
        env = min(1.0, i / (TAXA * 0.003)) * math.exp(-i / (TAXA * 0.16))
        saida.append(forca * env * (math.sin(w * i) + 0.33 * math.sin(3 * w * i) + 0.12 * math.sin(5 * w * i)))
    return saida


def bumbo(forca=1.0):
    n = int(TAXA * 0.22)
    saida, fase = [], 0.0
    for i in range(n):
        t = i / TAXA
        fase += DOIS_PI * (48 + 80 * math.exp(-t * 28)) / TAXA
        saida.append(forca * math.sin(fase) * math.exp(-t * 16))
    return saida


def ruido(dur, forca=1.0, queda=30.0, agudo=True, semente=7):
    """Chiado curto. agudo=True tira os graves (prato); False deixa passar (sopro)."""
    dado = random.Random(semente)
    n = int(TAXA * dur)
    saida, anterior, suave = [], 0.0, 0.0
    for i in range(n):
        x = dado.uniform(-1, 1)
        if agudo:
            y = x - anterior
            anterior = x
        else:
            suave += 0.12 * (x - suave)
            y = suave * 3
        saida.append(forca * y * math.exp(-i / TAXA * queda))
    return saida


# ---------------------------------------------------------------------------
# Montagem
# ---------------------------------------------------------------------------

class Faixa(object):
    """Uma faixa em laço: o que passa do fim volta para o começo, e a emenda não aparece."""

    def __init__(self, bpm, compassos, laco=True):
        self.tempo = 60.0 / bpm                         # duração de um tempo, em segundos
        self.n = int(round(TAXA * self.tempo * 4 * compassos))
        self.buf = [0.0] * self.n
        self.laco = laco

    def por(self, amostras, tempo_inicio):
        inicio = int(round(tempo_inicio * self.tempo * TAXA))
        n, buf = self.n, self.buf
        if self.laco:
            for i, s in enumerate(amostras):
                buf[(inicio + i) % n] += s
        else:
            for i, s in enumerate(amostras):
                if inicio + i < n:
                    buf[inicio + i] += s

    def eco(self, tempos=0.75, quanto=0.28, voltas=2):
        atraso = int(round(tempos * self.tempo * TAXA))
        for volta in range(voltas):
            seco = list(self.buf)
            for i in range(self.n):
                j = i + atraso
                if self.laco:
                    self.buf[j % self.n] += seco[i] * quanto
                elif j < self.n:
                    self.buf[j] += seco[i] * quanto
            quanto *= 0.6


def gravar(nome, amostras, pico=0.7, fade_fim=0.0):
    maior = max(1e-9, max(abs(s) for s in amostras))
    ganho = pico / maior
    n = len(amostras)
    fade = int(TAXA * fade_fim)
    quadros = bytearray()
    for i, s in enumerate(amostras):
        v = s * ganho
        if fade and i > n - fade:
            v *= (n - i) / float(fade)
        quadros += struct.pack("<h", int(max(-1.0, min(1.0, v)) * 32767))
    if not os.path.isdir(PASTA):
        os.makedirs(PASTA)
    caminho = os.path.join(PASTA, nome)
    arq = wave.open(caminho, "wb")
    arq.setnchannels(1)
    arq.setsampwidth(2)
    arq.setframerate(TAXA)
    arq.writeframes(bytes(quadros))
    arq.close()
    rms = math.sqrt(sum((s * ganho) ** 2 for s in amostras) / n)
    print("%-20s %6.1f s  %7.1f KB  volume medio %.3f" % (nome, n / float(TAXA), os.path.getsize(caminho) / 1024.0, rms))


def melodia(faixa, timbre, notas, inicio=0.0, forca=1.0):
    """notas: lista de (nome da nota ou None para pausa, duração em tempos)."""
    t = inicio
    for nota, dur in notas:
        if nota:
            faixa.por(timbre(freq(nota), dur * faixa.tempo, forca), t)
        t += dur
    return t


# ---------------------------------------------------------------------------
# As três músicas
# ---------------------------------------------------------------------------

def tema_menu():
    """Caixinha de música calma, em lá menor. Toca no menu, no agradecimento e nos créditos."""
    f = Faixa(bpm=72, compassos=8)
    acordes = (("A2", ("A3", "C4", "E4")), ("F2", ("F3", "A3", "C4")), ("C3", ("G3", "C4", "E4")), ("G2", ("G3", "B3", "D4")))
    for k, (baixo, notas) in enumerate(acordes):
        t = k * 8
        f.por(grave(freq(baixo), 4 * f.tempo, 0.55), t)
        f.por(grave(freq(baixo), 3 * f.tempo, 0.40), t + 4)
        for nota in notas:
            f.por(cama(freq(nota), 8 * f.tempo, 0.16), t)
    linha = [
        ("E5", 1), ("A5", 1), ("G5", .5), ("E5", 1), ("C5", .5), ("D5", 1), ("E5", 2), ("A4", 1),
        ("C5", 1), ("F5", 1), ("E5", .5), ("C5", 1), ("A4", .5), ("C5", 1), ("D5", 2), ("F4", 1),
        ("E5", 1), ("G5", 1), ("E5", .5), ("D5", 1), ("C5", .5), ("D5", 1), ("E5", 2), ("G4", 1),
        ("D5", 1), ("G5", 1), ("E5", .5), ("D5", 1), ("B4", .5), ("D5", 3), (None, 1),
    ]
    melodia(f, caixinha, linha, forca=0.55)
    f.eco(0.75, 0.22)
    gravar("tema_menu.wav", f.buf, pico=0.62)


def tema_historia():
    """Clima de floresta à noite: um fundo grave e notas soltas de sino. Toca durante a história."""
    f = Faixa(bpm=54, compassos=8)
    acordes = (("D2", ("D3", "A3", "F4")), ("Bb1", ("Bb2", "F3", "D4")), ("G1", ("G2", "D3", "Bb3")), ("A1", ("A2", "E3", "C#4")))
    for k, (baixo, notas) in enumerate(acordes):
        t = k * 8
        f.por(cama(freq(baixo), 8 * f.tempo, 0.34), t)
        for nota in notas:
            f.por(cama(freq(nota), 8 * f.tempo, 0.17), t)
    soltas = [("D5", 0), ("A4", 2.5), ("F5", 5), ("D5", 8), ("Bb4", 11), ("F5", 13), ("E5", 14.5),
              ("G4", 16), ("D5", 19), ("Bb4", 21.5), ("A4", 24), ("C#5", 27), ("E5", 29.5)]
    for nota, t in soltas:
        f.por(caixinha(freq(nota), 2.0, 0.40), t)
    f.eco(1.5, 0.30, voltas=3)
    gravar("tema_historia.wav", f.buf, pico=0.55)


def tema_batalha():
    """Rápida e nervosa, em mi menor. Toca na luta contra o cogumelo."""
    f = Faixa(bpm=132, compassos=8)
    acordes = (("E", "G", "B"), ("C", "E", "G"), ("D", "F#", "A"), ("B", "D#", "F#"))
    for k, (raiz, terca, quinta) in enumerate(acordes):
        oit = 2 if raiz in ("E", "D", "C") else 1
        desenho = [raiz + str(oit), raiz + str(oit + 1), terca + "3", raiz + str(oit + 1), quinta + "3", raiz + str(oit + 1), terca + "3", raiz + str(oit + 1)]
        for compasso in range(2):
            t0 = k * 8 + compasso * 4
            for passo, nota in enumerate(desenho):
                f.por(dedilhado(freq(nota), 0.5 * f.tempo, 0.42), t0 + passo * 0.5)
            f.por(grave(freq(raiz + str(oit)), 2 * f.tempo, 0.50), t0)
            f.por(grave(freq(raiz + str(oit)), 2 * f.tempo, 0.42), t0 + 2)
            for tempo in range(4):
                if tempo % 2 == 0:
                    f.por(bumbo(0.9), t0 + tempo)
                else:
                    f.por(ruido(0.11, 0.38, queda=28, semente=tempo + 3), t0 + tempo)
                f.por(ruido(0.035, 0.14, queda=70, semente=tempo + 11), t0 + tempo + 0.5)
    linha = [
        ("B4", 1), ("E5", 1), ("D5", 1), ("B4", 1), ("G4", 1), ("A4", 1), ("B4", 2),
        ("C5", 1), ("E5", 1), ("D5", 1), ("C5", 1), ("G4", 1), ("A4", 1), ("C5", 2),
        ("D5", 1), ("F#5", 1), ("E5", 1), ("D5", 1), ("A4", 1), ("B4", 1), ("D5", 2),
        ("D#5", 1), ("F#5", 1), ("E5", 1), ("D#5", 1), ("B4", 2), ("F#4", 2),
    ]
    melodia(f, caixinha, linha, forca=0.45)
    f.eco(0.75, 0.16, voltas=1)
    gravar("tema_batalha.wav", f.buf, pico=0.66)


# ---------------------------------------------------------------------------
# Efeitos
# ---------------------------------------------------------------------------

def junta(*partes):
    """Soma listas de amostras, cada uma com seu atraso em segundos: (amostras, atraso)."""
    n = max(len(a) + int(TAXA * d) for a, d in partes)
    saida = [0.0] * n
    for a, d in partes:
        k = int(TAXA * d)
        for i, s in enumerate(a):
            saida[k + i] += s
    return saida


def varrida(f0, f1, dur, forca=1.0, queda=6.0):
    """Um tom que escorrega de f0 para f1."""
    n = int(TAXA * dur)
    saida, fase = [], 0.0
    for i in range(n):
        p = i / float(n)
        fase += DOIS_PI * (f0 + (f1 - f0) * p) / TAXA
        saida.append(forca * math.sin(fase) * math.exp(-p * queda) * min(1.0, i / (TAXA * 0.004)))
    return saida


def efeitos():
    gravar("clique.wav", varrida(880, 620, 0.07, 1.0, 5), pico=0.35)
    gravar("golpe.wav", junta((varrida(170, 55, 0.18, 1.0, 5), 0), (ruido(0.08, 0.6, queda=40), 0)), pico=0.75)
    gravar("certeiro.wav", junta((varrida(190, 50, 0.24, 1.0, 4), 0), (ruido(0.10, 0.6, queda=30), 0),
                                 (caixinha(freq("E6"), 0.2, 0.35), 0.05), (caixinha(freq("B6"), 0.4, 0.30), 0.13)), pico=0.78, fade_fim=0.3)
    gravar("erro.wav", ruido(0.30, 1.0, queda=9, agudo=False, semente=21), pico=0.40)
    gravar("dano.wav", junta((varrida(300, 70, 0.34, 1.0, 3.5), 0), (ruido(0.12, 0.35, queda=25, agudo=False), 0)), pico=0.70)
    gravar("fumaca.wav", ruido(0.9, 1.0, queda=3.2, agudo=False, semente=5), pico=0.38, fade_fim=0.2)
    gravar("cura.wav", junta((caixinha(freq("C6"), 0.2, 0.5), 0), (caixinha(freq("G6"), 0.5, 0.5), 0.12)), pico=0.50, fade_fim=0.4)
    gravar("vitoria.wav", junta((caixinha(freq("C5"), 0.3, 0.5), 0), (caixinha(freq("E5"), 0.3, 0.5), 0.14),
                                (caixinha(freq("G5"), 0.3, 0.5), 0.28), (caixinha(freq("C6"), 1.2, 0.6), 0.42)), pico=0.60, fade_fim=0.5)
    gravar("derrota.wav", junta((grave(freq("E3"), 0.4, 0.8), 0), (grave(freq("C3"), 0.4, 0.8), 0.32),
                                (grave(freq("A2"), 0.5, 0.8), 0.64), (grave(freq("E2"), 1.2, 0.9), 0.98)), pico=0.70, fade_fim=0.4)


if __name__ == "__main__":
    tema_menu()
    tema_historia()
    tema_batalha()
    efeitos()
    print("pronto: arquivos em", os.path.normpath(PASTA))

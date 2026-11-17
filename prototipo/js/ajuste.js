// The Super Potato: protótipo de sensação.
//
// Este arquivo guarda TODOS os números que mudam a sensação do jogo, o desenho da fase e os
// textos das placas. Para experimentar, mude um número aqui e recarregue a página.
// Distâncias em pixels (1 bloco = 48 px), tempos em segundos, velocidades em pixels por segundo.
(function () {
  "use strict";
  var PB = window.PB = window.PB || {};
  PB.B = 48;        // tamanho de um bloco
  PB.LARG = 1280;   // tamanho da tela do jogo, antes de esticar para caber na janela
  PB.ALT = 720;

  PB.A = {
    // Corrida
    velMax: 340,          // velocidade máxima
    acelChao: 3600,       // ganho de velocidade por segundo no chão (chega ao máximo em 0,09 s)
    freioChao: 4200,      // perda de velocidade ao soltar a direção
    acelAr: 2600,
    freioAr: 900,
    // Pulo: escolha a altura e o tempo de subida; a gravidade e o impulso saem da conta (PB.recalcular)
    alturaPulo: 172,      // 3,6 blocos
    tempoSubida: 0.38,
    gravQueda: 1.55,      // a queda pesa mais que a subida
    cortePulo: 0.45,      // soltar o botão cedo corta a subida: pulo curto
    velQuedaMax: 980,
    coiote: 0.10,         // ainda dá para pular por este tempo depois de sair da beirada
    memoriaPulo: 0.12,    // apertar um pouco antes de tocar o chão ainda vale
    // Dash
    dashVel: 900,
    dashTempo: 0.16,
    dashEspera: 0.40,     // descanso entre um dash e outro
    // Golpe com o cajado, em três tempos: preparo, ativo (quando acerta) e recuperação
    golpePreparo: 0.05,
    golpeAtivo: 0.10,
    golpeRecupera: 0.15,
    golpeRecuperaForte: 0.22,   // o terceiro golpe do combo
    janelaCombo: 0.45,    // tempo para emendar o próximo golpe
    memoriaGolpe: 0.14,   // apertar um pouco antes de o golpe acabar já emenda o próximo
    alcance: 88,
    danoGolpe: 1,
    danoForte: 2,
    // Impacto
    pausaImpacto: 0.065,  // o mundo congela por este tempo quando o golpe acerta
    pausaImpactoForte: 0.12,
    pausaDano: 0.14,
    tremor: 1,            // multiplica o tremor da tela (0 desliga)
    recuoGolpe: 150,      // empurrão para trás em quem bate
    quique: 0.82,         // golpe para baixo no ar: fração da força do pulo
    empurraInimigo: 260,
    empurraInimigoForte: 430,
    // Vida e amido
    vida: 5,
    invencivel: 1.1,      // tempo sem levar dano depois de apanhar
    atordoado: 0.28,      // tempo sem controle depois de apanhar
    empurraDano: 380,
    amidoMax: 6,          // cada golpe que acerta enche 1
    custoPure: 3,         // a bola de purê gasta 3
    pureVel: 760,
    pureDano: 2
  };
  PB.PADRAO = JSON.parse(JSON.stringify(PB.A));

  // A gravidade e o impulso do pulo saem da altura e do tempo de subida escolhidos acima.
  PB.recalcular = function () {
    var A = PB.A;
    A.grav = 2 * A.alturaPulo / (A.tempoSubida * A.tempoSubida);
    A.velPulo = 2 * A.alturaPulo / A.tempoSubida;
  };
  PB.recalcular();

  // A fase, em blocos. A coluna 0 fica na esquerda e a linha 0 fica no alto.
  PB.FASE = {
    larg: 150,
    alt: 19,
    // Terra: [coluna inicial, coluna final, linha do topo]. Enche do topo até o fundo da fase.
    chao: [
      [0, 39, 16], [0, 1, 2],                       // começo e a parede do túnel secreto
      [22, 25, 14], [27, 31, 11],                   // dois degraus para treinar o pulo
      [40, 43, 18], [44, 48, 16],                   // buraco de 4 blocos: dá para pular
      [49, 55, 18], [56, 75, 16],                   // buraco de 7 blocos: só com dash
      [76, 95, 10],                                 // o planalto da cenoura
      [96, 110, 18],                                // o abismo dos galhos
      [111, 117, 12], [118, 119, 14], [120, 149, 16],
      [146, 149, 3]                                 // a parede da casa do vidente
    ],
    // Galhos: dá para subir por baixo e descer com baixo + pulo. [coluna inicial, coluna final, linha]
    plataformas: [[64, 67, 13], [72, 74, 13], [98, 100, 10], [103, 105, 9], [108, 110, 10], [127, 130, 13]],
    // Espinhos: [coluna inicial, coluna final, linha]
    espinhos: [[40, 43, 17], [49, 55, 17], [96, 110, 17]],
    // O que mora na fase: [o quê, coluna, texto da placa].
    // As cenouras atiram rodelas de longe: a do abismo fica do outro lado, guardando a segunda tocha.
    coisas: [
      ["batata", 4],
      ["placa", 7, "andar"], ["placa", 10, "golpe"], ["espantalho", 13],
      ["placa", 19, "pulo"],
      ["placa", 46, "dash"],
      ["placa", 58, "cogumelo"], ["cogumelo", 62],
      ["placa", 68, "pure"],
      ["tocha", 78], ["placa", 80, "rodela"], ["cenoura", 90],
      ["placa", 94, "baixo"],
      ["tocha", 114], ["cenoura", 116],
      ["cenoura", 126], ["cogumelo", 133],
      ["meta", 141]
    ]
  };

  // Textos das placas. O que está entre chaves vira o nome do botão de quem está jogando.
  PB.TEXTOS = {
    andar: "Andar: {andar}.",
    golpe: "Golpe com o cajado: {golpe}. Três seguidos terminam num golpe forte.",
    pulo: "Pular: {pulo}. Segure para ir mais alto.",
    dash: "Dash: {dash}. Pule e use no ar para atravessar o buraco.",
    cogumelo: "Quando o cogumelo inchar, saia de perto: ele solta fumaça.",
    pure: "Bola de purê: {pure}. Gasta 3 de amido; cada golpe que acerta enche 1.",
    rodela: "A cenoura atira rodelas de longe e investe de perto. Rebata a rodela com o cajado ou desvie.",
    baixo: "No ar, {baixo} + golpe quica em cima do inimigo e dos espinhos."
  };
  PB.NOMES = {
    teclado: { andar: "← → ou A D", pulo: "Z ou Espaço", golpe: "X ou J", dash: "C ou K", pure: "V ou L", baixo: "↓" },
    toque: { andar: "a alavanca", pulo: "PULO", golpe: "GOLPE", dash: "DASH", pure: "PURÊ", baixo: "alavanca para baixo" },
    controle: { andar: "o direcional", pulo: "A", golpe: "X", dash: "B ou RB", pure: "Y", baixo: "para baixo" }
  };
})();

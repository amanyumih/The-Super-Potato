// Os inimigos, tirados da visual novel: o cogumelo que solta fumaça e a cenoura soldado, que investe
// de perto e atira rodelas cortadoras de longe. Há também um espantalho de treino, que só apanha.
// A rodela não é um bicho: é a arma da cenoura, como a bola de purê é a da batata. Não tem vida.
// Regra de ouro: todo ataque avisa antes (estados "aviso" e "mira"), para dar tempo de reagir.
(function () {
  "use strict";
  var PB = window.PB, B = PB.B, A = PB.A, U = PB.util, M = PB.mundo, P = PB.part;
  var proximoId = 1;

  var TIPOS = {
    cogumelo: { w: 58, h: 68, vida: 3, cores: ["#b2aff0", "#2f35c0", "#f1e6e2"] },
    cenoura: { w: 36, h: 60, vida: 4, cores: ["#f2a33c", "#de8528", "#1b1820"] },
    espantalho: { w: 40, h: 84, vida: Infinity, manso: true, cores: ["#c9a877"] }
  };
  // Tempos de cada inimigo, em segundos; distâncias em pixels.
  PB.INIMIGOS = {
    // "ve" é um pouco maior que o alcance da fumaça: quem fica parado na beirada escapa por pouco
    cogumelo: { anda: 36, raio: 130, ve: 120, aviso: 0.6, descansa: 1.3, fumacaRaio: 110, fumacaDura: 1.5 },
    // De perto e de frente ("ve"), a cenoura investe. Mais longe ("veTiro"), atira uma rodela.
    cenoura: {
      anda: 85, raio: 170, ve: 300, aviso: 0.45, investe: 540, investeDura: 0.75, cansa: 0.8,
      veTiro: 560, veTiroAlt: 300, mira: 0.5, lanca: 0.3, esperaTiro: 2.4, rodelaVel: 430, rodelaDura: 1.5
    }
  };

  // x é o centro; y é o chão.
  PB.criarInimigo = function (tipo, x, y) {
    var T = TIPOS[tipo];
    var e = {
      id: proximoId++, tipo: tipo, w: T.w, h: T.h, x: x - T.w / 2, y: y - T.h, vx: 0, vy: 0,
      vida: T.vida, olhando: -1, estado: "anda", t: 0, espera: 0, esperaTiro: 0, flash: 0, tonto: 0, morto: false,
      manso: !!T.manso, casaX: x, fase: 0, anim: 0, balanco: 0, vBalanco: 0, noChao: false, parede: 0
    };
    e.px = e.x; e.py = e.y;
    return e;
  };

  function verBatata(e, b, alcX, alcY, soNaFrente) {
    var dx = (b.x + b.w / 2) - (e.x + e.w / 2), dy = (b.y + b.h / 2) - (e.y + e.h / 2);
    if (Math.abs(dx) > alcX || Math.abs(dy) > alcY) return false;
    return !soNaFrente || dx * e.olhando > 0;
  }
  function semChao(e) { return !M.pisavel(e.olhando > 0 ? e.x + e.w + 3 : e.x - 3, e.y + e.h + 4); }
  function patrulhar(e, vel, raio) {
    if (e.parede === e.olhando || semChao(e) || (e.x + e.w / 2 - e.casaX) * e.olhando > raio) e.olhando = -e.olhando;
    e.vx = e.olhando * vel;
  }
  // Há caminho livre entre dois pontos? Os galhos não tapam a visão; a terra, sim.
  function temVisada(x0, y0, x1, y1) {
    var n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 20), i;
    for (i = 1; i < n; i++) if (M.solido(Math.floor((x0 + (x1 - x0) * i / n) / B), Math.floor((y0 + (y1 - y0) * i / n) / B))) return false;
    return true;
  }

  function cogumelo(e, b, vivo) {
    var K = PB.INIMIGOS.cogumelo;
    if (e.estado === "anda") {
      patrulhar(e, K.anda, K.raio);
      if (vivo && e.espera <= 0 && verBatata(e, b, K.ve, 130)) {
        e.estado = "aviso"; e.t = 0; e.vx = 0; e.olhando = b.x + b.w / 2 >= e.x + e.w / 2 ? 1 : -1; PB.som("aviso");
      }
    } else if (e.estado === "aviso") {      // incha e treme: é a hora de sair de perto
      e.vx = 0;
      if (e.t >= K.aviso) {
        e.estado = "solta"; e.t = 0;
        PB.J.nuvens.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, r: 0, rMax: K.fumacaRaio, t: 0, dur: K.fumacaDura });
        PB.som("fumaca");
      }
    } else {                                 // soltou a fumaça e descansa
      e.vx = 0;
      if (e.t >= K.descansa) { e.estado = "anda"; e.t = 0; e.espera = 1.2; }
    }
  }

  // De onde a rodela sai: a cenoura a levanta acima da cabeça antes de atirar.
  PB.maoDaCenoura = function (e, lado) { return { x: e.x + e.w / 2 + (lado || e.olhando) * 6, y: e.y - 14 }; };

  function cenoura(e, b, vivo) {
    var K = PB.INIMIGOS.cenoura, bx = b.x + b.w / 2, by = b.y + b.h * 0.45, lado, m, d;
    if (e.estado === "anda") {
      patrulhar(e, K.anda, K.raio);
      if (vivo && e.espera <= 0 && verBatata(e, b, K.ve, 60, true)) { e.estado = "aviso"; e.t = 0; e.vx = 0; PB.som("aviso"); }
      else if (vivo && e.esperaTiro <= 0 && verBatata(e, b, K.veTiro, K.veTiroAlt)) {
        lado = bx >= e.x + e.w / 2 ? 1 : -1; m = PB.maoDaCenoura(e, lado);
        // só mira se a rodela tiver caminho livre até a batata
        if (temVisada(m.x, m.y, bx, by)) { e.olhando = lado; e.estado = "mira"; e.t = 0; e.vx = 0; PB.som("aviso"); }
      }
    } else if (e.estado === "mira") {        // levanta a rodela acima da cabeça: é o aviso do tiro
      e.vx = 0;
      if (e.t >= K.mira) {
        m = PB.maoDaCenoura(e); d = Math.hypot(bx - m.x, by - m.y) || 1;
        // A rodela vai reta para onde a batata está agora. Quem sai do lugar, escapa.
        PB.J.rodelas.push({ x: m.x, y: m.y, px: m.x, py: m.y, vx: (bx - m.x) / d * K.rodelaVel, vy: (by - m.y) / d * K.rodelaVel, t: 0 });
        e.estado = "lanca"; e.t = 0; e.esperaTiro = K.esperaTiro; PB.som("rodela");
      }
    } else if (e.estado === "lanca") {       // acabou de atirar: fica um instante parada
      e.vx = 0;
      if (e.t >= K.lanca) { e.estado = "anda"; e.t = 0; e.espera = Math.max(e.espera, 0.3); }
    } else if (e.estado === "aviso") {       // inclina para trás e mostra o "!": vai investir
      e.vx = 0;
      if (e.t >= K.aviso) { e.estado = "investe"; e.t = 0; }
    } else if (e.estado === "investe") {
      e.vx = e.olhando * K.investe;
      if (e.parede === e.olhando) {          // bateu na parede: fica tonta, é a melhor hora de bater
        e.estado = "cansa"; e.t = 0; e.tonto = 0.9; e.vx = -e.olhando * 130; e.vy = -230;
        PB.cam.tremer(0.3); PB.som("pouso");
      } else if (semChao(e)) { e.vx = 0; e.estado = "cansa"; e.t = 0; }
      else if (e.t >= K.investeDura) { e.estado = "cansa"; e.t = 0; }
    } else {                                 // cansa: para e respira
      e.vx = semChao(e) && e.vx * e.olhando > 0 ? 0 : U.aproxima(e.vx, 0, 1600 / 120);
      if (e.t >= K.cansa) { e.estado = "anda"; e.t = 0; e.espera = 0.5; }
    }
  }

  PB.atualizarInimigo = function (e, dt) {
    var J = PB.J, b = J.batata, vivo = !b.morto && b.voltando <= 0;
    e.px = e.x; e.py = e.y; e.t += dt; e.anim += dt;
    e.flash = Math.max(0, e.flash - dt); e.espera = Math.max(0, e.espera - dt); e.esperaTiro = Math.max(0, e.esperaTiro - dt);
    e.vBalanco += (-e.balanco * 180 - e.vBalanco * 7) * dt; e.balanco += e.vBalanco * dt;     // mola do tranco
    if (e.tipo === "espantalho") return;
    if (e.tonto > 0) { e.tonto -= dt; e.vx = U.aproxima(e.vx, 0, 900 * dt); }
    else if (e.tipo === "cogumelo") cogumelo(e, b, vivo);
    else cenoura(e, b, vivo);
    e.vy = Math.min(e.vy + A.grav * dt, A.velQuedaMax);
    PB.mover(e, dt);
    if (e.noChao && Math.abs(e.vx) > 5) e.fase += Math.abs(e.vx) * dt * 0.05;
    // empurrado para os espinhos, o inimigo também se dá mal
    if (M.tile(Math.floor((e.x + e.w / 2) / B), Math.floor((e.y + e.h - 4) / B)) === 3) matar(e);
  };

  function matar(e) {
    var J = PB.J;
    e.morto = true; J.stats.derrotados++;
    P.pedacos(e.x + e.w / 2, e.y + e.h / 2, 14, TIPOS[e.tipo].cores);
    P.poeira(e.x + e.w / 2, e.y + e.h / 2, 6, 0);
    PB.som("some");
  }

  // dx: para que lado o inimigo é empurrado. dir: direção do golpe ("frente", "cima" ou "baixo").
  PB.ferirInimigo = function (e, dano, dx, forte, dir, semAmido) {
    var J = PB.J, b = J.batata, cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    e.flash = 0.1; e.vBalanco += dx * (forte ? 10 : 7);
    J.pausa = Math.max(J.pausa, forte ? A.pausaImpactoForte : A.pausaImpacto);
    PB.cam.tremer(forte ? 0.5 : 0.28);
    PB.som(forte ? "forte" : "acerto");
    P.faiscas(cx, cy, forte ? 16 : 9, dx, dir === "cima" ? -1 : dir === "baixo" ? 1 : 0, forte);
    J.stats.acertos++;
    if (!semAmido) b.amido = Math.min(A.amidoMax, b.amido + 1);
    if (e.manso) { P.texto(cx, e.y - 8, String(dano), forte ? "#ffd27a" : "#ffffff"); return; }
    e.vida -= dano;
    if (e.vida <= 0) { matar(e); return; }
    e.tonto = forte ? 0.4 : 0.25;
    e.vx = dx * (forte ? A.empurraInimigoForte : A.empurraInimigo); e.vy = -150;
    // apanhar no meio do aviso, da mira ou da investida interrompe o ataque
    if (e.estado === "aviso" || e.estado === "mira" || e.estado === "investe") { e.estado = e.tipo === "cenoura" ? "cansa" : "anda"; e.t = 0; e.espera = 0.5; }
  };
})();

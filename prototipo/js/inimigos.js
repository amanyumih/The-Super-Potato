// Os inimigos, tirados da visual novel: o cogumelo que solta fumaça e a cenoura soldado, que flutua
// no ar e atira rodelas de cenoura com a sua bazuquinha. Há também um espantalho de treino, que só apanha.
// A rodela não é um bicho: é a munição da bazuquinha, como a bola de purê é a da batata. Não tem vida.
// Regra de ouro: todo ataque avisa antes (estados "aviso" e "mira"), para dar tempo de reagir.
(function () {
  "use strict";
  var PB = window.PB, B = PB.B, A = PB.A, U = PB.util, M = PB.mundo, P = PB.part;
  var proximoId = 1;

  var TIPOS = {
    cogumelo: { w: 58, h: 68, vida: 3, cores: ["#b2aff0", "#2f35c0", "#f1e6e2"] },
    cenoura: { w: 36, h: 60, vida: 4, voa: true, cores: ["#f2a33c", "#de8528", "#1b1820"] },
    espantalho: { w: 40, h: 84, vida: Infinity, manso: true, cores: ["#c9a877"] }
  };
  // Tempos de cada inimigo, em segundos; distâncias em pixels.
  PB.INIMIGOS = {
    // "ve" é um pouco maior que o alcance da fumaça: quem fica parado na beirada escapa por pouco
    cogumelo: { anda: 36, raio: 130, ve: 120, aviso: 0.6, descansa: 1.3, fumacaRaio: 110, fumacaDura: 1.5 },
    // A cenoura flutua a "altura" px do chão, balançando, e vai e volta devagar. Não anda nem investe:
    // quando vê a batata, aponta a bazuquinha ("mira", o aviso) e atira uma rodela.
    cenoura: {
      altura: 110, balanca: 7, deriva: 38, raio: 110,
      veTiro: 600, veTiroAlt: 420, mira: 0.5, lanca: 0.35, esperaTiro: 2.2, recuo: 140,
      rodelaVel: 430, rodelaDura: 1.6
    }
  };

  // x é o centro; y é o chão. Quem voa fica "altura" px acima dele.
  PB.criarInimigo = function (tipo, x, y) {
    var T = TIPOS[tipo];
    var e = {
      id: proximoId++, tipo: tipo, w: T.w, h: T.h, x: x - T.w / 2, y: y - T.h, vx: 0, vy: 0,
      vida: T.vida, olhando: -1, estado: "anda", t: 0, espera: 0, esperaTiro: 0, flash: 0, tonto: 0, morto: false,
      manso: !!T.manso, voa: !!T.voa, casaX: x, fase: 0, anim: (x * 0.013) % 6.28, balanco: 0, vBalanco: 0,
      noChao: false, parede: 0, mira: 0
    };
    if (e.voa) { e.alvoY = y - T.h - PB.INIMIGOS[tipo].altura; e.y = e.alvoY; }
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

  // A boca da bazuquinha, de onde a rodela sai: ao lado do corpo, para o lado em que a cenoura olha.
  PB.bocaDaBazuca = function (e, lado) { return { x: e.x + e.w / 2 + (lado || e.olhando) * 30, y: e.y + 30 }; };
  // Para onde a bazuquinha aponta: a batata, na hora da mira; senão, reto para a frente.
  PB.alvoDaCenoura = function (e) { var b = PB.J.batata; return { x: b.x + b.w / 2, y: b.y + b.h * 0.45 }; };

  function cenoura(e, b, dt, vivo) {
    var K = PB.INIMIGOS.cenoura, cx = e.x + e.w / 2, lado, m, alvo, d;
    // Flutuar: uma mola puxa a cenoura para a sua altura, com um balanço suave.
    var yAlvo = e.alvoY + Math.sin(e.anim * 2.4) * K.balanca;
    if (e.tonto > 0) {
      e.tonto -= dt;
      e.vx *= Math.exp(-3 * dt); e.vy *= Math.exp(-3 * dt);
    } else {
      e.vy += ((yAlvo - e.y) * 40 - e.vy * 10) * dt;
      if (e.estado === "anda") {
        if (e.parede === e.olhando || (cx - e.casaX) * e.olhando > K.raio) e.olhando = -e.olhando;
        e.vx = U.aproxima(e.vx, e.olhando * K.deriva, 300 * dt);
        if (vivo && e.esperaTiro <= 0 && verBatata(e, b, K.veTiro, K.veTiroAlt)) {
          lado = b.x + b.w / 2 >= cx ? 1 : -1; m = PB.bocaDaBazuca(e, lado); alvo = PB.alvoDaCenoura(e);
          // só mira se a rodela tiver caminho livre até a batata
          if (temVisada(m.x, m.y, alvo.x, alvo.y)) { e.olhando = lado; e.estado = "mira"; e.t = 0; PB.som("aviso"); }
        }
      } else if (e.estado === "mira") {      // aponta a bazuquinha: é o aviso do tiro
        e.vx = U.aproxima(e.vx, 0, 300 * dt);
        e.olhando = b.x + b.w / 2 >= cx ? 1 : -1;
        if (e.t >= K.mira) {
          m = PB.bocaDaBazuca(e); alvo = PB.alvoDaCenoura(e); d = Math.hypot(alvo.x - m.x, alvo.y - m.y) || 1;
          // A rodela vai reta para onde a batata está agora. Quem sai do lugar, escapa.
          PB.J.rodelas.push({ x: m.x, y: m.y, px: m.x, py: m.y, vx: (alvo.x - m.x) / d * K.rodelaVel, vy: (alvo.y - m.y) / d * K.rodelaVel, t: 0 });
          e.vx = -e.olhando * K.recuo;       // o coice da bazuquinha empurra a cenoura para trás
          e.estado = "lanca"; e.t = 0; e.esperaTiro = K.esperaTiro; PB.som("rodela");
        }
      } else {                               // "lanca": acabou de atirar, o coice passa
        e.vx = U.aproxima(e.vx, 0, 400 * dt);
        if (e.t >= K.lanca) { e.estado = "anda"; e.t = 0; }
      }
    }
    PB.mover(e, dt);
  }

  PB.atualizarInimigo = function (e, dt) {
    var J = PB.J, b = J.batata, vivo = !b.morto && b.voltando <= 0;
    e.px = e.x; e.py = e.y; e.t += dt; e.anim += dt;
    e.flash = Math.max(0, e.flash - dt); e.espera = Math.max(0, e.espera - dt); e.esperaTiro = Math.max(0, e.esperaTiro - dt);
    e.vBalanco += (-e.balanco * 180 - e.vBalanco * 7) * dt; e.balanco += e.vBalanco * dt;     // mola do tranco
    if (e.tipo === "espantalho") return;
    if (e.voa) { cenoura(e, b, dt, vivo); return; }
    if (e.tonto > 0) { e.tonto -= dt; e.vx = U.aproxima(e.vx, 0, 900 * dt); }
    else cogumelo(e, b, vivo);
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
    e.tonto = forte ? 0.5 : 0.35;
    if (e.voa) {
      // no ar, o golpe arremessa a cenoura; depois ela volta a flutuar no lugar
      e.vx = dx * (forte ? 420 : 300); e.vy = dir === "baixo" ? 280 : dir === "cima" ? -280 : -80;
      if (e.estado === "mira") { e.estado = "anda"; e.t = 0; e.esperaTiro = Math.max(e.esperaTiro, 1); }
    } else {
      e.vx = dx * (forte ? A.empurraInimigoForte : A.empurraInimigo); e.vy = -150;
      // apanhar no meio do aviso interrompe o ataque
      if (e.estado === "aviso") { e.estado = "anda"; e.t = 0; e.espera = 0.5; }
    }
  };
})();

// A batata: corrida, pulo, dash, golpes com o cajado, bola de purê e dano.
// Os números vêm todos de PB.A (arquivo ajuste.js).
(function () {
  "use strict";
  var PB = window.PB, B = PB.B, A = PB.A, U = PB.util, E = PB.entrada, M = PB.mundo, P = PB.part;
  var NADA = { esq: false, dir: false, cima: false, baixo: false, pulo: false, golpe: false, dash: false, pure: false };

  // Arco do cajado em cada golpe, em graus: 0 aponta para a frente, -90 para cima, 90 para baixo.
  PB.GOLPES = {
    frente1: { de: -125, ate: 55 },     // de cima para baixo
    frente2: { de: 75, ate: -105 },     // volta de baixo para cima
    frente3: { de: -165, ate: 80 },     // o golpe forte, mais aberto
    cima: { de: -178, ate: -8 },
    baixo: { de: 8, ate: 172 }
  };

  PB.criarBatata = function (x, chao) {
    return {
      x: x - 15, y: chao - 70, w: 30, h: 70, px: x - 15, py: chao - 70, vx: 0, vy: 0, olhando: 1,
      noChao: true, naPlataforma: false, parede: 0, atravessa: 0, tChao: 1,
      coiote: 0, memPulo: 0, pulando: false,
      dashT: 0, dashEspera: 0, dashNoAr: true, dashDir: 1, dashX0: 0, tRastro: 0,
      golpe: null, memGolpe: 0, combo: -1, tCombo: 0,
      vida: A.vida, amido: 0, invenc: 0, atordoado: 0, morto: false, tMorte: 0, voltando: 0,
      seguro: { x: x - 15, y: chao - 70 }, medPulo: null,
      // só para a animação
      es: 0, evs: 0, passo: 0, inclina: 0, cabelo: 0, cabeloY: 0, pisca: 1, rastro: [], flash: 0, pose: null
    };
  };

  PB.atualizarBatata = function (b, dt) {
    var J = PB.J, seg = J.semControle ? NADA : E.seg, ap = J.semControle ? NADA : E.ap;
    b.px = b.x; b.py = b.y;
    b.invenc = Math.max(0, b.invenc - dt); b.atordoado = Math.max(0, b.atordoado - dt); b.flash = Math.max(0, b.flash - dt);
    b.dashEspera = Math.max(0, b.dashEspera - dt); b.memPulo = Math.max(0, b.memPulo - dt); b.memGolpe = Math.max(0, b.memGolpe - dt);
    b.coiote = Math.max(0, b.coiote - dt); b.atravessa = Math.max(0, b.atravessa - dt); b.tCombo = Math.max(0, b.tCombo - dt);
    animar(b, dt);

    if (b.morto) { b.tMorte += dt; if (b.tMorte > 1.5) PB.renascer(); return; }
    if (b.voltando > 0) {       // caiu nos espinhos: some, volta para o último chão firme e reaparece
      var antes = b.voltando;
      b.voltando -= dt;
      if (antes > 0.25 && b.voltando <= 0.25) {
        b.x = b.px = b.seguro.x; b.y = b.py = b.seguro.y; b.vx = b.vy = 0; b.noChao = true;
        PB.cam.atualizar(0, b, true);
      }
      return;
    }

    var pode = b.atordoado <= 0, dirX = pode ? (seg.dir ? 1 : 0) - (seg.esq ? 1 : 0) : 0, g = b.golpe, fimDash = false;
    var cx = b.x + b.w / 2, pe = b.y + b.h;
    if (dirX && !g && b.dashT <= 0) b.olhando = dirX;

    // --- dash: uma arrancada reta, sem gravidade. No ar, só um até pousar. ---
    if (ap.dash && pode && b.dashT <= 0 && b.dashEspera <= 0 && (b.noChao || b.dashNoAr)) {
      b.dashT = A.dashTempo; b.dashDir = dirX || b.olhando; b.olhando = b.dashDir; b.dashX0 = b.x; b.tRastro = 0;
      if (!b.noChao) b.dashNoAr = false;
      b.pulando = false; b.golpe = g = null; b.es = -0.16;
      PB.som("dash"); P.poeira(cx, pe, 4, -b.dashDir * 160);
    }
    if (b.dashT > 0) {
      b.dashT -= dt; b.vx = b.dashDir * A.dashVel; b.vy = 0; fimDash = b.dashT <= 0;
      b.tRastro -= dt;
      if (b.tRastro <= 0) { b.tRastro = 0.03; b.rastro.push({ x: b.x, y: b.y, o: b.olhando, t: 0 }); }
    } else {
      // --- corrida ---
      var noAr = !b.noChao, alvo = dirX * A.velMax, taxa;
      if (g && !noAr) alvo *= 0.5;        // batendo no chão, anda mais devagar
      if (!dirX) taxa = noAr ? A.freioAr : A.freioChao;
      else {
        taxa = noAr ? A.acelAr : A.acelChao;
        if (b.vx * dirX < 0) taxa += noAr ? A.freioAr : A.freioChao;      // virar é mais rápido que arrancar
      }
      if (!pode) taxa = 600;
      b.vx = U.aproxima(b.vx, alvo, taxa * dt);
      // --- gravidade: a queda pesa mais que a subida ---
      b.vy = Math.min(b.vy + A.grav * (b.vy > 0 ? A.gravQueda : 1) * dt, A.velQuedaMax);
    }

    // --- pulo, com a tolerância da beirada (coiote) e do botão (memória) ---
    if (ap.pulo && pode) b.memPulo = A.memoriaPulo;
    if (b.memPulo > 0 && pode && (b.noChao || b.coiote > 0)) {
      b.memPulo = 0; b.coiote = 0;
      if (seg.baixo && b.naPlataforma) { b.atravessa = 0.22; b.noChao = false; }      // baixo + pulo: desce do galho
      else {
        b.vy = -A.velPulo; b.pulando = true; b.noChao = false; b.es = 0.2;
        if (b.dashT > 0) { b.dashT = 0; b.dashEspera = A.dashEspera; fimDash = false; J.med.dash = Math.abs(b.x - b.dashX0); }   // pular corta o dash e leva o embalo
        b.medPulo = { x0: b.x, y0: b.y, yMin: b.y, t: 0 };
        PB.som("pulo"); P.poeira(cx, pe, 3, 0);
      }
    }
    if (b.pulando) {
      if (b.vy >= 0) b.pulando = false;
      else if (!seg.pulo) { b.vy *= A.cortePulo; b.pulando = false; }       // soltou cedo: pulo curto
    }

    // --- golpe ---
    if (ap.golpe && pode) b.memGolpe = A.memoriaGolpe;
    if (b.memGolpe > 0 && pode && !g && b.dashT <= 0) {
      var dir = seg.cima ? "cima" : (seg.baixo && !b.noChao) ? "baixo" : "frente";
      b.combo = dir === "frente" && b.tCombo > 0 ? (b.combo + 1) % 3 : 0;
      var forte = dir === "frente" && b.combo === 2;
      if (dirX) b.olhando = dirX;
      g = b.golpe = {
        dir: dir, nome: dir === "frente" ? "frente" + (b.combo + 1) : dir, t: 0, forte: forte, acertou: [], quicou: false, recuou: false,
        total: A.golpePreparo + A.golpeAtivo + (forte ? A.golpeRecuperaForte : A.golpeRecupera)
      };
      b.memGolpe = 0; J.stats.golpes++; PB.som("golpe");
    }
    if (g) {
      g.t += dt;
      if (g.t >= A.golpePreparo && g.t < A.golpePreparo + A.golpeAtivo) acertar(b, g);
      if (g.t >= g.total) { b.golpe = null; b.tCombo = A.janelaCombo; }
    }

    // --- bola de purê ---
    if (ap.pure && pode && b.amido >= A.custoPure && b.dashT <= 0) {
      b.amido -= A.custoPure; b.es = -0.12; b.vx -= b.olhando * 140;
      J.tiros.push({ x: cx + b.olhando * 22, px: cx + b.olhando * 22, y: b.y + 26, vx: b.olhando * A.pureVel, t: 0 });
      PB.som("pure");
    }

    // --- mover e pousar ---
    var antesChao = b.noChao, vyAntes = b.vy;
    PB.mover(b, dt);
    if (fimDash) { J.med.dash = Math.abs(b.x - b.dashX0); b.vx = b.dashDir * A.velMax; b.dashEspera = A.dashEspera; }
    if (b.medPulo) { b.medPulo.t += dt; if (b.y < b.medPulo.yMin) b.medPulo.yMin = b.y; }
    if (b.noChao) {
      b.coiote = A.coiote; b.dashNoAr = true; b.tChao += dt;
      if (!antesChao) {
        b.es = -U.clamp(vyAntes / 900, 0.25, 1) * 0.24;
        if (vyAntes > 240) { PB.som("pouso"); P.poeira(b.x + b.w / 2, b.y + b.h, 4, 0); }
        if (b.medPulo) {
          J.med.pulo = { altura: b.medPulo.y0 - b.medPulo.yMin, tempo: b.medPulo.t, dist: Math.abs(b.x - b.medPulo.x0) };
          b.medPulo = null;
        }
      }
      // Guarda o último chão firme: é para lá que a batata volta se cair nos espinhos.
      if (b.tChao > 0.12 && M.pisavel(b.x + 2, b.y + b.h + 2) && M.pisavel(b.x + b.w - 2, b.y + b.h + 2)) { b.seguro.x = b.x; b.seguro.y = b.y; }
    } else b.tChao = 0;

    if (tocaEspinho(b)) PB.ferirBatata(1, 0, "espinho");
  };

  function animar(b, dt) {
    // mola do "estica e achata"
    b.evs += (-b.es * 260 - b.evs * 15) * dt; b.es += b.evs * dt;
    var vel = Math.abs(b.vx), frente = b.vx * b.olhando / A.velMax;
    if (b.noChao && vel > 30) b.passo += vel * dt * 0.042;
    b.inclina += ((b.dashT > 0 ? 0.3 : U.clamp(frente, -1, 1) * 0.1) - b.inclina) * (1 - Math.exp(-dt * 14));
    b.cabelo += (U.clamp(-frente * 9, -12, 12) - b.cabelo) * (1 - Math.exp(-dt * 9));
    b.cabeloY += (U.clamp(b.noChao ? 0 : -b.vy * 0.012, -9, 9) - b.cabeloY) * (1 - Math.exp(-dt * 9));
    b.pisca += dt; if (b.pisca > 3.6) b.pisca = 0;
    for (var i = b.rastro.length - 1; i >= 0; i--) { b.rastro[i].t += dt; if (b.rastro[i].t > 0.22) b.rastro.splice(i, 1); }
  }

  // Área que o golpe acerta, conforme a direção.
  function caixaGolpe(b, g) {
    var cx = b.x + b.w / 2, al = A.alcance;
    if (g.dir === "cima") return { x: cx - 46, y: b.y - al + 12, w: 92, h: al };
    if (g.dir === "baixo") return { x: cx - 42, y: b.y + b.h - 14, w: 84, h: al - 10 };
    return { x: b.olhando > 0 ? cx - 4 : cx + 4 - (al + 8), y: b.y - 14, w: al + 8, h: b.h + 14 };
  }
  PB.caixaGolpe = caixaGolpe;

  function espinhoNaCaixa(r) {
    var c0 = Math.floor(r.x / B), c1 = Math.floor((r.x + r.w) / B), l0 = Math.floor(r.y / B), l1 = Math.floor((r.y + r.h) / B), c, l;
    for (l = l0; l <= l1; l++) for (c = c0; c <= c1; c++) if (M.tile(c, l) === 3 && r.y + r.h > l * B + 16) return true;
    return false;
  }

  function acertar(b, g) {
    var caixa = caixaGolpe(b, g), J = PB.J, bateu = false, i, e, r, dx;
    for (i = 0; i < J.inimigos.length; i++) {
      e = J.inimigos[i];
      if (e.morto || g.acertou.indexOf(e.id) >= 0 || !PB.sobrepoe(caixa, e)) continue;
      g.acertou.push(e.id);
      dx = g.dir === "frente" ? b.olhando : (e.x + e.w / 2 >= b.x + b.w / 2 ? 1 : -1);
      PB.ferirInimigo(e, g.forte ? A.danoForte : A.danoGolpe, dx, g.forte, g.dir);
      bateu = true;
    }
    // Rodela no caminho do cajado é rebatida: desmancha, solta faíscas e rende 1 de amido.
    for (i = J.rodelas.length - 1; i >= 0; i--) {
      r = J.rodelas[i];
      if (r.x + 20 < caixa.x || r.x - 20 > caixa.x + caixa.w || r.y + 12 < caixa.y || r.y - 12 > caixa.y + caixa.h) continue;
      J.rodelas.splice(i, 1); bateu = true; J.stats.rebatidas++;
      J.pausa = Math.max(J.pausa, 0.045); PB.cam.tremer(0.18); PB.som("acerto");
      P.faiscas(r.x, r.y, 8, -r.vx, -r.vy, false); P.pedacos(r.x, r.y, 4, ["#e8a653", "#f4c27a"], 300);
      b.amido = Math.min(A.amidoMax, b.amido + 1);
    }
    // O golpe para baixo também quica nos espinhos.
    if (!bateu && g.dir === "baixo" && !g.quicou && espinhoNaCaixa(caixa)) {
      bateu = true; J.pausa = Math.max(J.pausa, 0.04); PB.som("acerto");
      P.faiscas(b.x + b.w / 2, caixa.y + caixa.h - 20, 7, 0, -1, false);
    }
    if (!bateu) return;
    if (g.dir === "baixo") {
      if (!g.quicou) { g.quicou = true; b.vy = -A.velPulo * A.quique; b.pulando = false; b.dashNoAr = true; b.es = 0.16; }
    } else if (g.dir === "frente" && !g.recuou) { g.recuou = true; b.vx = -b.olhando * A.recuoGolpe; }
  }

  function tocaEspinho(b) {
    var c0 = Math.floor(b.x / B), c1 = Math.floor((b.x + b.w) / B), l0 = Math.floor(b.y / B), l1 = Math.floor((b.y + b.h) / B), c, l;
    for (l = l0; l <= l1; l++) for (c = c0; c <= c1; c++) {
      if (M.tile(c, l) === 3 && b.y + b.h > l * B + 20 && b.x + b.w > c * B + 6 && b.x < (c + 1) * B - 6) return true;
    }
    return false;
  }

  // dirX: para que lado a batata é empurrada. origem "espinho" faz voltar ao último chão firme.
  PB.ferirBatata = function (dano, dirX, origem) {
    var J = PB.J, b = J.batata, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (b.morto || b.voltando > 0) return false;
    var protegida = b.invenc > 0;
    if (protegida && origem !== "espinho") return false;
    if (!protegida) { b.vida -= dano; J.stats.dano += dano; }
    b.invenc = A.invencivel; b.flash = 0.12; b.golpe = null; b.dashT = 0; b.pulando = false;
    J.pausa = Math.max(J.pausa, A.pausaDano); J.clarao = 0.25;
    PB.cam.tremer(0.55); PB.som("dano");
    P.pedacos(cx, cy, 6, ["#f6f1bb", "#ddd38e", "#8f6f4d"], 360);
    if (b.vida <= 0) {
      b.vida = 0; b.morto = true; b.tMorte = 0; b.vx = b.vy = 0; J.stats.mortes++;
      PB.som("morre");
      // a batata partida ao meio, como no final trágico da visual novel
      P.soltar({ tipo: "metade", lado: -1, x: cx, y: cy, vx: -150, vy: -430, dur: 1.3, grav: 1500, rot: 0, vr: -5 });
      P.soltar({ tipo: "metade", lado: 1, x: cx, y: cy, vx: 150, vy: -470, dur: 1.3, grav: 1500, rot: 0, vr: 6 });
      return true;
    }
    if (origem === "espinho") { b.voltando = 0.5; b.vx = b.vy = 0; }
    else { b.atordoado = A.atordoado; b.vx = (dirX || -b.olhando) * A.empurraDano; b.vy = -300; b.noChao = false; }
    return true;
  };
})();

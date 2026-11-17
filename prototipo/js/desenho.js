// Tudo o que aparece na tela é desenhado aqui, por código. É arte provisória, feita olhando os
// desenhos da visual novel: a batata clara de cabelo castanho, o cajado que solta faíscas, o
// cogumelo azul, a cenoura de moicano, a rodela cortadora que ela atira e a floresta à noite.
(function () {
  "use strict";
  var PB = window.PB, B = PB.B, A = PB.A, U = PB.util, M = PB.mundo, C = PB.cam, L = PB.LARG, H = PB.ALT;
  var TAU = Math.PI * 2, RAD = Math.PI / 180, relogio = 0, cache = {}, PED = 16, MARG = 4;
  var COR = {
    casca: "#f6f1bb", cascaSombra: "#ddd38e", traco: "#5d4a34", raiz: "#8f6f4d", raizEscura: "#6f5338", cabelo: "#6b4a2f", olho: "#9fdde0",
    madeira: "#7a4f2a", musgo: "#4f7d5c", grama: "#79b383", galho: "#d9cfa6", galhoSombra: "#a2966f",
    chapeu: "#b2aff0", pinta: "#2f35c0", caule: "#f1e6e2", cenoura: "#f2a33c", rodela: "#e8a653"
  };
  var PINTAS = [[-10, -30], [7, -22], [14, -44], [-14, -52], [2, -15], [-5, -68], [-16, -38]];

  PB.limparCache = function () { cache = {}; };

  function elipse(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  function mistura(a, b, p) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    return "rgb(" + (U.lerp(x >> 16, y >> 16, p) | 0) + "," + (U.lerp((x >> 8) & 255, (y >> 8) & 255, p) | 0) + "," + (U.lerp(x & 255, y & 255, p) | 0) + ")";
  }
  function luz(ctx, x, y, r, forca) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,196,110," + forca + ")"); g.addColorStop(1, "rgba(255,150,60,0)");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // ---------- quadro inteiro ----------
  PB.desenhar = function (ctx, alfa, dtReal) {
    var J = PB.J, b = J.batata, esc = PB.escala || 1, t = J.tempo, i, e, o;
    relogio += dtReal;
    var camX = U.lerp(C.px, C.x, alfa), camY = U.lerp(C.py, C.y, alfa), tr = C.trauma * C.trauma * 15;
    camX += Math.sin(relogio * 83) * tr; camY += Math.cos(relogio * 97) * tr * 0.8;

    ctx.setTransform(esc, 0, 0, esc, 0, 0);
    fundo(ctx, camX, camY, relogio);
    ctx.save(); ctx.translate(-camX, -camY);
    tunel(ctx, J.inicio.y);
    chao(ctx, camX, esc);
    if (J.meta) { caverna(ctx, J.meta.x + 216, J.meta.y); vidente(ctx, J.meta.x + 96, J.meta.y, relogio); }
    for (i = 0; i < J.placas.length; i++) placa(ctx, J.placas[i]);
    for (i = 0; i < J.tochas.length; i++) tocha(ctx, J.tochas[i], relogio);
    for (i = 0; i < J.inimigos.length; i++) {
      e = J.inimigos[i];
      if (e.morto) continue;
      var ex = U.lerp(e.px, e.x, alfa), ey = U.lerp(e.py, e.y, alfa);
      if (ex > camX + L + 140 || ex + e.w < camX - 140) continue;
      DESENHO[e.tipo](ctx, e, ex, ey, t);
    }
    for (i = 0; i < J.nuvens.length; i++) nuvem(ctx, J.nuvens[i], relogio);
    for (i = 0; i < J.rodelas.length; i++) { o = J.rodelas[i]; rodelaNoAr(ctx, U.lerp(o.px, o.x, alfa), U.lerp(o.py, o.y, alfa), o.t * 26, 0.85, false); }
    var ponta = desenhaBatata(ctx, b, U.lerp(b.px, b.x, alfa), U.lerp(b.py, b.y, alfa), t, dtReal);
    for (i = 0; i < J.tiros.length; i++) pure(ctx, J.tiros[i], alfa);
    particulas(ctx);
    // luzes: somam claridade por cima de tudo
    ctx.globalCompositeOperation = "lighter";
    if (ponta) luz(ctx, ponta.x, ponta.y, b.golpe ? 150 : 110, 0.22);
    for (i = 0; i < J.tochas.length; i++) { o = J.tochas[i]; if (o.acesa) luz(ctx, o.x + 5, o.y - 84, 190, 0.26); }
    if (J.meta) luz(ctx, J.meta.x + 66, J.meta.y - 136, 170, 0.22);
    ctx.globalCompositeOperation = "source-over";
    if (J.medidas) caixas(ctx, J, b);
    ctx.restore();

    frente(ctx, camX, camY);
    hud(ctx, b);
    var escuro = J.escuro;
    if (b.morto) escuro = Math.max(escuro, U.clamp((b.tMorte - 0.9) / 0.5, 0, 1));
    if (b.voltando > 0) escuro = Math.max(escuro, 1 - Math.abs(b.voltando - 0.25) / 0.25);
    if (J.clarao > 0) { ctx.fillStyle = "rgba(255,70,60," + (J.clarao * 0.9).toFixed(3) + ")"; ctx.fillRect(0, 0, L, H); }
    if (escuro > 0) { ctx.fillStyle = "rgba(8,6,14," + Math.min(1, escuro).toFixed(3) + ")"; ctx.fillRect(0, 0, L, H); }
  };

  // ---------- fundo: céu, lua, três camadas de troncos, névoa e vagalumes ----------
  function fundo(ctx, camX, camY, t) {
    var g = ctx.createLinearGradient(0, 0, 0, H), i;
    g.addColorStop(0, "#15122a"); g.addColorStop(0.45, "#2a2644"); g.addColorStop(0.8, "#3b4c4b"); g.addColorStop(1, "#2d3d38");
    ctx.fillStyle = g; ctx.fillRect(0, 0, L, H);
    for (i = 0; i < 46; i++) {
      ctx.fillStyle = "rgba(230,234,255," + (0.3 + 0.3 * Math.sin(t * 1.5 + i * 1.9)).toFixed(2) + ")";
      ctx.fillRect(U.acaso(i, 1) * L, U.acaso(i, 2) * H * 0.5, 2, 2);
    }
    var lx = 960 - camX * 0.02, ly = 140 - camY * 0.04;
    g = ctx.createRadialGradient(lx, ly, 20, lx, ly, 300);
    g.addColorStop(0, "rgba(206,216,255,0.34)"); g.addColorStop(1, "rgba(206,216,255,0)");
    ctx.fillStyle = g; ctx.fillRect(lx - 300, ly - 300, 600, 600);
    ctx.fillStyle = "#e9ecff"; elipse(ctx, lx, ly, 36, 36); ctx.fill();
    ctx.fillStyle = "rgba(170,180,230,0.35)"; elipse(ctx, lx - 10, ly - 6, 9, 7); ctx.fill(); elipse(ctx, lx + 12, ly + 10, 6, 5); ctx.fill();

    troncos(ctx, camX, camY, 0.12, 0, "#353050", 54, 150, "rgba(190,200,255,0.10)");
    nevoa(ctx, 0.35, "rgba(92,128,112,0.20)");
    troncos(ctx, camX, camY, 0.3, 1, "#2a2540", 92, 250, "rgba(190,200,255,0.10)");
    nevoa(ctx, 0.5, "rgba(92,128,112,0.18)");
    troncos(ctx, camX, camY, 0.55, 2, "#201c31", 140, 380, "rgba(190,200,255,0.12)");

    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < 22; i++) {
      var fx = (U.acaso(i, 11) * 2600 - camX * 0.7 + Math.sin(t * 0.5 + i) * 30) % 1500;
      if (fx < 0) fx += 1500;
      fx -= 110;
      var fy = 240 + U.acaso(i, 12) * 380 + Math.sin(t * 0.8 + i * 2.1) * 22 - camY * 0.5, br = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
      ctx.fillStyle = "rgba(214,240,138," + (0.1 * br).toFixed(3) + ")"; elipse(ctx, fx, fy, 9, 9); ctx.fill();
      ctx.fillStyle = "rgba(236,255,170," + (0.75 * br).toFixed(3) + ")"; elipse(ctx, fx, fy, 1.8, 1.8); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }
  function nevoa(ctx, y0, cor) {
    var g = ctx.createLinearGradient(0, H * y0, 0, H);
    g.addColorStop(0, "rgba(92,128,112,0)"); g.addColorStop(1, cor);
    ctx.fillStyle = g; ctx.fillRect(0, H * y0, L, H * (1 - y0));
  }
  // Troncos largos e tortos, como os do fundo "floresta noite". fator = quanto a camada anda com a câmera.
  function troncos(ctx, camX, camY, fator, s, cor, larg, passo, borda) {
    var desloc = camX * fator, dy = -camY * fator * 0.5, i, k;
    for (i = Math.floor((desloc - 260) / passo); i <= Math.floor((desloc + L + 260) / passo); i++) {
      var x = i * passo + (U.acaso(i, s) - 0.5) * passo * 0.6 - desloc, w = larg * (0.65 + U.acaso(i, s + 7) * 0.7);
      var curva = (U.acaso(i, s + 3) - 0.5) * 90, base = w * 0.35, e = x - w / 2, d = x + w / 2;
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.moveTo(e + curva * 0.3, -60 + dy);
      ctx.bezierCurveTo(e + curva, 220 + dy, e - curva * 0.6, 470 + dy, e - base, H + 70 + dy);
      ctx.lineTo(d + base, H + 70 + dy);
      ctx.bezierCurveTo(d - curva * 0.6, 470 + dy, d + curva, 220 + dy, d + curva * 0.3, -60 + dy);
      ctx.closePath(); ctx.fill();
      for (k = 0; k < 3; k++) {       // a beirada clara da lua e dois riscos de casca
        var q = k === 0 ? d - 3 : e + w * (0.3 + k * 0.18);
        ctx.strokeStyle = k === 0 ? borda : "rgba(0,0,0,0.16)"; ctx.lineWidth = k === 0 ? 2.5 : 2;
        ctx.beginPath(); ctx.moveTo(q + curva * 0.3, -60 + dy);
        ctx.bezierCurveTo(q + curva, 220 + dy, q - curva * 0.6, 470 + dy, q + (k === 0 ? base : 0), H + 70 + dy);
        ctx.stroke();
      }
    }
  }
  function frente(ctx, camX, camY) {
    var i, k, g;
    // névoa verde rente ao chão, como na floresta da visual novel
    g = ctx.createLinearGradient(0, H * 0.62, 0, H);
    g.addColorStop(0, "rgba(96,140,118,0)"); g.addColorStop(1, "rgba(96,140,118,0.20)");
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.62, L, H * 0.38);
    // folhas escuras bem perto da câmera
    ctx.fillStyle = "rgba(10,8,18,0.92)";
    for (i = Math.floor((camX * 1.35 - 300) / 560); i <= Math.floor((camX * 1.35 + L + 300) / 560); i++) {
      var fx = i * 560 + U.acaso(i, 81) * 260 - camX * 1.35;
      for (k = 0; k < 6; k++) { elipse(ctx, fx + k * 30 - 70, -14 + U.acaso(i * 7 + k, 82) * 44 - camY * 0.25, 48, 14, 0.5 + U.acaso(i * 7 + k, 83) * 0.9); ctx.fill(); }
    }
    g = ctx.createRadialGradient(L / 2, H / 2, 280, L / 2, H / 2, 800);
    g.addColorStop(0, "rgba(8,6,16,0)"); g.addColorStop(1, "rgba(8,6,16,0.62)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, L, H);
  }

  // ---------- chão ----------
  // O chão é pintado uma vez por pedaço de 16 blocos e guardado; a cada quadro só se copia a imagem.
  function chao(ctx, camX, esc) {
    var larg = PED * B, p0 = Math.floor(camX / larg), p1 = Math.floor((camX + L) / larg), p, k, cv;
    for (k in cache) if (k < p0 - 1 || k > p1 + 1) delete cache[k];
    for (p = p0; p <= p1; p++) {
      if (p < 0 || p * PED >= M.larg) continue;
      cv = cache[p] || (cache[p] = pintarPedaco(p, esc));
      ctx.drawImage(cv, p * larg - MARG, 0, cv.width / esc, cv.height / esc);
    }
  }
  function pintarPedaco(p, esc) {
    var cv = document.createElement("canvas"), c0 = p * PED, col, l, tp;
    cv.width = Math.ceil((PED * B + MARG * 2) * esc); cv.height = Math.ceil(M.alt * B * esc);
    var c = cv.getContext("2d");
    c.setTransform(esc, 0, 0, esc, (MARG - c0 * B) * esc, 0);
    for (col = c0 - 1; col <= c0 + PED; col++) for (l = 0; l < M.alt; l++) if (M.tile(col, l) === 1) terra(c, col, l, col * B, l * B);
    for (col = c0 - 1; col <= c0 + PED; col++) for (l = 0; l < M.alt; l++) {
      tp = M.tile(col, l);
      if (tp === 1 && M.tile(col, l - 1) !== 1) gramado(c, col, col * B, l * B);
      else if (tp === 2) galho(c, col, l, col * B, l * B);
      else if (tp === 3) espinheiro(c, col, col * B, l * B);
    }
    return cv;
  }
  function terra(c, col, l, x, y) {
    var prof = 0, i, r;
    while (prof < 4 && M.tile(col, l - 1 - prof) === 1) prof++;
    c.fillStyle = ["#3d3149", "#33293f", "#2b2236", "#241c2e", "#1f1828"][prof];
    c.fillRect(x - 0.5, y - 0.5, B + 1, B + 1);
    for (i = 0; i < 3; i++) {
      r = U.acaso(col * 31 + l * 17 + i, 5);
      c.fillStyle = r > 0.5 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.16)";
      elipse(c, x + U.acaso(col + i * 9, l) * B, y + U.acaso(l + i * 5, col) * B, 3 + r * 5, 2 + r * 3, r * 3); c.fill();
    }
    if (M.tile(col - 1, l) !== 1) { c.fillStyle = "rgba(170,160,210,0.10)"; c.fillRect(x, y, 3, B); }
    if (M.tile(col + 1, l) !== 1) { c.fillStyle = "rgba(170,160,210,0.16)"; c.fillRect(x + B - 3, y, 3, B); }
  }
  function gramado(c, col, x, y) {
    var i;
    c.fillStyle = COR.musgo;
    c.beginPath(); c.moveTo(x - 0.5, y); c.lineTo(x + B + 0.5, y); c.lineTo(x + B + 0.5, y + 9);
    for (i = 3; i >= 0; i--) c.quadraticCurveTo(x + i * 12 + 6, y + 9 + U.acaso(col * 4 + i, 21) * 9, x + i * 12, y + 8 + U.acaso(col * 4 + i, 22) * 3);
    c.closePath(); c.fill();
    c.fillStyle = "rgba(160,220,160,0.5)"; c.fillRect(x - 0.5, y, B + 1, 2.5);
    c.lineWidth = 2.2; c.lineCap = "round";
    for (i = 0; i < 6; i++) {
      var gx = x + (i + U.acaso(col * 6 + i, 23)) * 8, h = 6 + U.acaso(col * 6 + i, 24) * 11, inc = (U.acaso(col * 6 + i, 25) - 0.5) * 9;
      c.strokeStyle = i % 2 ? COR.grama : "#5c9a6c";
      c.beginPath(); c.moveTo(gx, y + 2); c.quadraticCurveTo(gx + inc * 0.3, y - h * 0.6, gx + inc, y - h); c.stroke();
    }
  }
  function galho(c, col, l, x, y) {
    c.fillStyle = COR.galhoSombra; c.fillRect(x - 0.5, y + 7, B + 1, 8);
    c.fillStyle = COR.galho; c.fillRect(x - 0.5, y, B + 1, 9);
    c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(x - 0.5, y, B + 1, 2);
    c.strokeStyle = "rgba(90,70,40,0.35)"; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x + 6 + U.acaso(col, 31) * 10, y + 5); c.lineTo(x + 26 + U.acaso(col, 32) * 14, y + 6); c.stroke();
    if (M.tile(col - 1, l) !== 2) caracol(c, x, y + 7, -1);
    if (M.tile(col + 1, l) !== 2) caracol(c, x + B, y + 7, 1);
    if (U.acaso(col, 33) > 0.45) { c.fillStyle = COR.musgo; elipse(c, x + 10 + U.acaso(col, 34) * 28, y + 21, 4, 8, 0.4); c.fill(); }
  }
  // A ponta enrolada dos galhos claros, tirada do desenho da casa do vidente.
  function caracol(c, x, y, lado) {
    var cx = x + lado * 2, cy = y - 14, i, a, r;
    c.strokeStyle = COR.galho; c.lineWidth = 7; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath();
    for (i = 0; i <= 24; i++) { a = i / 24 * Math.PI * 2.6; r = 14 - i * 0.44; c.lineTo(cx + lado * Math.sin(a) * r, cy + Math.cos(a) * r); }
    c.stroke();
  }
  function espinheiro(c, col, x, y) {
    var base = y + B, i;
    c.strokeStyle = "#3a2c4d"; c.lineWidth = 5; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - 2, base - 6);
    c.quadraticCurveTo(x + 12, base - 20 - U.acaso(col, 41) * 8, x + 24, base - 8);
    c.quadraticCurveTo(x + 36, base - 22 - U.acaso(col, 42) * 8, x + B + 2, base - 6); c.stroke();
    for (i = 0; i < 4; i++) {
      var tx = x + 6 + i * 12 + (U.acaso(col * 4 + i, 43) - 0.5) * 5, th = 24 + U.acaso(col * 4 + i, 44) * 12, inc = (U.acaso(col * 4 + i, 45) - 0.5) * 10;
      c.fillStyle = "#4a3a63"; c.beginPath(); c.moveTo(tx - 5, base); c.lineTo(tx + inc, base - th); c.lineTo(tx + 5, base); c.closePath(); c.fill();
      c.fillStyle = "#cdb8ea"; c.beginPath(); c.moveTo(tx + inc * 0.72 - 1.6, base - th * 0.72); c.lineTo(tx + inc, base - th); c.lineTo(tx + inc * 0.72 + 1.6, base - th * 0.72); c.closePath(); c.fill();
    }
  }

  // ---------- cenário fixo ----------
  function tunel(ctx, y) {      // a saída da passagem secreta, de onde a batata vem
    ctx.fillStyle = "#4b4759"; ctx.beginPath(); ctx.moveTo(96, y); ctx.lineTo(96, y - 170);
    ctx.bezierCurveTo(170, y - 190, 250, y - 120, 262, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#5d5870"; ctx.beginPath(); ctx.moveTo(96, y - 170);
    ctx.bezierCurveTo(150, y - 182, 210, y - 150, 236, y - 96); ctx.bezierCurveTo(190, y - 140, 140, y - 152, 96, y - 150); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#0d0b15"; ctx.beginPath(); ctx.moveTo(112, y); ctx.bezierCurveTo(108, y - 110, 214, y - 110, 212, y); ctx.closePath(); ctx.fill();
  }
  function caverna(ctx, x, y) {   // a casa do vidente: boca escura, cipós e galhos claros enrolados
    var i;
    ctx.fillStyle = "#0e0b16"; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.bezierCurveTo(x - 8, y - 190, x + 150, y - 190, x + 150, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COR.galho; ctx.lineWidth = 8; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x + 8, y - 142); ctx.quadraticCurveTo(x + 70, y - 204, x + 132, y - 142); ctx.stroke();
    caracol(ctx, x + 10, y - 135, -1); caracol(ctx, x + 130, y - 135, 1);
    ctx.strokeStyle = "#3f7d4b"; ctx.lineWidth = 3;
    for (i = 0; i < 6; i++) {
      var vx = x + 10 + i * 24;
      ctx.beginPath(); ctx.moveTo(vx, y - 160 + Math.abs(i - 2.5) * 14); ctx.quadraticCurveTo(vx + 7, y - 118, vx - 3, y - 74 + U.acaso(i, 61) * 32); ctx.stroke();
    }
  }
  function vidente(ctx, x, y, t) {    // Esfrishe esperando na porta, com o cajado de chama
    var bob = Math.sin(t * 1.6) * 2, i;
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = "#2a2233"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-8, -26); ctx.lineTo(-10, 0); ctx.moveTo(8, -26); ctx.lineTo(10, 0); ctx.stroke();
    ctx.strokeStyle = "#8a3f2a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-30, -130); ctx.stroke();
    ctx.translate(0, bob);
    ctx.fillStyle = "#f2d426"; ctx.strokeStyle = COR.traco; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-22, -82); ctx.lineTo(22, -82); ctx.lineTo(17, -24); ctx.lineTo(-17, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#3f8f3a"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-17, -76); ctx.lineTo(0, -46); ctx.lineTo(17, -76); ctx.moveTo(-13, -54); ctx.lineTo(0, -32); ctx.lineTo(13, -54); ctx.stroke();
    ctx.fillStyle = "#c98a4a"; ctx.strokeStyle = COR.traco; ctx.lineWidth = 2; elipse(ctx, 0, -98, 17, 16); ctx.fill(); ctx.stroke();
    for (i = -3; i <= 3; i++) {
      ctx.fillStyle = i % 2 ? "#f0a455" : "#f6c684";
      ctx.beginPath(); ctx.moveTo(i * 5 - 4, -108); ctx.lineTo(i * 7 + Math.sin(t * 2 + i) * 1.5, -134 - (3 - Math.abs(i)) * 5); ctx.lineTo(i * 5 + 4, -108); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "#1c1420"; elipse(ctx, -6, -100, 2.2, 2.6); ctx.fill(); elipse(ctx, 6, -100, 2.2, 2.6); ctx.fill();
    ctx.strokeStyle = "#1c1420"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-7, -91); ctx.lineTo(-4, -89); ctx.lineTo(-1, -91); ctx.lineTo(2, -89); ctx.lineTo(5, -91); ctx.lineTo(7, -89); ctx.stroke();
    ctx.restore();
    chama(ctx, x - 30, y - 136, 1.4, t);
  }
  function placa(ctx, p) {
    ctx.fillStyle = "#5d452c"; ctx.fillRect(p.x - 3, p.y - 46, 6, 46);
    ctx.fillStyle = "#8a6a44"; ctx.strokeStyle = "#4a3520"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(p.x - 20, p.y - 66, 40, 27); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f3e7c0"; ctx.font = "700 22px 'Baloo 2', 'Trebuchet MS', sans-serif"; ctx.textAlign = "center"; ctx.fillText("!", p.x, p.y - 45);
  }
  function tocha(ctx, o, t) {      // um cajado fincado no chão: aceso, vira o ponto de volta
    ctx.strokeStyle = COR.madeira; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(o.x - 4, o.y); ctx.quadraticCurveTo(o.x - 1, o.y - 40, o.x + 5, o.y - 78); ctx.stroke();
    if (o.acesa) chama(ctx, o.x + 5, o.y - 84, 1.5, t);
    else { ctx.fillStyle = "#4a4150"; elipse(ctx, o.x + 5, o.y - 84, 7, 7); ctx.fill(); ctx.fillStyle = "#b0603a"; elipse(ctx, o.x + 6, o.y - 85, 2.2, 2.2); ctx.fill(); }
  }
  // A chama do cajado, com os respingos coloridos do desenho original.
  function chama(ctx, x, y, tam, t) {
    var r = 8 * tam * (1 + Math.sin(t * 17 + x) * 0.08 + Math.sin(t * 29) * 0.05), g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.9), i;
    g.addColorStop(0, "rgba(255,250,214,1)"); g.addColorStop(0.35, "rgba(255,196,90,0.95)"); g.addColorStop(0.7, "rgba(255,120,50,0.45)"); g.addColorStop(1, "rgba(255,90,40,0)");
    ctx.fillStyle = g; elipse(ctx, x, y, r * 1.9, r * 1.9); ctx.fill();
    var cores = ["#7fd8ff", "#ff6f61", "#ffd27a"];
    for (i = 0; i < 3; i++) {
      var a = t * (2.4 + i * 0.7) + i * 2.1, rr = r * (1.25 + 0.3 * Math.sin(t * 3 + i));
      ctx.fillStyle = cores[i]; elipse(ctx, x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.6 * tam, 1.6 * tam); ctx.fill();
    }
  }

  // ---------- a batata ----------
  function corpoBatata(c) {
    c.beginPath(); c.moveTo(0, -82);
    c.bezierCurveTo(16, -82, 22, -64, 23, -44);
    c.bezierCurveTo(25, -22, 18, -8, 0, -8);
    c.bezierCurveTo(-18, -8, -25, -22, -23, -44);
    c.bezierCurveTo(-22, -64, -16, -82, 0, -82);
    c.closePath();
  }
  function membro(c, x0, y0, x1, y1, cor, larg, dobra) {
    c.strokeStyle = cor; c.lineWidth = larg; c.lineCap = "round";
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (dobra || 0), (y0 + y1) / 2, x1, y1); c.stroke();
  }
  // Tempos do desenho do golpe. A varrida do cajado começa um pouco antes de a área de acerto ligar:
  // assim, no quadro em que o golpe acerta (e o mundo congela), o cajado já está apontando para o alvo.
  function temposGolpe(g) {
    var av = Math.min(0.03, A.golpePreparo * 0.6);
    return { puxa: A.golpePreparo - av, ta: g.t - (A.golpePreparo - av), varre: A.golpeAtivo + av, rec: g.total - A.golpePreparo - A.golpeAtivo };
  }
  // Ângulo do cajado ao longo do golpe: puxa para trás, varre rápido e passa um pouco do fim.
  function anguloGolpe(g) {
    var G = PB.GOLPES[g.nome], s = G.ate > G.de ? 1 : -1, T = temposGolpe(g);
    if (T.ta < 0) return G.de - s * 14 * U.saiRapido(g.t / T.puxa);
    if (T.ta < T.varre) return U.lerp(G.de - s * 14, G.ate, U.saiRapido(T.ta / T.varre));
    return G.ate + s * 8 * U.saiRapido(Math.min(1, (T.ta - T.varre) / T.rec));
  }
  // O rastro do golpe: uma meia-lua que afina para trás.
  function rastroGolpe(ctx, a0, a1, raio, alpha, forte) {
    var n = 14, i, a, larg = forte ? 46 : 34;
    ctx.beginPath();
    for (i = 0; i <= n; i++) { a = (a0 + (a1 - a0) * i / n) * RAD; ctx.lineTo(Math.cos(a) * raio, Math.sin(a) * raio); }
    for (i = n; i >= 0; i--) { a = (a0 + (a1 - a0) * i / n) * RAD; var rr = raio - larg * Math.pow(i / n, 1.5); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath();
    var g = ctx.createRadialGradient(0, 0, raio - larg - 6, 0, 0, raio);
    g.addColorStop(0, "rgba(255,190,90,0)"); g.addColorStop(0.6, "rgba(255,226,150," + (0.55 * alpha).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,255,240," + (0.95 * alpha).toFixed(3) + ")");
    ctx.fillStyle = g; ctx.fill();
  }
  function cajado(ctx, mx, my, ang, t, tam, br) {
    ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
    ctx.strokeStyle = br ? "#ffffff" : COR.madeira; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(20, -2.5, 62, 0); ctx.stroke();
    ctx.strokeStyle = "rgba(255,230,190,0.35)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-14, -1.4); ctx.lineTo(52, -1.6); ctx.stroke();
    chama(ctx, 66, 0, tam, t);
    ctx.restore();
  }

  function desenhaBatata(ctx, b, x, y, t, dtReal) {
    var i, r;
    for (i = 0; i < b.rastro.length; i++) {       // as sombras do dash
      r = b.rastro[i];
      ctx.save(); ctx.globalAlpha = 0.32 * (1 - r.t / 0.22); ctx.translate(r.x + b.w / 2, r.y + b.h); ctx.scale(r.o * 1.22, 0.84);
      ctx.fillStyle = "#c9f1ee"; corpoBatata(ctx); ctx.fill(); ctx.restore();
    }
    if (b.morto || (b.voltando > 0 && b.voltando < 0.3)) return null;

    var g = b.golpe, noAr = !b.noChao, dash = b.dashT > 0, corre = !noAr && Math.abs(b.vx) > 30, f = b.passo, br = b.flash > 0;
    var sy = 1 + b.es, sx = 1 - b.es * 0.75;
    if (dash) { sx *= 1.2; sy *= 0.85; }
    var sobe = corre ? Math.abs(Math.sin(f)) * 3 : noAr ? 0 : Math.sin(t * 2.4) * 1.2;
    var raiz = br ? "#ffffff" : COR.raiz, raizE = br ? "#ffffff" : COR.raizEscura;

    ctx.save();
    if (b.invenc > 0 && b.atordoado <= 0 && !br && Math.floor(t * 18) % 2 === 0) ctx.globalAlpha = 0.4;
    ctx.translate(x + b.w / 2, y + b.h); ctx.scale(b.olhando, 1); ctx.rotate(b.inclina); ctx.scale(sx, sy);

    // pernas: duas raízes que dão passadas
    for (i = -1; i <= 1; i += 2) {
      var hx = i * 8, fx, fy, a;
      if (dash) { fx = hx - 15; fy = -7 + i * 2; }
      else if (noAr) { if (b.vy < 0) { fx = hx - 7 + i * 2; fy = -3; } else { fx = hx + i * 5; fy = 1; } }
      else if (corre) { a = f + (i > 0 ? 0 : Math.PI); fx = hx - Math.cos(a) * 13; fy = -Math.max(0, Math.sin(a)) * 9; }
      else { fx = hx + i; fy = 0; }
      membro(ctx, hx, -14 - sobe, fx, fy - 2, i < 0 ? raizE : raiz, 6.5, 3);
      ctx.fillStyle = i < 0 ? raizE : raiz; elipse(ctx, fx + 2.5, fy - 2, 5, 3); ctx.fill();
    }
    ctx.translate(0, -sobe);

    // braço de trás
    var tx, ty;
    if (dash) { tx = -24; ty = -44; } else if (noAr) { tx = -21; ty = b.vy < 0 ? -36 : -56; } else if (corre) { tx = -14 + Math.sin(f) * 9; ty = -31; } else { tx = -19; ty = -30; }
    membro(ctx, -14, -50, tx, ty, raizE, 5, -3);

    // corpo
    var grad = ctx.createLinearGradient(-20, -80, 22, -10);
    grad.addColorStop(0, br ? "#ffffff" : "#fdfad2"); grad.addColorStop(1, br ? "#ffffff" : COR.cascaSombra);
    ctx.fillStyle = grad; corpoBatata(ctx); ctx.fill();
    ctx.strokeStyle = COR.traco; ctx.lineWidth = 2; ctx.stroke();
    if (!br) {
      ctx.fillStyle = "#4a3d28";
      for (i = 0; i < PINTAS.length; i++) { elipse(ctx, PINTAS[i][0], PINTAS[i][1], 1.3, 1.3); ctx.fill(); }
      ctx.fillStyle = "rgba(236,140,130,0.34)"; elipse(ctx, -2, -53, 4.5, 2.6); ctx.fill(); elipse(ctx, 17, -53, 4, 2.6); ctx.fill();
    }

    // rosto: olhos azul-esverdeados, sobrancelha brava quando bate
    var fechado = b.pisca < 0.12 || b.atordoado > 0, bravo = !!g || dash;
    for (i = 0; i < 2; i++) {
      var ex = 3 + i * 11, ey = -61;
      if (fechado) { ctx.strokeStyle = "#2f5560"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(ex - 3, ey); ctx.lineTo(ex + 3, ey); ctx.stroke(); }
      else {
        ctx.fillStyle = COR.olho; elipse(ctx, ex, ey, 3.2, 4.2); ctx.fill(); ctx.strokeStyle = "#2f5560"; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = "#ffffff"; elipse(ctx, ex + 1, ey - 1.5, 1, 1); ctx.fill();
      }
      if (bravo) { ctx.strokeStyle = COR.traco; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex + (i ? 4 : -4), ey - 8.5); ctx.lineTo(ex + (i ? -3 : 3), ey - 5.5); ctx.stroke(); }
    }
    ctx.strokeStyle = COR.traco; ctx.lineWidth = 1.6; ctx.beginPath();
    if (b.atordoado > 0) ctx.arc(9, -49, 2.5, 0, TAU);
    else { ctx.moveTo(6, -50); ctx.quadraticCurveTo(9, bravo ? -51.5 : -48.5, 12, -50); }
    ctx.stroke();

    // cabelo: um tufo que balança atrasado
    ctx.fillStyle = br ? "#ffffff" : COR.cabelo; ctx.strokeStyle = "#4a321f"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-18, -70); ctx.quadraticCurveTo(0, -92, 18, -70); ctx.quadraticCurveTo(0, -80, -18, -70); ctx.fill();
    var ALT = [11, 19, 25, 22, 16, 10];
    for (i = 0; i < 6; i++) {
      var qx = -15 + i * 6, alt = ALT[i], base = -77 + qx * qx / 256 * 7;
      var px = qx * 1.15 + b.cabelo * alt / 25 + Math.sin(t * 2 + i) * 0.8, py = base - alt + b.cabeloY * alt / 25;
      ctx.beginPath(); ctx.moveTo(qx - 5, base + 3); ctx.quadraticCurveTo(qx - 3, base - alt * 0.5, px, py); ctx.quadraticCurveTo(qx + 4, base - alt * 0.4, qx + 5, base + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // braço da frente e cajado: no golpe seguem o arco; fora dele, uma pose para cada movimento
    var mx, my, ang;
    if (g) { ang = anguloGolpe(g) * RAD; mx = 11 + Math.cos(ang) * 18; my = -50 + Math.sin(ang) * 18; b.pose = [mx, my, ang]; }
    else {
      if (dash) { mx = -6; my = -42; ang = 168 * RAD; }
      else if (noAr) { if (b.vy < 0) { mx = 16; my = -42; ang = -118 * RAD; } else { mx = 18; my = -50; ang = -64 * RAD; } }
      else if (corre) { mx = 16 - Math.cos(f) * 5; my = -36 + Math.sin(f * 2) * 1.5; ang = (-58 + Math.sin(f) * 8) * RAD; }
      else { mx = 17; my = -36; ang = (-80 + Math.sin(t * 1.8) * 2.5) * RAD; }
      var p = b.pose || (b.pose = [mx, my, ang]), k = 1 - Math.exp(-dtReal * 20), da = ang - p[2];
      while (da > Math.PI) da -= TAU;
      while (da < -Math.PI) da += TAU;
      p[0] += (mx - p[0]) * k; p[1] += (my - p[1]) * k; p[2] += da * k;
      mx = p[0]; my = p[1]; ang = p[2];
    }
    var T = g ? temposGolpe(g) : null;
    if (g && T.ta >= 0) {
      var G = PB.GOLPES[g.nome];
      ctx.save(); ctx.translate(11, -50);
      rastroGolpe(ctx, G.de, T.ta < T.varre ? anguloGolpe(g) : G.ate, g.forte ? 98 : 86, T.ta < T.varre ? 1 : Math.max(0, 1 - (T.ta - T.varre) / (T.rec * 0.8)), g.forte);
      ctx.restore();
    }
    membro(ctx, 11, -50, mx, my, raiz, 5, 2);
    cajado(ctx, mx, my, ang, t, g ? (g.forte ? 1.7 : 1.3) : 1, br);
    ctx.fillStyle = raiz; elipse(ctx, mx, my, 3.6, 3.6); ctx.fill();
    ctx.restore();
    return { x: x + b.w / 2 + b.olhando * (mx + Math.cos(ang) * 66), y: y + b.h - sobe + my + Math.sin(ang) * 66 };
  }

  // ---------- inimigos ----------
  function cogumelo(ctx, e, x, y, t) {
    var br = e.flash > 0, K = PB.INIMIGOS.cogumelo, aviso = e.estado === "aviso" ? Math.min(1, e.t / K.aviso) : 0, solta = e.estado === "solta" ? Math.max(0, 1 - e.t / 0.35) : 0, i;
    var incha = 1 + aviso * 0.2 - solta * 0.2 + Math.sin(e.anim * 2.2) * 0.02;
    ctx.save();
    ctx.translate(x + e.w / 2 + (aviso ? Math.sin(t * 70) * 1.8 * aviso : 0), y + e.h);
    ctx.rotate(e.balanco * 0.18 + (Math.abs(e.vx) > 5 ? Math.sin(e.fase * 4) * 0.05 : 0)); ctx.scale(e.olhando, 1);
    // caule com a cara brava
    ctx.fillStyle = br ? "#ffffff" : COR.caule; ctx.strokeStyle = "#6b5a66"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-21, 0); ctx.quadraticCurveTo(-12, -14, -13, -44); ctx.lineTo(13, -44); ctx.quadraticCurveTo(12, -14, 21, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!br) { ctx.strokeStyle = "rgba(190,150,160,0.5)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-8, -12); ctx.moveTo(6, -3); ctx.lineTo(7, -11); ctx.stroke(); }
    for (i = -1; i <= 1; i += 2) {     // bracinhos de punho escuro: sobem no aviso
      var by = -24 - aviso * 12;
      ctx.strokeStyle = "#6b5a66"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(i * 13, -26); ctx.lineTo(i * 24, by); ctx.stroke();
      ctx.fillStyle = br ? "#ffffff" : "#2b2f6b"; elipse(ctx, i * 26, by - 1, 4.5, 4.5); ctx.fill();
    }
    ctx.strokeStyle = "#241c2e"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-10, -33); ctx.lineTo(-3, -29); ctx.moveTo(10, -33); ctx.lineTo(3, -29); ctx.stroke();
    ctx.fillStyle = "#241c2e"; elipse(ctx, -6, -25, 2, 2.4); ctx.fill(); elipse(ctx, 6, -25, 2, 2.4); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -13, 4, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    // chapéu lilás de pintas azuis: incha e fica roxo antes de soltar a fumaça
    ctx.translate(0, -40); ctx.scale(incha, incha);
    ctx.fillStyle = br ? "#ffffff" : aviso ? mistura(COR.chapeu, "#d264d8", aviso) : COR.chapeu; ctx.strokeStyle = "#4b3f7a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-46, 2); ctx.bezierCurveTo(-48, -34, -22, -54, 0, -54); ctx.bezierCurveTo(22, -54, 48, -34, 46, 2); ctx.quadraticCurveTo(0, -10, -46, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!br) {
      ctx.save(); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 2;
      ctx.beginPath(); for (i = -52; i <= 40; i += 12) { ctx.moveTo(i, 4); ctx.lineTo(i + 20, -56); } ctx.stroke();
      ctx.fillStyle = COR.pinta;
      elipse(ctx, -28, -14, 9, 7, 0.3); ctx.fill(); elipse(ctx, -6, -38, 10, 7); ctx.fill(); elipse(ctx, 20, -26, 8, 8); ctx.fill(); elipse(ctx, 36, -6, 7, 6); ctx.fill(); elipse(ctx, 4, -12, 6, 5); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function cenoura(ctx, e, x, y, t) {
    var br = e.flash > 0, est = e.estado, salto = 0, rot = 0, esm = 1, i;
    if (e.tonto > 0) rot = Math.sin(t * 22) * 0.12;
    else if (est === "aviso") { rot = -0.3 * Math.min(1, e.t / 0.2); x += Math.sin(t * 80) * 1.5; }
    else if (est === "mira") rot = -0.2 * Math.min(1, e.t / 0.15);
    else if (est === "lanca") rot = 0.32 * Math.max(0, 1 - e.t / 0.3);
    else if (est === "investe") rot = 0.42;
    else if (est === "cansa") { rot = 0.12; esm = 1 - 0.05 * (1 + Math.sin(t * 9)); }
    else if (Math.abs(e.vx) > 5) { var s = Math.abs(Math.sin(e.fase * 2.2)); salto = s * 9; esm = 0.92 + s * 0.12; }
    ctx.save(); ctx.translate(x + e.w / 2, y + e.h - salto); ctx.scale(e.olhando, 1); ctx.rotate(rot + e.balanco * 0.18); ctx.scale(2 - esm, esm);
    // corpo laranja com a ponta enrolada para trás
    ctx.fillStyle = br ? "#ffffff" : COR.cenoura; ctx.strokeStyle = "#7a4a1a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -62);
    ctx.bezierCurveTo(15, -62, 19, -46, 16, -32); ctx.bezierCurveTo(13, -18, 9, -8, 2, -3);
    ctx.quadraticCurveTo(-8, 4, -15, -4); ctx.quadraticCurveTo(-9, -8, -11, -20);
    ctx.bezierCurveTo(-14, -32, -19, -50, 0, -62); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!br) {
      ctx.strokeStyle = "rgba(180,100,20,0.6)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-12, -44); ctx.lineTo(-6, -43); ctx.moveTo(-9, -30); ctx.lineTo(-3, -29); ctx.moveTo(4, -22); ctx.lineTo(10, -24); ctx.stroke();
      ctx.fillStyle = "#8d8d99"; ctx.beginPath(); ctx.moveTo(-5, -40); ctx.lineTo(-1, -35); ctx.lineTo(-5, -30); ctx.lineTo(-9, -35); ctx.closePath(); ctx.fill();   // o losango cinza do clã
    }
    // moicano preto
    ctx.fillStyle = br ? "#ffffff" : "#1b1820";
    ctx.beginPath(); ctx.moveTo(-11, -57);
    for (i = 0; i < 5; i++) { ctx.lineTo(-12 + i * 5.5, -71 - (i % 2) * 6 - (2 - Math.abs(i - 2)) * 3); ctx.lineTo(-7 + i * 4.5, -60); }
    ctx.closePath(); ctx.fill();
    // cara de poucos amigos
    ctx.fillStyle = "#ffffff"; elipse(ctx, 4, -46, 3.4, 3); ctx.fill(); elipse(ctx, 12, -46, 3, 3); ctx.fill();
    ctx.fillStyle = "#1b1820"; elipse(ctx, 5, -46, 1.5, 1.7); ctx.fill(); elipse(ctx, 13, -46, 1.4, 1.7); ctx.fill();
    ctx.strokeStyle = "#1b1820"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -53); ctx.lineTo(7, -50); ctx.moveTo(16, -53.5); ctx.lineTo(10, -50); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(4, -37); ctx.lineTo(7, -39); ctx.lineTo(10, -37); ctx.lineTo(13, -39); ctx.stroke();
    ctx.restore();
    // avisos por cima da cabeça
    var cx = x + e.w / 2, topo = y - 22, m;
    if (est === "mira") {       // a rodela levantada, girando e piscando: vai atirar
      m = PB.maoDaCenoura(e);
      rodelaNoAr(ctx, m.x + x - e.x, m.y + y - e.y + Math.sin(e.t * 30) * 1.5, e.t * 40, 0.5 + 0.3 * Math.min(1, e.t / PB.INIMIGOS.cenoura.mira), Math.floor(t * 16) % 2 === 1);
    } else if (est === "aviso") {
      ctx.font = "700 34px 'Baloo 2', 'Trebuchet MS', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(20,14,28,0.9)"; ctx.strokeText("!", cx, topo); ctx.fillStyle = "#ffd27a"; ctx.fillText("!", cx, topo);
    } else if (e.tonto > 0.3) {
      ctx.fillStyle = "#ffe9a0";
      for (i = 0; i < 3; i++) { elipse(ctx, cx + Math.cos(t * 7 + i * 2.1) * 16, topo + 4 + Math.sin(t * 7 + i * 2.1) * 5, 3, 3); ctx.fill(); }
    }
  }

  // A rodela cortadora: a arma que a cenoura atira. Gira no ar, com o redemoinho cinza do desenho.
  function rodelaNoAr(ctx, x, y, giro, escala, pisca) {
    var i, a;
    ctx.save(); ctx.translate(x, y); ctx.scale(escala, escala);
    ctx.strokeStyle = "rgba(205,205,220,0.42)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 2, 34 + i * 3, 13 + i * 2, 0, giro + i * 2.1, giro + i * 2.1 + 1.5); ctx.stroke(); }
    ctx.rotate(Math.sin(giro * 0.4) * 0.14);
    ctx.fillStyle = pisca ? "#ffe2b0" : COR.rodela; ctx.strokeStyle = "#8a5a22"; ctx.lineWidth = 2;
    elipse(ctx, 0, 0, 23, 12); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(255,232,180,0.9)"; ctx.lineWidth = 2; elipse(ctx, 0, -1, 15, 7); ctx.stroke();
    ctx.strokeStyle = "rgba(150,90,30,0.55)"; ctx.lineWidth = 1.2; ctx.beginPath();
    for (i = 0; i < 6; i++) { a = i / 6 * TAU + giro; ctx.moveTo(Math.cos(a) * 3, -1 + Math.sin(a) * 1.5); ctx.lineTo(Math.cos(a) * 11, -1 + Math.sin(a) * 5); }
    ctx.stroke();
    ctx.restore();
  }

  function espantalho(ctx, e, x, y) {
    var br = e.flash > 0, i;
    ctx.save(); ctx.translate(x + e.w / 2, y + e.h); ctx.rotate(e.balanco * 0.35);
    ctx.strokeStyle = "#6a4a2a"; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -64); ctx.moveTo(-26, -46); ctx.lineTo(26, -46); ctx.stroke();
    ctx.strokeStyle = "#e0c070"; ctx.lineWidth = 2; ctx.beginPath();
    for (i = -1; i <= 1; i += 2) { ctx.moveTo(i * 26, -46); ctx.lineTo(i * 33, -40); ctx.moveTo(i * 26, -46); ctx.lineTo(i * 34, -48); ctx.moveTo(i * 26, -46); ctx.lineTo(i * 31, -54); }
    ctx.stroke();
    ctx.fillStyle = br ? "#ffffff" : "#c9a877"; ctx.strokeStyle = "#6b5236"; ctx.lineWidth = 2;     // saco de pano com cara de cenoura
    ctx.beginPath(); ctx.moveTo(-15, -58); ctx.bezierCurveTo(-21, -94, 21, -94, 15, -58); ctx.quadraticCurveTo(0, -52, -15, -58); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!br) {
      ctx.fillStyle = COR.cenoura; ctx.beginPath(); ctx.moveTo(-3, -73); ctx.lineTo(12, -69); ctx.lineTo(-3, -65); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(-9, -82); ctx.lineTo(-5, -78); ctx.moveTo(-5, -82); ctx.lineTo(-9, -78); ctx.moveTo(4, -82); ctx.lineTo(8, -78); ctx.moveTo(8, -82); ctx.lineTo(4, -78); ctx.stroke();
    }
    ctx.restore();
  }
  var DESENHO = { cogumelo: cogumelo, cenoura: cenoura, espantalho: espantalho };

  // ---------- efeitos ----------
  function nuvem(ctx, n, t) {     // a fumaça roxa do cogumelo
    var a = n.t < n.dur - 0.5 ? 1 : Math.max(0, (n.dur - n.t) / 0.5), i, g;
    for (i = 0; i < 10; i++) {
      var ang = i / 9 * TAU + t * 0.6, rr = n.r * (i === 9 ? 0.75 : 0.42 + 0.2 * U.acaso(i, 71));
      var px = n.x + (i === 9 ? 0 : Math.cos(ang) * n.r * 0.52), py = n.y + (i === 9 ? 0 : Math.sin(ang) * n.r * 0.42);
      if (rr < 1) continue;
      g = ctx.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0, "rgba(206,110,220," + (0.42 * a).toFixed(3) + ")"); g.addColorStop(1, "rgba(150,70,190,0)");
      ctx.fillStyle = g; elipse(ctx, px, py, rr, rr); ctx.fill();
    }
  }
  function pure(ctx, o, alfa) {
    var x = U.lerp(o.px, o.x, alfa), s = o.vx > 0 ? 1 : -1;
    ctx.fillStyle = "#f6efc0"; ctx.strokeStyle = "#8a7a4a"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - s * 26, o.y); ctx.quadraticCurveTo(x - s * 6, o.y - 12, x + s * 8, o.y - 8);
    ctx.quadraticCurveTo(x + s * 16, o.y, x + s * 8, o.y + 8); ctx.quadraticCurveTo(x - s * 6, o.y + 12, x - s * 26, o.y); ctx.fill(); ctx.stroke();
  }
  function particulas(ctx) {
    var l = PB.part.lista, i, j, p, k, a, R;
    for (i = 0; i < l.length; i++) {
      p = l[i]; k = 1 - p.t / p.dur;
      if (p.tipo === "faisca") {
        ctx.globalAlpha = k; ctx.strokeStyle = p.cor; ctx.lineWidth = p.tam; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke();
      } else if (p.tipo === "po") {
        ctx.globalAlpha = k * 0.5; ctx.fillStyle = p.cor; R = p.tam * (1.6 - k * 0.6); elipse(ctx, p.x, p.y, R, R); ctx.fill();
      } else if (p.tipo === "pedaco") {
        ctx.globalAlpha = Math.min(1, k * 3); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.cor; ctx.fillRect(-p.tam / 2, -p.tam / 2, p.tam, p.tam * 0.8); ctx.restore();
      } else if (p.tipo === "clarao") {     // estrela de quatro pontas no ponto do impacto
        ctx.globalAlpha = k; ctx.fillStyle = p.cor; R = p.tam * (1.25 - k * 0.5);
        ctx.beginPath();
        for (j = 0; j < 8; j++) { a = j / 8 * TAU + 0.4; ctx.lineTo(p.x + Math.cos(a) * (j % 2 ? R * 0.22 : R), p.y + Math.sin(a) * (j % 2 ? R * 0.22 : R)); }
        ctx.closePath(); ctx.fill();
      } else if (p.tipo === "texto") {
        ctx.globalAlpha = Math.min(1, k * 2); ctx.font = "700 30px 'Baloo 2', 'Trebuchet MS', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(20,14,28,0.85)"; ctx.strokeText(p.txt, p.x, p.y); ctx.fillStyle = p.cor; ctx.fillText(p.txt, p.x, p.y);
      } else if (p.tipo === "metade") {     // metade da batata partida
        ctx.globalAlpha = Math.min(1, k * 2.5); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.translate(0, 45);
        ctx.beginPath(); ctx.rect(p.lado < 0 ? -30 : 0, -90, 30, 90); ctx.clip();
        ctx.fillStyle = COR.casca; corpoBatata(ctx); ctx.fill(); ctx.strokeStyle = COR.traco; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#fffdf0"; ctx.fillRect(p.lado < 0 ? -4 : 0, -80, 4, 70);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- vida e amido ----------
  function hud(ctx, b) {
    var i;
    for (i = 0; i < A.vida; i++) {        // vida em batatinhas
      ctx.save(); ctx.translate(46 + i * 40, 78); ctx.scale(0.42, 0.42); ctx.lineWidth = 5;
      if (i < b.vida) { ctx.fillStyle = COR.casca; ctx.strokeStyle = COR.traco; } else { ctx.fillStyle = "rgba(16,12,24,0.5)"; ctx.strokeStyle = "rgba(246,241,187,0.28)"; }
      corpoBatata(ctx); ctx.fill(); ctx.stroke();
      if (i < b.vida) { ctx.fillStyle = "#4a3d28"; elipse(ctx, -8, -34, 2.6, 2.6); ctx.fill(); elipse(ctx, 9, -52, 2.6, 2.6); ctx.fill(); elipse(ctx, 4, -24, 2.2, 2.2); ctx.fill(); }
      ctx.restore();
    }
    var pronto = b.amido >= A.custoPure;
    for (i = 0; i < A.amidoMax; i++) {    // amido: uma gota por golpe acertado; três pagam uma bola de purê
      var gx = 38 + i * 22 + (i >= A.custoPure ? 8 : 0), gy = 104, cheio = i < b.amido;
      ctx.fillStyle = cheio ? (pronto ? "#fffbe0" : "#e3dba6") : "rgba(16,12,24,0.5)"; ctx.strokeStyle = cheio ? "#8a7a4a" : "rgba(246,241,187,0.25)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, gy - 9); ctx.bezierCurveTo(gx + 8, gy - 1, gx + 7, gy + 7, gx, gy + 7); ctx.bezierCurveTo(gx - 7, gy + 7, gx - 8, gy - 1, gx, gy - 9); ctx.fill(); ctx.stroke();
    }
  }

  // ---------- modo Medidas: mostra as caixas de acerto ----------
  function caixas(ctx, J, b) {
    var i, e, g = b.golpe, c;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#7dff9a"; ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = "#ff7a6a";
    for (i = 0; i < J.inimigos.length; i++) { e = J.inimigos[i]; if (!e.morto) ctx.strokeRect(e.x, e.y, e.w, e.h); }
    if (g && g.t >= A.golpePreparo && g.t < A.golpePreparo + A.golpeAtivo) { c = PB.caixaGolpe(b, g); ctx.fillStyle = "rgba(255,226,120,0.35)"; ctx.fillRect(c.x, c.y, c.w, c.h); }
    ctx.strokeStyle = "#d58bff";
    for (i = 0; i < J.nuvens.length; i++) { elipse(ctx, J.nuvens[i].x, J.nuvens[i].y, J.nuvens[i].r * 0.82, J.nuvens[i].r * 0.82); ctx.stroke(); }
    ctx.strokeStyle = "#ffb060";
    for (i = 0; i < J.rodelas.length; i++) ctx.strokeRect(J.rodelas[i].x - 16, J.rodelas[i].y - 9, 32, 18);
  }
})();

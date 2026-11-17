// Motor do protótipo: entrada (teclado, toque e controle), som, mundo em blocos, colisão,
// partículas e câmera. Nada aqui sabe o que é uma batata; isso fica nos outros arquivos.
(function () {
  "use strict";
  var PB = window.PB, B = PB.B;

  // ---------- utilidades ----------
  var U = PB.util = {
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    aproxima: function (v, alvo, passo) { return v < alvo ? Math.min(v + passo, alvo) : Math.max(v - passo, alvo); },
    saiRapido: function (t) { return 1 - Math.pow(1 - t, 3); },
    // "Sorteio" que dá sempre o mesmo resultado para o mesmo número: o cenário fica igual em todo lugar.
    acaso: function (n, s) { var v = Math.sin(n * 127.1 + (s || 0) * 311.7) * 43758.5453; return v - Math.floor(v); }
  };
  PB.sobrepoe = function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; };

  // ---------- entrada ----------
  // seg = o que está sendo segurado agora; ap = o que acabou de ser apertado (vale até o próximo passo do jogo).
  var ACOES = ["esq", "dir", "cima", "baixo", "pulo", "golpe", "dash", "pure"];
  var TECLAS = {
    ArrowLeft: "esq", KeyA: "esq", ArrowRight: "dir", KeyD: "dir", ArrowUp: "cima", KeyW: "cima", ArrowDown: "baixo", KeyS: "baixo",
    Space: "pulo", KeyZ: "pulo", KeyX: "golpe", KeyJ: "golpe", KeyC: "dash", KeyK: "dash", ShiftLeft: "dash", ShiftRight: "dash",
    KeyV: "pure", KeyL: "pure"
  };
  var MENU = { Escape: "pausa", KeyP: "pausa", KeyM: "som", KeyH: "medidas", KeyR: "tocha", Enter: "confirma" };
  var E = PB.entrada = {
    seg: {}, ap: { pulo: false, golpe: false, dash: false, pure: false },
    modo: "teclado", fontes: { teclado: {}, toque: {}, controle: {} }, aoMenu: null, temControle: false, start: false
  };
  ACOES.forEach(function (a) { E.seg[a] = false; });

  E.definir = function (fonte, acao, ligado) {
    var f = E.fontes[fonte];
    if (!!f[acao] === ligado) return;
    f[acao] = ligado;
    var antes = E.seg[acao];
    E.seg[acao] = !!(E.fontes.teclado[acao] || E.fontes.toque[acao] || E.fontes.controle[acao]);
    if (ligado) { E.modo = fonte; if (!antes && acao in E.ap) E.ap[acao] = true; }
  };
  E.soltarTudo = function (fonte) { ACOES.forEach(function (a) { E.definir(fonte, a, false); }); };
  E.consumir = function () { E.ap.pulo = E.ap.golpe = E.ap.dash = E.ap.pure = false; };

  window.addEventListener("keydown", function (ev) {
    if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var a = TECLAS[ev.code];
    if (a) { if (!ev.repeat) E.definir("teclado", a, true); ev.preventDefault(); return; }
    if (MENU[ev.code] && !ev.repeat && E.aoMenu) { E.aoMenu(MENU[ev.code]); ev.preventDefault(); }
  });
  window.addEventListener("keyup", function (ev) { var a = TECLAS[ev.code]; if (a) E.definir("teclado", a, false); });
  window.addEventListener("blur", function () { E.soltarTudo("teclado"); E.soltarTudo("toque"); });

  // Controle (gamepad), lido uma vez por quadro. Se o navegador não deixar, o jogo segue sem ele.
  E.lerControle = function () {
    var gp = null, lista, i;
    try {
      lista = navigator.getGamepads ? navigator.getGamepads() : [];
      for (i = 0; i < lista.length; i++) if (lista[i] && lista[i].connected) { gp = lista[i]; break; }
    } catch (err) { return; }
    if (!gp) { if (E.temControle) { E.soltarTudo("controle"); E.temControle = false; } return; }
    E.temControle = true;
    var b = function (n) { return !!(gp.buttons[n] && gp.buttons[n].pressed); };
    var x = gp.axes[0] || 0, y = gp.axes[1] || 0;
    E.definir("controle", "esq", x < -0.35 || b(14));
    E.definir("controle", "dir", x > 0.35 || b(15));
    E.definir("controle", "cima", y < -0.55 || b(12));
    E.definir("controle", "baixo", y > 0.55 || b(13));
    E.definir("controle", "pulo", b(0));
    E.definir("controle", "golpe", b(2));
    E.definir("controle", "dash", b(1) || b(5) || b(7));
    E.definir("controle", "pure", b(3));
    if (b(9) && !E.start && E.aoMenu) E.aoMenu("pausa");
    E.start = b(9);
  };

  // ---------- som ----------
  // Tudo é sintetizado na hora: nenhum arquivo de áudio. Só começa depois do primeiro toque ou clique.
  var ac = null, mestre = null, ruidoBuf = null;
  PB.somLigado = true;
  PB.semSom = false;
  PB.audioIniciar = function () {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ac = new Ctx();
      mestre = ac.createGain(); mestre.gain.value = 0.45; mestre.connect(ac.destination);
      ruidoBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.6), ac.sampleRate);
      var d = ruidoBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (err) { ac = null; }
  };
  function tom(tipo, f0, f1, dur, vol, atraso) {
    var t = ac.currentTime + (atraso || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mestre); o.start(t); o.stop(t + dur + 0.03);
  }
  function chiado(f0, f1, dur, vol, q, atraso) {
    var t = ac.currentTime + (atraso || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = ruidoBuf; f.type = "bandpass"; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(mestre); s.start(t); s.stop(t + dur + 0.03);
  }
  var SONS = {
    pulo: function () { tom("sine", 300, 560, 0.12, 0.22); },
    pouso: function () { chiado(260, 120, 0.08, 0.3, 0.8); },
    dash: function () { chiado(700, 2800, 0.18, 0.32, 1.4); },
    golpe: function () { chiado(3200, 1200, 0.09, 0.2, 0.9); },
    acerto: function () { tom("square", 230, 90, 0.08, 0.2); chiado(1800, 600, 0.06, 0.32, 0.7); },
    forte: function () { tom("square", 170, 55, 0.17, 0.26); chiado(1200, 300, 0.12, 0.38, 0.6); tom("sine", 880, 1760, 0.2, 0.1, 0.03); },
    dano: function () { tom("sawtooth", 280, 70, 0.28, 0.24); chiado(500, 150, 0.2, 0.25, 0.6); },
    some: function () { tom("triangle", 520, 110, 0.2, 0.25); chiado(900, 250, 0.16, 0.26, 0.5); },
    pure: function () { tom("sine", 540, 170, 0.16, 0.28); },
    aviso: function () { tom("triangle", 720, 940, 0.1, 0.14); tom("triangle", 940, 1180, 0.1, 0.12, 0.09); },
    fumaca: function () { chiado(500, 180, 0.6, 0.2, 0.4); },
    rodela: function () { chiado(1800, 3200, 0.32, 0.16, 7); tom("sawtooth", 170, 260, 0.3, 0.05); },     // o zumbido da rodela cortadora
    tocha: function () { tom("sine", 523, 523, 0.16, 0.18); tom("sine", 659, 659, 0.16, 0.18, 0.1); tom("sine", 784, 784, 0.3, 0.18, 0.2); },
    morre: function () { tom("sawtooth", 320, 40, 0.7, 0.26); },
    fim: function () { [523, 659, 784, 1047].forEach(function (f, i) { tom("triangle", f, f, 0.32, 0.18, i * 0.13); }); }
  };
  PB.som = function (nome) {
    if (!ac || !PB.somLigado || PB.semSom || !SONS[nome]) return;
    try { SONS[nome](); } catch (err) { if (window.console) console.warn("O som '" + nome + "' falhou:", err); }   // som nunca derruba o jogo
  };

  // ---------- mundo em blocos ----------
  // 0 vazio, 1 terra, 2 galho (dá para atravessar por baixo), 3 espinho
  var M = PB.mundo = { larg: 0, alt: 0, grade: null };
  M.tile = function (c, l) {
    if (c < 0 || c >= M.larg) return 1;      // as bordas da fase são parede
    if (l < 0 || l >= M.alt) return 0;
    return M.grade[l * M.larg + c];
  };
  M.solido = function (c, l) { return M.tile(c, l) === 1; };
  M.pisavel = function (x, y) { var t = M.tile(Math.floor(x / B), Math.floor(y / B)); return t === 1 || t === 2; };
  // Primeira linha com terra naquela coluna: onde as coisas ficam apoiadas.
  M.topo = function (c) { for (var l = 0; l < M.alt; l++) if (M.grade[l * M.larg + c] === 1) return l; return M.alt; };
  M.carregar = function () {
    var F = PB.FASE, c, l;
    M.larg = F.larg; M.alt = F.alt; M.grade = new Uint8Array(F.larg * F.alt);
    F.chao.forEach(function (r) { for (c = r[0]; c <= r[1]; c++) for (l = r[2]; l < F.alt; l++) M.grade[l * F.larg + c] = 1; });
    F.plataformas.forEach(function (r) { for (c = r[0]; c <= r[1]; c++) if (!M.grade[r[2] * F.larg + c]) M.grade[r[2] * F.larg + c] = 2; });
    F.espinhos.forEach(function (r) { for (c = r[0]; c <= r[1]; c++) if (!M.grade[r[2] * F.larg + c]) M.grade[r[2] * F.larg + c] = 3; });
  };

  // Move uma caixa (x, y, w, h, vx, vy) pelo mundo, primeiro de lado e depois na vertical.
  // Deixa anotado: noChao, naPlataforma e parede (-1 esquerda, 1 direita).
  PB.mover = function (e, dt) {
    var c, l, l0, l1, c0, c1, t;
    e.parede = 0;
    e.x += e.vx * dt;
    l0 = Math.floor(e.y / B); l1 = Math.floor((e.y + e.h - 0.01) / B);
    if (e.vx > 0) {
      c = Math.floor((e.x + e.w) / B);
      for (l = l0; l <= l1; l++) if (M.tile(c, l) === 1) { e.x = c * B - e.w - 0.01; e.vx = 0; e.parede = 1; break; }
    } else if (e.vx < 0) {
      c = Math.floor(e.x / B);
      for (l = l0; l <= l1; l++) if (M.tile(c, l) === 1) { e.x = (c + 1) * B + 0.01; e.vx = 0; e.parede = -1; break; }
    }
    var yAntes = e.y;
    e.y += e.vy * dt;
    e.noChao = false; e.naPlataforma = false;
    c0 = Math.floor(e.x / B); c1 = Math.floor((e.x + e.w - 0.01) / B);
    if (e.vy >= 0) {
      l = Math.floor((e.y + e.h) / B);
      for (c = c0; c <= c1; c++) {
        t = M.tile(c, l);
        // No galho só pousa quem vem de cima e não está descendo de propósito.
        if (t === 1 || (t === 2 && !(e.atravessa > 0) && yAntes + e.h <= l * B + 0.5)) {
          e.y = l * B - e.h; e.vy = 0; e.noChao = true; e.naPlataforma = t === 2; break;
        }
      }
    } else {
      l = Math.floor(e.y / B);
      for (c = c0; c <= c1; c++) if (M.tile(c, l) === 1) { e.y = (l + 1) * B + 0.01; e.vy = 0; break; }
    }
  };

  // ---------- partículas ----------
  var P = PB.part = { lista: [] };
  var CORES_FAISCA = ["#fff6c4", "#ffc35a", "#ff8a3c", "#7fd8ff", "#ff6f61"];   // as cores do cajado no desenho
  P.soltar = function (o) { if (P.lista.length > 320) P.lista.shift(); o.t = 0; P.lista.push(o); return o; };
  P.atualizar = function (dt) {
    for (var i = P.lista.length - 1; i >= 0; i--) {
      var p = P.lista[i];
      p.t += dt;
      if (p.t >= p.dur) { P.lista.splice(i, 1); continue; }
      p.vy += (p.grav || 0) * dt;
      if (p.atrito) { var k = Math.exp(-p.atrito * dt); p.vx *= k; p.vy *= k; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.vr) p.rot += p.vr * dt;
    }
  };
  P.faiscas = function (x, y, n, dx, dy, forte) {
    var base = Math.atan2(dy || 0, dx || 0.001);
    for (var i = 0; i < n; i++) {
      var ang = base + (Math.random() - 0.5) * 2.2, v = (forte ? 440 : 300) * (0.4 + Math.random() * 0.9);
      P.soltar({ tipo: "faisca", x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 40, dur: 0.18 + Math.random() * 0.24,
        tam: forte ? 3.4 : 2.4, cor: CORES_FAISCA[(Math.random() * CORES_FAISCA.length) | 0], atrito: 5 });
    }
    P.soltar({ tipo: "clarao", x: x, y: y, vx: 0, vy: 0, dur: 0.12, tam: forte ? 74 : 46, cor: "#fff3c0" });
  };
  P.poeira = function (x, y, n, vx) {
    for (var i = 0; i < n; i++) {
      P.soltar({ tipo: "po", x: x + (Math.random() - 0.5) * 18, y: y - Math.random() * 4, vx: (vx || 0) * (0.4 + Math.random() * 0.6) + (Math.random() - 0.5) * 60,
        vy: -20 - Math.random() * 50, dur: 0.3 + Math.random() * 0.25, tam: 5 + Math.random() * 6, cor: "#b7c4b4", atrito: 3 });
    }
  };
  P.pedacos = function (x, y, n, cores, forca) {
    for (var i = 0; i < n; i++) {
      P.soltar({ tipo: "pedaco", x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * (forca || 440),
        vy: -160 - Math.random() * 300, dur: 0.6 + Math.random() * 0.4, tam: 5 + Math.random() * 7, cor: cores[(Math.random() * cores.length) | 0],
        grav: 1500, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 16 });
    }
  };
  P.texto = function (x, y, txt, cor) {
    P.soltar({ tipo: "texto", x: x, y: y, vx: (Math.random() - 0.5) * 50, vy: -130, dur: 0.7, txt: txt, cor: cor || "#ffffff", atrito: 3 });
  };

  // ---------- câmera ----------
  // Segue a batata olhando um pouco para a frente. "trauma" é o tremor: sobe com os golpes e cai sozinho.
  var C = PB.cam = { x: 0, y: 0, px: 0, py: 0, olhar: 0, trauma: 0 };
  C.atualizar = function (dt, b, direto) {
    C.px = C.x; C.py = C.y;
    C.olhar += (b.olhando * 120 - C.olhar) * (direto ? 1 : 1 - Math.exp(-dt * 2.2));
    var tx = U.clamp(b.x + b.w / 2 + C.olhar - PB.LARG / 2, 0, M.larg * B - PB.LARG);
    var ty = U.clamp(b.y + b.h / 2 - PB.ALT * 0.58, 0, M.alt * B - PB.ALT);
    if (direto) { C.x = C.px = tx; C.y = C.py = ty; return; }
    C.x += (tx - C.x) * (1 - Math.exp(-dt * 7));
    C.y += (ty - C.y) * (1 - Math.exp(-dt * (b.noChao ? 5 : 3)));
    C.trauma = Math.max(0, C.trauma - dt * 1.9);
  };
  C.tremer = function (q) { C.trauma = Math.min(1, C.trauma + q * PB.A.tremor); };
})();

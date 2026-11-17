// A cola do protótipo: monta a fase, roda o laço do jogo e liga as telas, os botões e o toque.
(function () {
  "use strict";
  var PB = window.PB, B = PB.B, A = PB.A, U = PB.util, E = PB.entrada, M = PB.mundo, P = PB.part, C = PB.cam;
  var DT = 1 / 120;      // o jogo anda em passos fixos de 1/120 s: igual em qualquer tela e fácil de medir

  var J = PB.J = {
    estado: "titulo",   // titulo, jogando, pausado, fim
    semControle: true, tempo: 0, tJogo: 0, pausa: 0, clarao: 0, escuro: 0,
    batata: null, inimigos: [], nuvens: [], tiros: [], rodelas: [], placas: [], tochas: [], origens: [], meta: null, inicio: null, retorno: null,
    stats: { golpes: 0, acertos: 0, rebatidas: 0, derrotados: 0, dano: 0, mortes: 0 }, med: { pulo: null, dash: null }, medidas: false
  };
  var CORES_RODELA = ["#e8a653", "#f4c27a", "#c9c9d6"];
  var cv, ctx, ultimo = 0, acum = 0, ui = { dicaAtual: "", tMedidas: 0 };
  function $(id) { return document.getElementById(id); }

  // ---------- fase ----------
  function montar() {
    M.carregar();
    J.placas = []; J.tochas = []; J.origens = []; J.meta = null;
    PB.FASE.coisas.forEach(function (c) {
      var tipo = c[0], x = (c[1] + 0.5) * B, chao = M.topo(Math.floor(c[1])) * B;
      if (tipo === "batata") J.inicio = { x: x, y: chao };
      else if (tipo === "placa") J.placas.push({ x: x, y: chao, txt: c[2] });
      else if (tipo === "tocha") J.tochas.push({ x: x, y: chao, acesa: false });
      else if (tipo === "meta") J.meta = { x: x, y: chao };
      else J.origens.push({ tipo: tipo, x: x, y: chao });
    });
  }
  function povoar() {
    J.inimigos = J.origens.map(function (o) { return PB.criarInimigo(o.tipo, o.x, o.y); });
    J.nuvens = []; J.tiros = []; J.rodelas = [];
  }
  // Começa a fase do zero.
  PB.reiniciar = function () {
    montar(); povoar();
    J.retorno = { x: J.inicio.x, y: J.inicio.y };
    J.batata = PB.criarBatata(J.inicio.x, J.inicio.y);
    J.stats = { golpes: 0, acertos: 0, rebatidas: 0, derrotados: 0, dano: 0, mortes: 0 };
    J.tempo = 0; J.tJogo = 0; J.pausa = 0; J.clarao = 0; J.escuro = 0; P.lista.length = 0; C.trauma = 0;
    C.atualizar(0, J.batata, true);
  };
  // Depois de morrer: volta para a última tocha acesa, com a vida cheia e os inimigos de volta.
  PB.renascer = function () {
    povoar();
    J.batata = PB.criarBatata(J.retorno.x, J.retorno.y);
    J.batata.invenc = 1.2; J.escuro = 1; J.pausa = 0;
    C.atualizar(0, J.batata, true);
  };

  // ---------- um passo do jogo ----------
  function marcarAnterior() {
    var b = J.batata, i;
    b.px = b.x; b.py = b.y; C.px = C.x; C.py = C.y;
    for (i = 0; i < J.inimigos.length; i++) { J.inimigos[i].px = J.inimigos[i].x; J.inimigos[i].py = J.inimigos[i].y; }
    for (i = 0; i < J.tiros.length; i++) J.tiros[i].px = J.tiros[i].x;
    for (i = 0; i < J.rodelas.length; i++) { J.rodelas[i].px = J.rodelas[i].x; J.rodelas[i].py = J.rodelas[i].y; }
  }
  function contatos(b) {
    if (b.morto || b.voltando > 0 || b.invenc > 0) return;
    var cx = b.x + b.w / 2, i, e, n, px, py;
    for (i = 0; i < J.inimigos.length; i++) {
      e = J.inimigos[i];
      if (e.morto || e.manso || e.tonto > 0) continue;
      // a área que fere é um pouco menor que o corpo: encostar de raspão não machuca
      if (b.x < e.x + e.w - 6 && b.x + b.w > e.x + 6 && b.y < e.y + e.h - 4 && b.y + b.h > e.y + 8) { PB.ferirBatata(1, cx >= e.x + e.w / 2 ? 1 : -1, e.tipo); return; }
    }
    for (i = 0; i < J.nuvens.length; i++) {
      n = J.nuvens[i];
      if (n.t < 0.15 || n.t > n.dur - 0.4) continue;
      px = U.clamp(n.x, b.x, b.x + b.w); py = U.clamp(n.y, b.y, b.y + b.h);
      if (Math.hypot(px - n.x, py - n.y) < n.r * 0.82) { PB.ferirBatata(1, cx >= n.x ? 1 : -1, "fumaca"); return; }
    }
  }
  PB.passo = function (dt) {
    var b = J.batata, i, k, e, t, n, r, some, K = PB.INIMIGOS.cenoura;
    J.tempo += dt;
    J.clarao = Math.max(0, J.clarao - dt); J.escuro = Math.max(0, J.escuro - dt * 2);
    // Pausa de impacto: o mundo congela por um instante quando um golpe acerta. É o que dá peso ao golpe.
    if (J.pausa > 0) { J.pausa -= dt; marcarAnterior(); return; }
    if (J.estado === "jogando") J.tJogo += dt;

    PB.atualizarBatata(b, dt);
    b = J.batata;
    for (i = 0; i < J.inimigos.length; i++) if (!J.inimigos[i].morto) PB.atualizarInimigo(J.inimigos[i], dt);

    for (i = J.tiros.length - 1; i >= 0; i--) {       // bolas de purê
      t = J.tiros[i]; t.px = t.x; t.x += t.vx * dt; t.t += dt;
      some = t.t > 1.1 || M.solido(Math.floor(t.x / B), Math.floor(t.y / B));
      for (k = 0; k < J.inimigos.length && !some; k++) {
        e = J.inimigos[k];
        if (!e.morto && t.x > e.x - 10 && t.x < e.x + e.w + 10 && t.y > e.y - 10 && t.y < e.y + e.h + 10) { PB.ferirInimigo(e, A.pureDano, t.vx > 0 ? 1 : -1, true, "frente", true); some = true; }
      }
      for (k = J.rodelas.length - 1; k >= 0 && !some; k--) {      // purê e rodela se desmancham no ar
        r = J.rodelas[k];
        if (Math.abs(t.x - r.x) < 26 && Math.abs(t.y - r.y) < 20) { P.pedacos(r.x, r.y, 5, CORES_RODELA, 260); J.rodelas.splice(k, 1); some = true; }
      }
      if (some) { P.pedacos(t.x, t.y, 7, ["#f6efc0", "#fffbe0", "#e3dba6"], 260); J.tiros.splice(i, 1); }
    }
    for (i = J.rodelas.length - 1; i >= 0; i--) {     // rodelas das cenouras: voam reto, somem na terra e não têm vida
      r = J.rodelas[i]; r.px = r.x; r.py = r.y; r.x += r.vx * dt; r.y += r.vy * dt; r.t += dt;
      if (r.t > K.rodelaDura || M.solido(Math.floor(r.x / B), Math.floor(r.y / B))) { P.poeira(r.x, r.y, 3, 0); J.rodelas.splice(i, 1); continue; }
      // a área que fere é menor que o desenho; durante a invencibilidade a rodela passa direto
      if (!b.morto && b.voltando <= 0 && b.invenc <= 0 && b.x < r.x + 16 && b.x + b.w > r.x - 16 && b.y < r.y + 9 && b.y + b.h > r.y - 9) {
        PB.ferirBatata(1, r.vx >= 0 ? 1 : -1, "rodela"); P.pedacos(r.x, r.y, 5, CORES_RODELA, 260); J.rodelas.splice(i, 1);
      }
    }
    for (i = J.nuvens.length - 1; i >= 0; i--) {      // fumaça do cogumelo
      n = J.nuvens[i]; n.t += dt; n.r = n.rMax * U.saiRapido(Math.min(1, n.t / 0.35));
      if (n.t >= n.dur) J.nuvens.splice(i, 1);
    }
    contatos(b);

    var cx = b.x + b.w / 2, pe = b.y + b.h;
    for (i = 0; i < J.tochas.length; i++) {           // tocha: acende, cura e vira o ponto de volta
      t = J.tochas[i];
      // passar pulando por cima também acende: a chama do cajado pega na tocha
      if (!t.acesa && !b.morto && Math.abs(cx - t.x) < 44 && pe < t.y + 8 && pe > t.y - 240) {
        t.acesa = true; J.retorno = { x: t.x, y: t.y }; b.vida = A.vida;
        PB.som("tocha"); P.faiscas(t.x + 5, t.y - 84, 14, 0, -1, true);
      }
    }
    if (J.estado === "jogando" && J.meta && !b.morto && b.noChao && cx > J.meta.x - 20) PB.fim();

    P.atualizar(dt);
    C.atualizar(dt, b);
    E.consumir();
  };

  // ---------- laço ----------
  function quadro(agora) {
    requestAnimationFrame(quadro);
    var dtReal = Math.min((agora - ultimo) / 1000, 0.1), n = 0;
    ultimo = agora;
    E.lerControle();
    if (J.estado !== "pausado") {
      acum += dtReal;
      while (acum >= DT && n < 14) { PB.passo(DT); acum -= DT; n++; }
      if (n === 14) acum = 0;
    }
    PB.desenhar(ctx, J.estado === "pausado" ? 1 : acum / DT, dtReal);
    atualizarDica();
    if (J.medidas) { ui.tMedidas -= dtReal; if (ui.tMedidas <= 0) { ui.tMedidas = 0.2; $("medidas").textContent = textoMedidas(); } }
  }

  // ---------- telas ----------
  function comecar() {
    PB.audioIniciar();
    J.estado = "jogando"; J.semControle = false; E.consumir();
    $("capa").hidden = true; $("pausa").hidden = true; $("fim").hidden = true;
    ultimo = performance.now(); acum = 0;
    try { cv.focus({ preventScroll: true }); } catch (err) { cv.focus(); }
  }
  function pausar() { if (J.estado !== "jogando") return; J.estado = "pausado"; $("pausa").hidden = false; }
  function tempoTexto(s) { var m = Math.floor(s / 60), r = s - m * 60; return m + ":" + (r < 10 ? "0" : "") + r.toFixed(1).replace(".", ","); }
  PB.fim = function () {
    J.estado = "fim"; J.semControle = true; PB.som("fim");
    var s = J.stats, dl = $("placar");
    var linhas = [["Tempo", tempoTexto(J.tJogo)], ["Golpes dados", s.golpes], ["Golpes que acertaram", s.acertos], ["Rodelas rebatidas", s.rebatidas], ["Inimigos derrotados", s.derrotados], ["Dano levado", s.dano], ["Voltas à tocha", s.mortes]];
    dl.textContent = "";
    linhas.forEach(function (l) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = l[0]; dd.textContent = l[1]; dl.appendChild(dt); dl.appendChild(dd);
    });
    $("fim").hidden = false;
  };
  function alternarSom() { PB.somLigado = !PB.somLigado; $("btSom").setAttribute("aria-pressed", String(PB.somLigado)); }
  function alternarMedidas() {
    J.medidas = !J.medidas; ui.tMedidas = 0;
    $("medidas").hidden = !J.medidas; $("btMedidas").setAttribute("aria-pressed", String(J.medidas));
  }
  E.aoMenu = function (acao) {
    if (acao === "pausa") { if (J.estado === "jogando") pausar(); else if (J.estado === "pausado") comecar(); }
    else if (acao === "som") alternarSom();
    else if (acao === "medidas") alternarMedidas();
    else if (acao === "tocha") { if (J.estado === "jogando") { J.stats.mortes++; PB.renascer(); } }
    else if (acao === "confirma") { if (J.estado === "titulo" || J.estado === "pausado") comecar(); else if (J.estado === "fim") { PB.reiniciar(); comecar(); } }
  };

  // A dica da placa mais próxima aparece no alto da tela, com o nome do botão de quem está jogando.
  function textoDica(chave) {
    var n = PB.NOMES[E.modo] || PB.NOMES.teclado;
    return PB.TEXTOS[chave].replace(/\{(\w+)\}/g, function (tudo, k) { return n[k] || k; });
  }
  function atualizarDica() {
    var b = J.batata, cx = b.x + b.w / 2, perto = null, i, p, chave;
    if (J.estado === "jogando") for (i = 0; i < J.placas.length; i++) { p = J.placas[i]; if (Math.abs(cx - p.x) < 135 && Math.abs(b.y + b.h - p.y) < 150) perto = p; }
    chave = perto ? perto.txt + "|" + E.modo : "";
    if (chave === ui.dicaAtual) return;
    ui.dicaAtual = chave;
    if (perto) $("dicaTxt").textContent = textoDica(perto.txt);
    $("dica").classList.toggle("ligada", !!perto);
  }

  function textoMedidas() {
    var m = J.med, b = J.batata, n = function (v, c) { return v.toFixed(c || 0).replace(".", ","); }, l = [];
    l.push("corrida         " + n(A.velMax) + " px/s (" + n(A.velMax / B, 1) + " blocos/s)");
    l.push("pulo            " + n(A.alturaPulo) + " px (" + n(A.alturaPulo / B, 1) + " blocos), subida de " + n(A.tempoSubida, 2) + " s");
    l.push("último pulo     " + (m.pulo ? "altura " + n(m.pulo.altura) + " px, " + n(m.pulo.tempo, 2) + " s no ar, " + n(m.pulo.dist) + " px de distância" : "pule para medir"));
    l.push("dash            " + n(A.dashVel) + " px/s por " + n(A.dashTempo, 2) + " s" + (m.dash ? ", último " + n(m.dash) + " px" : ""));
    l.push("golpe           preparo " + n(A.golpePreparo, 2) + " s, ativo " + n(A.golpeAtivo, 2) + " s, recuperação " + n(A.golpeRecupera, 2) + " s");
    l.push("pausa impacto   " + n(A.pausaImpacto * 1000) + " ms (golpe forte " + n(A.pausaImpactoForte * 1000) + " ms)");
    l.push("agora           vx " + n(b.vx) + ", vy " + n(b.vy) + (b.noChao ? ", no chão" : ", no ar"));
    return l.join("\n");
  }

  // ---------- ajustes ao vivo ----------
  var AJUSTES = [
    ["velMax", "Corrida", 200, 520, 10, "px/s"], ["alturaPulo", "Altura do pulo", 96, 264, 4, "px"], ["tempoSubida", "Tempo de subida", 0.22, 0.6, 0.01, "s"],
    ["gravQueda", "Peso na queda", 1, 2.4, 0.05, "×"], ["dashVel", "Velocidade do dash", 500, 1400, 20, "px/s"], ["dashTempo", "Duração do dash", 0.08, 0.3, 0.01, "s"],
    ["golpeRecupera", "Recuperação do golpe", 0.05, 0.4, 0.01, "s"], ["pausaImpacto", "Pausa de impacto", 0, 0.15, 0.005, "s"], ["tremor", "Tremor da tela", 0, 2, 0.1, "×"]
  ];
  function montarAjustes() {
    var caixa = $("listaAjustes");
    AJUSTES.forEach(function (a) {
      var linha = document.createElement("label"), nome = document.createElement("span"), valor = document.createElement("output"), r = document.createElement("input");
      linha.className = "ajuste"; linha.htmlFor = "aj-" + a[0]; nome.textContent = a[1]; valor.id = "val-" + a[0];
      r.type = "range"; r.id = "aj-" + a[0]; r.min = a[2]; r.max = a[3]; r.step = a[4]; r.value = A[a[0]];
      a.mostra = function () { r.value = A[a[0]]; valor.textContent = String(A[a[0]]).replace(".", ",") + " " + a[5]; };
      r.addEventListener("input", function () { A[a[0]] = parseFloat(r.value); PB.recalcular(); a.mostra(); });
      a.mostra();
      linha.appendChild(nome); linha.appendChild(valor); linha.appendChild(r); caixa.appendChild(linha);
    });
    $("btPadrao").addEventListener("click", function () {
      Object.keys(PB.PADRAO).forEach(function (k) { A[k] = PB.PADRAO[k]; });
      PB.recalcular(); AJUSTES.forEach(function (a) { a.mostra(); }); $("avisoCopia").textContent = "Valores de fábrica de volta.";
    });
    $("btCopiar").addEventListener("click", function () {
      var txt = AJUSTES.map(function (a) { return a[0] + ": " + A[a[0]]; }).join(", "), caixaTxt = $("valores"), aviso = $("avisoCopia");
      function manual() { caixaTxt.hidden = false; caixaTxt.value = txt; caixaTxt.focus(); caixaTxt.select(); aviso.textContent = "Selecione e copie o texto acima."; }
      try { navigator.clipboard.writeText(txt).then(function () { aviso.textContent = "Copiado. Cole na conversa com o Claude."; }, manual); } catch (err) { manual(); }
    });
  }

  // ---------- toque ----------
  function mostrarToque() {
    if ($("app").classList.contains("com-toque")) return;
    $("app").classList.add("com-toque"); $("toque").hidden = false; ajustarTela();
  }
  function ligarToque() {
    var al = $("alavanca"), pino = $("pino"), id = null;
    function mover(ev) {
      var r = al.getBoundingClientRect(), lim = r.width / 2, dx = ev.clientX - (r.left + lim), dy = ev.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy);
      if (d > lim) { dx *= lim / d; dy *= lim / d; }
      pino.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      E.definir("toque", "esq", dx < -lim * 0.28); E.definir("toque", "dir", dx > lim * 0.28);
      E.definir("toque", "cima", dy < -lim * 0.6); E.definir("toque", "baixo", dy > lim * 0.6);
    }
    function soltar(ev) {
      if (ev.pointerId !== id) return;
      id = null; pino.style.transform = "";
      ["esq", "dir", "cima", "baixo"].forEach(function (a) { E.definir("toque", a, false); });
    }
    al.addEventListener("pointerdown", function (ev) { id = ev.pointerId; try { al.setPointerCapture(id); } catch (err) { /* segue sem captura */ } mover(ev); ev.preventDefault(); });
    al.addEventListener("pointermove", function (ev) { if (ev.pointerId === id) mover(ev); });
    al.addEventListener("pointerup", soltar); al.addEventListener("pointercancel", soltar);
    Array.prototype.forEach.call(document.querySelectorAll("[data-acao]"), function (bt) {
      var a = bt.getAttribute("data-acao");
      function fim() { E.definir("toque", a, false); bt.classList.remove("apertado"); }
      bt.addEventListener("pointerdown", function (ev) {
        try { bt.setPointerCapture(ev.pointerId); } catch (err) { /* segue sem captura */ }
        PB.audioIniciar(); E.definir("toque", a, true); bt.classList.add("apertado"); ev.preventDefault();
      });
      bt.addEventListener("pointerup", fim); bt.addEventListener("pointercancel", fim); bt.addEventListener("lostpointercapture", fim);
      bt.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
    });
    document.addEventListener("pointerdown", function (ev) { if (ev.pointerType === "touch") mostrarToque(); }, true);
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) mostrarToque();
  }

  // ---------- tamanho da tela ----------
  // O jogo é sempre 16:9. Aqui ele ganha o maior tamanho que cabe e a nitidez da tela (até 1920 de largura).
  function ajustarTela() {
    var app = $("app"), tela = $("tela"), retrato = window.innerHeight > window.innerWidth;
    app.classList.toggle("retrato", retrato);
    var r = $("palco").getBoundingClientRect(), livre = r.height - (retrato && app.classList.contains("com-toque") ? 208 : 0);
    var w = Math.max(160, Math.floor(Math.min(r.width, livre * 16 / 9)));
    tela.style.width = w + "px"; tela.style.height = Math.round(w * 9 / 16) + "px";
    tela.style.setProperty("--u", (w / 100) + "px");
    var larg = Math.round(Math.min(w * (window.devicePixelRatio || 1), 1920));
    if (cv.width !== larg) { cv.width = larg; cv.height = Math.round(larg * 9 / 16); PB.escala = larg / PB.LARG; PB.limparCache(); }
  }

  function ligarBotoes() {
    function clique(id, f) { $(id).addEventListener("click", function (ev) { ev.currentTarget.blur(); f(); }); }
    clique("btJogar", comecar); clique("btContinuar", comecar);
    clique("btDeNovo", function () { PB.reiniciar(); comecar(); });
    clique("btRecomecar", function () { PB.reiniciar(); comecar(); });
    clique("btTocha", function () { J.stats.mortes++; PB.renascer(); comecar(); });
    clique("btPausa", function () { E.aoMenu("pausa"); });
    clique("btSom", function () { PB.audioIniciar(); alternarSom(); });
    clique("btMedidas", alternarMedidas);
    clique("btAjustes", function () { var a = $("ajustes"); a.hidden = !a.hidden; $("btAjustes").setAttribute("aria-pressed", String(!a.hidden)); });
    var app = $("app"), btTela = $("btTela");
    if (!document.fullscreenEnabled || !app.requestFullscreen) btTela.hidden = true;
    clique("btTela", function () {
      try { var p = document.fullscreenElement ? document.exitFullscreen() : app.requestFullscreen(); if (p && p.catch) p.catch(function () {}); } catch (err) { /* sem tela cheia aqui */ }
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) pausar(); });
  }

  function iniciar() {
    cv = $("jogo"); ctx = cv.getContext("2d");
    PB.reiniciar();
    montarAjustes(); ligarToque(); ligarBotoes();
    ajustarTela();
    window.addEventListener("resize", ajustarTela);
    if (window.ResizeObserver) new ResizeObserver(ajustarTela).observe($("palco"));
    ultimo = performance.now();
    requestAnimationFrame(quadro);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();

  // ---------- ferramentas de teste e medição (use no console do navegador) ----------
  var D = PB.debug = {
    // Segura as teclas dadas e avança n passos fixos. Ex.: PB.debug.passos(60, { dir: true })
    passos: function (n, teclas) {
      for (var k in E.seg) E.definir("teclado", k, !!(teclas && teclas[k]));
      for (var i = 0; i < n; i++) PB.passo(DT);
      return D.estado();
    },
    estado: function () {
      var b = J.batata;
      return { x: Math.round(b.x), y: Math.round(b.y), vx: Math.round(b.vx), vy: Math.round(b.vy), chao: b.noChao, vida: b.vida, amido: b.amido, morto: b.morto,
        estado: J.estado, inimigos: J.inimigos.filter(function (e) { return !e.morto && !e.manso; }).length, rodelas: J.rodelas.length, stats: J.stats };
    },
    // Tira o jogo do tempo real para testar passo a passo, sem som.
    preparar: function () {
      PB.reiniciar(); J.estado = "pausado"; J.semControle = false; PB.semSom = true;
      E.soltarTudo("teclado"); E.consumir();
      $("capa").hidden = true; $("pausa").hidden = true; $("fim").hidden = true;
      return D.estado();
    },
    // Devolve o jogo ao tempo real, na tela de abertura, com as teclas soltas.
    voltar: function () {
      PB.reiniciar(); PB.semSom = false; J.estado = "titulo"; J.semControle = true;
      E.soltarTudo("teclado"); E.consumir();
      $("fim").hidden = true; $("pausa").hidden = true; $("capa").hidden = false;
    },
    ir: function (col) {
      var b = J.batata;
      b.x = b.px = col * B; b.y = b.py = M.topo(Math.floor(col)) * B - b.h; b.vx = b.vy = 0; b.noChao = true;
      C.atualizar(0, b, true); return D.estado();
    },
    // Mede o que os números de ajuste.js dão na prática. Devolve distâncias em px e tempos em s.
    medir: function () {
      var r = {}, n, y0, x0, min;
      function novo() { D.preparar(); J.inimigos = []; D.passos(30, {}); return J.batata; }
      function ateOChao(teclas) { var k = 0; do { D.passos(1, teclas); k++; if (J.batata.y < min) min = J.batata.y; } while (!J.batata.noChao && k < 900); return k; }
      y0 = min = novo().y; D.passos(1, { pulo: true }); n = ateOChao({ pulo: true });
      r.puloAltura = y0 - min; r.puloTempoNoAr = (n + 1) * DT;
      min = novo().y; D.passos(1, { pulo: true }); ateOChao({});
      r.puloCurtoAltura = y0 - min;
      novo(); D.passos(40, { dir: true }); x0 = J.batata.x; D.passos(1, { dir: true, pulo: true }); ateOChao({ dir: true, pulo: true });
      r.puloDistancia = J.batata.x - x0;
      x0 = novo().x; D.passos(1, { dash: true }); D.passos(Math.ceil(A.dashTempo / DT), {});
      r.dashDistancia = J.med.dash;
      novo(); n = 0; while (J.batata.vx < A.velMax - 0.5 && n < 900) { D.passos(1, { dir: true }); n++; }
      r.tempoAteCorrer = n * DT;
      x0 = J.batata.x; n = 0; while (Math.abs(J.batata.vx) > 0.5 && n < 900) { D.passos(1, {}); n++; }
      r.distanciaParaParar = J.batata.x - x0; r.tempoParaParar = n * DT;
      r.golpeTotal = A.golpePreparo + A.golpeAtivo + A.golpeRecupera; r.golpeForteTotal = A.golpePreparo + A.golpeAtivo + A.golpeRecuperaForte;
      Object.keys(r).forEach(function (k) { r[k] = Math.round(r[k] * 1000) / 1000; });
      D.voltar();
      return r;
    }
  };
})();

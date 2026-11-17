// Testes do protótipo. Rodam o jogo passo a passo, sem depender do relógio, e conferem as regras.
// Como rodar: abra a página com #teste no fim do endereço, ou chame PB.debug.testar() no console.
// O último teste é um robô que atravessa a fase inteira: se um ajuste deixar algum pulo impossível, ele avisa.
(function () {
  "use strict";
  var PB = window.PB, B = PB.B, A = PB.A, M = PB.mundo, D = PB.debug;

  function achar(tipo, n) { return PB.J.inimigos.filter(function (e) { return e.tipo === tipo; })[n || 0]; }
  function bate(teclas) {
    var t = teclas || {}, com = { golpe: true }, k, nome;
    for (k in t) com[k] = t[k];
    D.passos(1, com); nome = PB.J.batata.golpe && PB.J.batata.golpe.nome; D.passos(54, t);
    return nome;
  }
  function ate(cond, max, teclas) { var n = 0; while (!cond() && n < max) { D.passos(1, teclas || {}); n++; } return n; }

  // Um jogador simples: corre para a direita, pula em buraco, parede e galho, usa o dash sobre espinhos
  // e, se houver inimigos, bate no que estiver na frente ou em cima, inclusive nas rodelas.
  function robo(comInimigos, maxPassos) {
    var J = PB.J, pulo = false, dash = false, golpe = false, i, k, l, b, e, pe, c, chaoL, quer, querDash, querGolpe, cima, t, dx, dy;
    D.preparar(); if (!comInimigos) J.inimigos = []; J.estado = "jogando";
    for (i = 0; i < maxPassos && J.estado !== "fim"; i++) {
      b = J.batata; pe = b.y + b.h; c = Math.floor((b.x + b.w / 2) / B); chaoL = Math.round(pe / B);
      quer = false; querDash = false; querGolpe = false; cima = false;
      if (b.noChao) {
        quer = !M.pisavel(b.x + b.w + 6, pe + 4) || b.parede === 1 || M.solido(Math.floor((b.x + b.w + 10) / B), chaoL - 1);
        for (k = 1; k <= 3; k++) if (M.tile(c + k, chaoL - 3) === 2) quer = true;
      } else {
        for (l = Math.floor(pe / B); l < M.alt; l++) { t = M.tile(c, l); if (t === 3) querDash = b.vy >= -40 && b.dashNoAr; if (t) break; }
      }
      if (comInimigos) for (k = 0; k < J.inimigos.length; k++) {
        e = J.inimigos[k]; if (e.morto || e.manso) continue;
        dx = e.x + e.w / 2 - (b.x + b.w / 2); dy = e.y + e.h / 2 - (b.y + b.h / 2);
        if (dx > -30 && dx < 125 && Math.abs(dy) < 70) querGolpe = true;
        if (Math.abs(dx) < 60 && dy < -30 && dy > -140) { querGolpe = true; cima = true; }
      }
      if (comInimigos) for (k = 0; k < J.rodelas.length; k++) {      // rodela chegando pela frente: rebate
        dx = J.rodelas[k].x - (b.x + b.w / 2); dy = J.rodelas[k].y - (b.y + b.h / 2);
        if (dx > -20 && dx < 150 && Math.abs(dy) < 60) querGolpe = true;
      }
      pulo = (!b.noChao && b.vy < 0 && pulo) ? true : (quer ? !pulo : false);    // apertar = soltar por um passo e apertar de novo
      dash = querDash ? !dash : false;
      golpe = querGolpe && !b.golpe ? !golpe : false;
      D.passos(1, { dir: true, pulo: pulo, dash: dash, golpe: golpe, cima: cima });
    }
    return { chegou: J.estado === "fim", tempo: Math.round(i / 12) / 10, col: Math.round(J.batata.x / B), dano: J.stats.dano, mortes: J.stats.mortes,
      tochas: J.tochas.filter(function (o) { return o.acesa; }).length };
  }
  PB.debug.robo = robo;

  PB.debug.testar = function () {
    var J = PB.J, R = [], m, n, k, antes, e, r, nomes, s;
    function t(nome, ok, detalhe) { R.push({ nome: nome, ok: !!ok, detalhe: detalhe === undefined ? "" : JSON.stringify(detalhe) }); }

    m = D.medir();
    t("pulo cheio chega perto da altura pedida", Math.abs(m.puloAltura - A.alturaPulo) < 8, m.puloAltura);
    t("toque rápido dá um pulo bem mais baixo", m.puloCurtoAltura < m.puloAltura * 0.45, m.puloCurtoAltura);
    t("dash anda o que a conta diz", Math.abs(m.dashDistancia - A.dashVel * A.dashTempo) < 12, m.dashDistancia);

    D.preparar(); D.ir(11.6); D.passos(5, {});
    nomes = [bate(), bate(), bate()];
    t("três golpes seguidos fecham no golpe forte", nomes.join() === "frente1,frente2,frente3" && J.stats.acertos === 3, nomes);
    t("cada golpe que acerta enche 1 de amido", J.batata.amido === 3, J.batata.amido);
    D.passos(1, { pure: true }); n = J.tiros.length; D.passos(40, {});
    t("a bola de purê gasta 3 de amido e acerta", n === 1 && J.batata.amido === 0 && J.stats.acertos === 4, { tiros: n, amido: J.batata.amido });
    D.passos(1, { pure: true });
    t("sem amido não sai bola de purê", J.tiros.length === 0);
    D.passos(60, {}); s = bate({ cima: true });
    D.passos(1, { pulo: true }); D.passos(20, { pulo: true }); D.passos(1, { baixo: true, golpe: true }); n = J.batata.golpe && J.batata.golpe.nome; D.passos(80, {});
    t("o golpe mira para cima e, no ar, para baixo", s === "cima" && n === "baixo", [s, n]);

    D.preparar(); antes = D.estado().inimigos; D.ir(59.8); D.passos(3, {});
    n = 0; while (D.estado().inimigos === antes && n < 6) { bate({ dir: true }); n++; }
    t("o cogumelo cai em até 4 golpes", D.estado().inimigos === antes - 1, n);
    D.preparar(); e = achar("cogumelo"); J.batata.x = J.batata.px = e.x + e.w / 2 - 100 - 15; n = ate(function () { return J.batata.vida < A.vida; }, 400);
    t("a fumaça fere quem fica parado a 100 px", J.batata.vida === A.vida - 1, n);
    t("todo ataque de inimigo avisa por pelo menos 0,3 s", PB.INIMIGOS.cogumelo.aviso >= 0.3 && PB.INIMIGOS.cenoura.aviso >= 0.3 && PB.INIMIGOS.cenoura.mira >= 0.3);

    D.preparar(); D.ir(85); e = achar("cenoura"); n = ate(function () { return J.batata.vida < A.vida; }, 1200);
    t("de perto, a cenoura investe e fere quem fica parado", J.batata.vida === A.vida - 1 && n > PB.INIMIGOS.cenoura.aviso * 120 && e.estado === "investe" && J.rodelas.length === 0, n);
    // A rodela é a arma da cenoura, não um bicho: sai da mão dela, voa reto e não tem vida.
    D.preparar(); D.ir(80.5); e = achar("cenoura"); n = ate(function () { return J.rodelas.length > 0; }, 400);
    r = e.estado; s = J.rodelas.length; ate(function () { return J.batata.vida < A.vida || !J.rodelas.length; }, 400);
    t("de longe, a cenoura mira por 0,5 s e atira uma rodela", s === 1 && r === "lanca" && n >= PB.INIMIGOS.cenoura.mira * 120 && J.batata.vida === A.vida - 1 && J.rodelas.length === 0,
      { passosAteAtirar: n, vida: J.batata.vida });
    D.preparar(); D.ir(80.5); n = 0;
    while (n < 500 && J.stats.rebatidas === 0 && J.batata.vida === A.vida) {
      s = J.rodelas[0]; k = s ? s.x - (J.batata.x + J.batata.w) : -1;
      D.passos(1, { golpe: k > 0 && k < 120 && !J.batata.golpe && n % 2 === 0 }); n++;
    }
    t("o cajado rebate a rodela, que rende 1 de amido", J.stats.rebatidas === 1 && J.batata.vida === A.vida && J.batata.amido === 1 && J.inimigos.length === 6, { passos: n, amido: J.batata.amido });
    D.preparar(); D.ir(30); J.batata.amido = A.custoPure;
    J.rodelas.push({ x: J.batata.x + 200, px: J.batata.x + 200, y: J.batata.y + 26, py: J.batata.y + 26, vx: -100, vy: 0, t: 0 });
    D.passos(1, { pure: true }); D.passos(40, {});
    t("a bola de purê desmancha a rodela no ar", J.rodelas.length === 0 && J.tiros.length === 0 && J.batata.vida === A.vida);
    // batata no chão, cenoura em cima do planalto, a menos de 200 px: perto, mas com a terra no meio
    D.preparar(); D.ir(75); e = achar("cenoura"); e.x = e.px = 79 * B; e.casaX = e.x + e.w / 2; ate(function () { return J.rodelas.length > 0; }, 360);
    t("a cenoura não atira quando há terra no caminho", J.rodelas.length === 0 && J.batata.vida === A.vida && e.estado === "anda");
    D.preparar(); D.ir(64.5); e = achar("cogumelo"); J.batata.y -= 150; J.batata.py = J.batata.y; J.batata.x = e.x + 14; J.batata.noChao = false;
    r = false; for (n = 0; n < 80 && !r; n++) { D.passos(1, { baixo: true, golpe: n % 6 === 0 }); r = !!(J.batata.golpe && J.batata.golpe.quicou); }
    t("golpe para baixo quica em cima do inimigo", r && J.batata.vy < 0, Math.round(J.batata.vy));

    D.preparar(); D.ir(38.5); D.passos(10, {}); D.passos(120, { dir: true }); D.passos(120, {});
    t("espinho tira 1 de vida e devolve ao chão firme", J.batata.vida === A.vida - 1 && J.batata.noChao && J.batata.x < 40 * B, Math.round(J.batata.x / B));
    D.preparar(); J.batata.vida = 2; D.ir(77); D.passos(60, { dir: true });
    t("a tocha acende, cura e vira o ponto de volta", J.tochas[0].acesa && J.batata.vida === A.vida && J.retorno.x === J.tochas[0].x);
    J.batata.vida = 1; D.ir(95.3); D.passos(10, {}); D.passos(150, { dir: true }); r = J.batata.morto; D.passos(260, {});
    t("sem vida, a batata volta para a tocha com a vida cheia", r && J.batata.vida === A.vida && Math.abs(J.batata.x + 15 - J.tochas[0].x) < 60, Math.round(J.batata.x / B));
    D.preparar(); J.estado = "jogando"; J.inimigos = []; D.ir(139.5); D.passos(120, { dir: true });
    t("chegar ao vidente termina a fase", J.estado === "fim" && !document.getElementById("fim").hidden);

    r = robo(false, 120 * 90);
    t("o robô atravessa a fase vazia sem se ferir", r.chegou && r.dano === 0 && r.tochas === 2, r);
    r = robo(true, 120 * 240);
    t("o robô termina a fase com os inimigos", r.chegou, r);

    D.voltar();     // devolve o jogo à tela de abertura
    return R;
  };

  function mostrar() {
    var R = PB.debug.testar(), falhas = R.filter(function (x) { return !x.ok; }).length, pre = document.getElementById("medidas");
    pre.hidden = false;
    pre.textContent = (falhas ? falhas + " TESTE(S) FALHARAM" : "TODOS OS " + R.length + " TESTES PASSARAM") + "\n" +
      R.map(function (x) { return (x.ok ? "ok    " : "FALHA ") + x.nome + (x.ok || !x.detalhe ? "" : "  " + x.detalhe); }).join("\n");
  }
  function seForTeste() { if (location.hash === "#teste") setTimeout(mostrar, 200); }
  window.addEventListener("load", seForTeste);
  window.addEventListener("hashchange", seForTeste);
})();

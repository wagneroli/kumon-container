/**
 * Kumon Event System v2.0 — Modern UI
 * Vanilla JS — zero dependencies
 */
(function () {
  "use strict";

  const API = "/api";
  let allParticipants = [];
  let historySorteios = [];
  let drawnIds = new Set();
  let activeFilter = "TODOS";

  /* ===================================================================
     THEME
     =================================================================== */
  function initTheme() {
    const saved = localStorage.getItem("kumon-theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (!saved) {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefers) document.documentElement.setAttribute("data-theme", "dark");
    }
    syncThemeUI();
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("kumon-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("kumon-theme", "light");
    }
    syncThemeUI();
  }

  function syncThemeUI() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const sun = document.getElementById("themeIconSun");
    const moon = document.getElementById("themeIconMoon");
    const label = document.getElementById("themeLabel");
    if (sun) sun.style.display = isDark ? "none" : "";
    if (moon) moon.style.display = isDark ? "" : "none";
    if (label) label.textContent = isDark ? "Claro" : "Escuro";
  }

  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  /* ===================================================================
     TOAST
     =================================================================== */
  function showToast(msg, type) {
    type = type || "success";
    var container = document.getElementById("toastContainer");
    var icons = {
      success:
        '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      error:
        '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning:
        '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    };
    var el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.innerHTML =
      (icons[type] || icons.success) +
      '<span class="toast-msg">' +
      msg +
      '</span><button class="toast-close" onclick="this.parentElement.remove()">&times;</button>';
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add("toast--removing");
      setTimeout(function () {
        if (el.parentElement) el.remove();
      }, 250);
    }, 3500);
  }

  /* ===================================================================
     SKELETON
     =================================================================== */
  function renderSkeletonRow() {
    return (
      '<div class="skeleton-row">' +
      '<div class="skeleton skeleton--avatar"></div>' +
      '<div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text" style="width:120px;"></div></div>' +
      '<div class="skeleton skeleton--badge"></div>' +
      '<div class="skeleton skeleton--btn"></div>' +
      "</div>"
    );
  }

  function showSkeletons(containerId, count) {
    count = count || 5;
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = "";
    for (var i = 0; i < count; i++) html += renderSkeletonRow();
    el.innerHTML = html;
  }

  /* ===================================================================
     CONFETTI
     =================================================================== */
  function shootConfetti() {
    var container = document.getElementById("confettiContainer");
    container.style.display = "block";
    var colors = ["#14b8a6", "#5eead4", "#f59e0b", "#a855f7", "#ec4899", "#3b82f6", "#22c55e", "#ef4444"];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 80; i++) {
      var piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.top = -(Math.random() * 40) + "px";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = Math.random() * 2 + 2 + "s";
      piece.style.animationDelay = Math.random() * 1.5 + "s";
      piece.style.width = Math.random() * 8 + 6 + "px";
      piece.style.height = Math.random() * 10 + 8 + "px";
      frag.appendChild(piece);
    }
    container.innerHTML = "";
    container.appendChild(frag);
    setTimeout(function () {
      container.style.display = "none";
    }, 4000);
  }

  /* ===================================================================
     MODAL SORTEIO
     =================================================================== */
  function openModalSorteio(numero, nome) {
    document.getElementById("sorteioNumero").textContent = "#" + numero;
    document.getElementById("sorteioNome").textContent = nome;
    document.getElementById("modalSorteio").style.display = "flex";
    shootConfetti();
    var btn = document.getElementById("btnModalOk");
    btn.textContent = "OK";
    btn.disabled = false;
  }

  function fecharModalSorteio() {
    var btn = document.getElementById("btnModalOk");
    btn.disabled = true;
    btn.textContent = "Atualizando...";
    var count = 3;
    var interval = setInterval(function () {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        document.getElementById("modalSorteio").style.display = "none";
        carregarListaPresenca();
        atualizarDashboard();
        atualizarInfoSorteio();
        exibirHistoricoSorteios();
        return;
      }
      btn.textContent = "Atualizando... " + count;
    }, 300);
  }

  // Close modal on overlay click
  document.getElementById("modalSorteio").addEventListener("click", function (e) {
    if (e.target === this && this.style.display === "flex") fecharModalSorteio();
  });

  /* ===================================================================
     SIDEBAR MOBILE
     =================================================================== */
  document.getElementById("sidebarToggle").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("open");
  });

  // Close sidebar when clicking main content on mobile
  document.getElementById("mainContent").addEventListener("click", function () {
    if (window.innerWidth <= 768) {
      document.getElementById("sidebar").classList.remove("open");
    }
  });

  /* ===================================================================
     NAVIGATION
     =================================================================== */
  function initNavigation() {
    var btns = document.querySelectorAll(".nav-btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pageId = this.dataset.page;
        btns.forEach(function (b) {
          b.classList.remove("active");
        });
        this.classList.add("active");

        document.querySelectorAll(".page").forEach(function (p) {
          p.classList.remove("active");
        });
        var page = document.getElementById(pageId);
        if (page) {
          page.classList.add("active");
          // Re-trigger fade animation
          page.style.animation = "none";
          page.offsetHeight; // force reflow
          page.style.animation = "";
        }

        // Lazy load page data
        if (pageId === "gerenciar") carregarParticipantes();
        if (pageId === "recepcao") carregarListaPresenca();
        if (pageId === "premiacao") inicializarPremiacoes();
        if (pageId === "sorteio") inicializarSorteio();
        if (pageId === "relatorios") carregarRelatorios();

        // Close sidebar on mobile after nav
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("open");
        }
      });
    });
  }

  /* ===================================================================
     DASHBOARD
     =================================================================== */
  async function atualizarDashboard() {
    try {
      var r = await fetch(API + "/stats");
      var s = await r.json();
      var setText = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setText("stat-participantes", s.total_participantes || 0);
      setText("stat-presentes", s.total_presentes || 0);
      setText("stat-premios", s.total_premios || 0);
      setText("stat-sorteios", historySorteios.length);

      var total = s.total_participantes || 1;
      var presentes = s.total_presentes || 0;
      var pct = Math.round((presentes / total) * 100);

      var progress = document.getElementById("progress-presenca");
      if (progress) progress.style.width = pct + "%";

      var progressText = document.getElementById("progress-text");
      if (progressText) progressText.textContent = presentes + " / " + total + " presentes";

      var progressPct = document.getElementById("progress-percent");
      if (progressPct) progressPct.textContent = pct + "%";
    } catch (e) {
      console.error("Dashboard error:", e);
    }
  }

  /* ===================================================================
     GERENCIAR PARTICIPANTES
     =================================================================== */
  async function carregarParticipantes() {
    var cont = document.getElementById("lista-participantes");
    showSkeletons("lista-participantes", 8);
    try {
      var r = await fetch(API + "/participantes");
      var lista = await r.json();
      if (!lista || lista.length === 0) {
        cont.innerHTML =
          '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><h3>Nenhum participante</h3><p>Nao ha participantes cadastrados</p></div>';
        return;
      }
      var html =
        '<table class="data-table"><thead><tr><th>Matricula</th><th>Nome</th><th>Tipo</th><th class="text-center">Status Pagamento</th></tr></thead><tbody>';
      lista.forEach(function (p) {
        var isPaid = p.status_pago === "PAGO";
        var badge = isPaid
          ? '<span class="badge badge--success">PAGO</span>'
          : '<span class="badge badge--neutral">NAO PAGO</span>';
        html +=
          "<tr><td><strong>" +
          (p.numero || "-") +
          "</strong></td><td>" +
          (p.nome || "-") +
          "</td><td>" +
          (p.tipo || "-") +
          '</td><td class="text-center">' +
          badge +
          "</td></tr>";
      });
      html += "</tbody></table>";
      cont.innerHTML = html;
    } catch (e) {
      console.error("Erro:", e);
      cont.innerHTML = '<div class="empty-state"><h3>Erro ao carregar</h3></div>';
    }
  }

  /* ===================================================================
     RECEPCAO (PRESENCA)
     =================================================================== */
  async function carregarListaPresenca() {
    var cont = document.getElementById("lista-presenca");
    showSkeletons("lista-presenca", 6);
    try {
      var r = await fetch(API + "/presenca/lista");
      var lista = await r.json();
      allParticipants = lista;
      if (!lista || lista.length === 0) {
        cont.innerHTML =
          '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><h3>Nenhum participante</h3><p>Nao ha participantes registrados</p></div>';
        return;
      }
      applyFilter();
    } catch (e) {
      console.error("Erro:", e);
    }
  }

  function applyFilter() {
    var filtered = allParticipants;
    if (activeFilter !== "TODOS") {
      filtered = allParticipants.filter(function (p) {
        return p.status_presenca === activeFilter;
      });
    }
    var searchTerm = document.getElementById("busca-recepcao");
    if (searchTerm && searchTerm.value.trim()) {
      var term = searchTerm.value.trim().toLowerCase();
      filtered = filtered.filter(function (p) {
        var num = String(p.numero || "");
        var name = (p.nome || "").toLowerCase();
        return num.includes(term) || name.includes(term);
      });
    }
    renderPresencaList(filtered);
  }

  function renderPresencaList(lista) {
    var cont = document.getElementById("lista-presenca");
    if (!lista || lista.length === 0) {
      cont.innerHTML =
        '<div class="empty-state"><h3>Nenhum resultado</h3><p>Tente ajustar os filtros</p></div>';
      return;
    }
    var html = "";
    lista.forEach(function (p) {
      var isPresent = p.status_presenca === "PRESENTE";
      var rowClass = isPresent ? "participant-item--present" : "participant-item--absent";
      var avatarClass = isPresent ? "participant-avatar--present" : "participant-avatar--absent";
      var initials = (p.nome || "?")
        .split(" ")
        .map(function (w) {
          return w[0];
        })
        .slice(0, 2)
        .join("")
        .toUpperCase();
      var statusBadge = isPresent
        ? '<span class="badge badge--success">PRESENTE</span>'
        : '<span class="badge badge--danger">AUSENTE</span>';
      var isPaid = p.status_pago === "PAGO";
      var paymentBtnText = isPaid ? "Nao Pago" : "Pago";
      var paymentBtnClass = isPaid ? "btn--secondary" : "btn--success";
      var paymentAction = isPaid ? "marcarNaoPago" : "marcarPago";

      html +=
        '<div class="participant-item ' +
        rowClass +
        '">' +
        '<div class="participant-avatar ' +
        avatarClass +
        '">' +
        initials +
        "</div>" +
        '<div class="participant-info">' +
        '<div class="participant-name">#' +
        p.numero +
        " - " +
        p.nome +
        "</div>" +
        '<div class="participant-meta">Tipo: ' +
        (p.tipo || "-") +
        " &middot; " +
        statusBadge +
        "</div>" +
        "</div>" +
        '<div class="participant-actions">' +
        '<button class="btn btn--sm ' +
        (isPresent ? "btn--danger" : "btn--success") +
        '" onclick="' +
        (isPresent ? "marcarAusente" : "marcarPresenca") +
        "(" +
        p.id +
        ')">' +
        (isPresent ? "Ausente" : "Presente") +
        "</button>" +
        '<button class="btn btn--sm ' +
        paymentBtnClass +
        "\" onclick=\"" +
        paymentAction +
        "(" +
        p.id +
        ")\">" +
        paymentBtnText +
        "</button>" +
        "</div>" +
        "</div>";
    });
    cont.innerHTML = html;
  }

  function filtrarListaPresenca() {
    var searchEl = document.getElementById("busca-recepcao");
    var clearBtn = document.getElementById("searchClear");
    if (searchEl && clearBtn) {
      if (searchEl.value.trim()) {
        clearBtn.classList.add("visible");
      } else {
        clearBtn.classList.remove("visible");
      }
    }
    applyFilter();
  }

  function limparBusca() {
    var searchEl = document.getElementById("busca-recepcao");
    if (searchEl) searchEl.value = "";
    document.getElementById("searchClear").classList.remove("visible");
    applyFilter();
  }

  function filtrarPorStatusPresenca(status, btn) {
    activeFilter = status;
    document.querySelectorAll(".pill-tab").forEach(function (t) {
      t.classList.remove("active");
    });
    if (btn) btn.classList.add("active");
    applyFilter();
  }

  async function marcarPresenca(id) {
    try {
      var r = await fetch(API + "/presenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participante_id: id, status: "PRESENTE" }),
      });
      var d = await r.json();
      if (d.sucesso) {
        showToast("Presenca confirmada", "success");
        carregarListaPresenca();
        atualizarDashboard();
      } else {
        showToast(d.erro || "Erro ao marcar presenca", "error");
      }
    } catch (e) {
      showToast("Erro de conexao", "error");
    }
  }

  async function marcarAusente(id) {
    try {
      var r = await fetch(API + "/presenca/ausente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participante_id: id }),
      });
      var d = await r.json();
      if (d.sucesso) {
        showToast("Participante marcado como ausente", "warning");
        carregarListaPresenca();
        atualizarDashboard();
      } else {
        showToast(d.erro || "Erro", "error");
      }
    } catch (e) {
      showToast("Erro de conexao", "error");
    }
  }

  async function marcarPago(id) {
    try {
      var r = await fetch(API + "/presenca/update-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participante_id: id, status_pago: "PAGO" }),
      });
      if (r.ok) {
        showToast("Pagamento confirmado", "success");
        carregarListaPresenca();
      }
    } catch (e) {
      showToast("Erro de conexao", "error");
    }
  }

  async function marcarNaoPago(id) {
    try {
      var r = await fetch(API + "/presenca/update-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participante_id: id, status_pago: "NAO_PAGO" }),
      });
      if (r.ok) {
        showToast("Pagamento revertido", "warning");
        carregarListaPresenca();
      }
    } catch (e) {
      showToast("Erro de conexao", "error");
    }
  }

  /* ===================================================================
     PREMIACAO
     =================================================================== */
  async function inicializarPremiacoes() {
    try {
      var r = await fetch(API + "/categorias");
      var categorias = await r.json();
      var select = document.getElementById("select-categoria");
      if (!select || !categorias) return;
      select.innerHTML = '<option value="">-- Selecione uma categoria --</option>';
      categorias.forEach(function (c) {
        select.innerHTML += '<option value="' + c.id + '">' + c.nome + "</option>";
      });
    } catch (e) {
      console.error("Erro categorias:", e);
    }
  }

  async function carregarPremiosPorCategoria() {
    var select = document.getElementById("select-categoria");
    var cont = document.getElementById("lista-premios-container");
    if (!select || !select.value) {
      cont.innerHTML =
        '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg><h3>Selecione uma categoria</h3><p>Escolha uma categoria para ver os alunos elegiveis</p></div>';
      return;
    }
    // Skeleton
    cont.innerHTML =
      '<table class="data-table"><thead><tr><th>Categoria</th><th>Nome</th><th class="text-center">Presente</th><th class="text-center">Entrega</th><th class="text-center">Acao</th></tr></thead><tbody>' +
      [1, 2, 3, 4, 5]
        .map(function () {
          return (
            "<tr><td><div class='skeleton skeleton--text' style='width:80px;height:12px;'></div></td>" +
            "<td><div class='skeleton skeleton--text' style='width:160px;height:12px;'></div></td>" +
            "<td><div class='skeleton skeleton--badge' style='margin:0 auto;'></div></td>" +
            "<td><div class='skeleton skeleton--badge' style='margin:0 auto;'></div></td>" +
            "<td><div class='skeleton skeleton--btn' style='margin:0 auto;'></div></td></tr>"
          );
        })
        .join("") +
      "</tbody></table>";

    try {
      var categId = parseInt(select.value);
      var r = await fetch(API + "/premios/categoria/" + categId);
      var premios = await r.json();

      if (!premios || premios.length === 0) {
        cont.innerHTML =
          '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg><h3>Nenhum premio</h3><p>Nao ha alunos elegiveis nesta categoria</p></div>';
        return;
      }

      var html =
        '<table class="data-table"><thead><tr><th>Categoria</th><th>Nome</th><th class="text-center">Presente</th><th class="text-center">Pagamento</th><th class="text-center">Entrega</th><th class="text-center">Acao</th></tr></thead><tbody>';
      premios.forEach(function (premio) {
        var isEntregue = premio.status_entrega === "ENTREGUE";
        var entregaBadge = isEntregue
          ? '<span class="badge badge--success">ENTREGUE</span>'
          : '<span class="badge badge--warning">PENDENTE</span>';
        var presenteBadge =
          premio.status_presente === "SIM"
            ? '<span class="badge badge--success">SIM</span>'
            : '<span class="badge badge--danger">NAO</span>';
        var isPaid = premio.status_pago === "PAGO";
        var pagoBadge = isPaid
          ? '<span class="badge badge--success">PAGO</span>'
          : '<span class="badge badge--danger">' + (premio.status_pago || 'NAO_PAGO') + '</span>';
        var btnLabel = isEntregue ? "Reverter" : "Entregar";
        var btnClass = isEntregue ? "btn--secondary" : "btn--success";
        var novoStatus = isEntregue ? "NAO" : "ENTREGUE";

        html +=
          "<tr>" +
          "<td>" +
          (premio.categoria_nome || "-") +
          "</td>" +
          "<td><strong>#" +
          (premio.numero || premio.participante_id) +
          "</strong> - " +
          (premio.nome || "-") +
          "</td>" +
          '<td class="text-center">' +
          presenteBadge +
          "</td>" +
          '<td class="text-center">' +
          pagoBadge +
          "</td>" +
          '<td class="text-center">' +
          entregaBadge +
          "</td>" +
          '<td class="text-center"><button class="btn btn--sm ' +
          btnClass +
          "\" onclick=\"atualizarPremio(" +
          premio.id +
          ",'" +
          novoStatus +
          "')\">" +
          btnLabel +
          "</button></td>" +
          "</tr>";
      });
      html += "</tbody></table>";
      cont.innerHTML = html;
    } catch (e) {
      console.error("Erro premios:", e);
      cont.innerHTML = '<div class="empty-state"><h3>Erro ao carregar</h3></div>';
    }
  }

  async function atualizarPremio(premioId, novoStatus) {
    try {
      var r = await fetch(API + "/premios/" + premioId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_entrega: novoStatus }),
      });
      if (r.ok) {
        var msg = novoStatus === "ENTREGUE" ? "Premio entregue!" : "Entrega revertida";
        showToast(msg, "success");
        carregarPremiosPorCategoria();
        atualizarDashboard();
      }
    } catch (e) {
      showToast("Erro ao atualizar", "error");
    }
  }

  /* ===================================================================
     VALIDACAO PREMIACAO
     =================================================================== */
  async function executarValidacaoPremiacao() {
    var banner = document.getElementById("validacao-banner");
    var btn = document.getElementById("btn-validar-premiacao");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Validando...";
    }
    banner.style.display = "block";
    banner.innerHTML =
      '<div style="background:var(--color-info-bg);border:1px solid var(--color-info);border-radius:var(--radius-md);padding:var(--space-14) var(--space-20);color:var(--color-info);">Verificando premiacoes...</div>';

    try {
      var r = await fetch(API + "/premiacao/validar");
      var v = await r.json();

      if (v.status === "ok") {
        banner.innerHTML =
          '<div style="background:var(--color-success-bg);border:1px solid var(--color-success);border-radius:var(--radius-md);padding:var(--space-14) var(--space-20);display:flex;align-items:center;gap:var(--space-10);">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + (document.documentElement.getAttribute("data-theme") === "dark" ? "#4ade80" : "#16a34a") + '" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' +
          '<div><strong>Todas as premiacoes OK</strong><br><span style="font-size:var(--font-size-sm);">' +
          v.elegiveis_pagos + " alunos elegiveis (presentes + pago) de " + v.total_presentes + " presentes.</span></div>" +
          "</div>";
      } else {
        var violacoesHtml = "";
        v.detalhes.forEach(function (item) {
          violacoesHtml +=
            "<tr><td>" + (item.categoria_nome || "-") + "</td>" +
            "<td><strong>#" + item.numero + "</strong> - " + item.nome + "</td>" +
            '<td class="text-center"><span class="badge badge--danger">' + (item.status_pago || 'NAO_PAGO') + "</span></td></tr>";
        });
        banner.innerHTML =
          '<div style="background:var(--color-danger-bg);border:1px solid var(--color-danger);border-radius:var(--radius-md);padding:var(--space-14) var(--space-20);">' +
          '<div style="display:flex;align-items:center;gap:var(--space-10);color:var(--color-danger);margin-bottom:var(--space-12);">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
          "<strong>" + v.mensagem + "</strong></div>" +
          '<div class="data-table-wrapper" style="max-height:250px;">' +
          '<table class="data-table"><thead><tr><th>Categoria</th><th>Nome</th><th class="text-center">Pagamento</th></tr></thead><tbody>' +
          violacoesHtml + "</tbody></table></div></div>";
      }
    } catch (e) {
      banner.innerHTML =
        '<div style="background:var(--color-danger-bg);border:1px solid var(--color-danger);border-radius:var(--radius-md);padding:var(--space-14) var(--space-20);color:var(--color-danger);">Erro ao validar: ' + e.message + "</div>";
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Validar Premiacoes";
    }
  }

  /* ===================================================================
     SORTEIO
     =================================================================== */
  function loadHistoryFromStorage() {
    try {
      var stored = localStorage.getItem("kumon-sorteios");
      if (stored) {
        historySorteios = JSON.parse(stored);
        drawnIds = new Set(historySorteios.map(function (s) { return s.id; }));
      }
    } catch (e) {}
  }

  function saveHistory() {
    try {
      localStorage.setItem("kumon-sorteios", JSON.stringify(historySorteios));
    } catch (e) {}
  }

  function atualizarInfoSorteio() {
    var presentes = allParticipants.filter(function (p) {
      return p.status_presenca === "PRESENTE" && !drawnIds.has(p.id);
    });
    var total = presentes.length;
    var sorteados = historySorteios.length;
    var totalGeral = total + sorteados;
    var pct = totalGeral > 0 ? Math.round((sorteados / totalGeral) * 100) : 0;

    var statusDiv = document.getElementById("status-sorteio");
    if (statusDiv) {
      statusDiv.innerHTML =
        '<div style="background:var(--color-surface-hover);padding:16px;border-radius:var(--radius-lg);">' +
        '<div class="progress-label"><span>Disponiveis: <strong>' +
        total +
        "</strong></span><span>Sorteados: <strong>" +
        sorteados +
        "</strong></span></div>" +
        '<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' +
        pct +
        '%;"></div></div>' +
        "</div>";
    }
  }

  function exibirHistoricoSorteios() {
    var cont = document.getElementById("historico-sorteios");
    if (!historySorteios || historySorteios.length === 0) {
      cont.innerHTML =
        '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><h3>Nenhum sorteio</h3><p>Os sorteios realizados aparecerao aqui</p></div>';
      return;
    }
    var reversed = historySorteios.slice().reverse();
    var html = '<div class="timeline">';
    reversed.forEach(function (item) {
      html +=
        '<div class="timeline-item"><div class="timeline-number">#' +
        item.numero +
        '</div><div class="timeline-name">' +
        item.nome +
        "</div></div>";
    });
    html += "</div>";
    cont.innerHTML = html;
  }

  async function inicializarSorteio() {
    await carregarListaPresenca();
    atualizarInfoSorteio();
    exibirHistoricoSorteios();
    var btnSortear = document.getElementById("btn-realizar-sorteio");
    var btnLimpar = document.getElementById("btn-limpar-sorteios");
    if (btnSortear) {
      btnSortear.onclick = realizarSorteio;
    }
    if (btnLimpar) {
      btnLimpar.onclick = limparSorteios;
    }
  }

  async function realizarSorteio() {
    await carregarListaPresenca();
    var presentes = allParticipants.filter(function (p) {
      return p.status_presenca === "PRESENTE" && !drawnIds.has(p.id);
    });
    if (presentes.length === 0) {
      showToast("Nenhum participante disponível para sorteio!", "warning");
      return;
    }
    var indice = Math.floor(Math.random() * presentes.length);
    var sorteado = presentes[indice];

    historySorteios.push(sorteado);
    drawnIds.add(sorteado.id);
    saveHistory();

    openModalSorteio(sorteado.numero, sorteado.nome);
    atualizarDashboard();
  }

  async function limparSorteios() {
    if (!confirm("Tem certeza que deseja limpar todo o historico de sorteios?")) return;
    historySorteios = [];
    drawnIds.clear();
    localStorage.removeItem("kumon-sorteios");
    exibirHistoricoSorteios();
    atualizarInfoSorteio();
    carregarListaPresenca();
    atualizarDashboard();
    showToast("Historico de sorteios limpo", "warning");
  }

  /* ===================================================================
     RELATORIOS
     =================================================================== */
  async function carregarRelatorios() {
    try {
      var r = await fetch(API + "/stats");
      var s = await r.json();
      var setText = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setText("rel-participantes", s.total_participantes || 0);
      setText("rel-presentes", s.total_presentes || 0);
      setText("rel-premios", s.total_premios || 0);
      setText("rel-sorteios", historySorteios.length);
    } catch (e) {
      console.error("Erro relatorios:", e);
    }
  }

  /* ===================================================================
     EXPORT TO GLOBAL SCOPE (needed for onclick handlers)
     =================================================================== */
  window.filtrarListaPresenca = filtrarListaPresenca;
  window.limparBusca = limparBusca;
  window.filtrarPorStatusPresenca = filtrarPorStatusPresenca;
  window.marcarPresenca = marcarPresenca;
  window.marcarAusente = marcarAusente;
  window.marcarPago = marcarPago;
  window.marcarNaoPago = marcarNaoPago;
  window.carregarPremiosPorCategoria = carregarPremiosPorCategoria;
  window.atualizarPremio = atualizarPremio;
  window.fecharModalSorteio = fecharModalSorteio;
  window.carregarListaPresenca = carregarListaPresenca;
  window.executarValidacaoPremiacao = executarValidacaoPremiacao;

  /* ===================================================================
     INIT
     =================================================================== */
  function init() {
    initTheme();
    loadHistoryFromStorage();
    initNavigation();
    atualizarDashboard();
    carregarListaPresenca();
    setInterval(atualizarDashboard, 120000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

console.log(
  "✓ Script FINAL v2025 - COM PREMIAÇÃO CORRIGIDA - COMBO PERMANENTE"
);

const API_URL = "/api";
let listaParticipantesCompleta = [];
let listaPresentes = [];
let categoriaAtiva = null;
let filtroStatusPresenca = null;
let historicoSorteios = [];
let sorteadosIds = new Set();

document.addEventListener("DOMContentLoaded", function () {
  console.log("✓ DOM pronto");
  carregarHistoricoDoStorage();
  inicializarNavegacao();
  atualizarDashboard();
  carregarListaPresenca();
  setInterval(atualizarDashboard, 120000);

  const btnSortear = document.getElementById("btn-realizar-sorteio");
  const btnLimpar = document.getElementById("btn-limpar-sorteios");
  if (btnSortear) btnSortear.addEventListener("click", realizarSorteio);
  if (btnLimpar) btnLimpar.addEventListener("click", limparSorteios);
});

function carregarHistoricoDoStorage() {
  try {
    const stored = localStorage.getItem("sorteios_historico");
    if (stored) {
      historicoSorteios = JSON.parse(stored);
      sorteadosIds = new Set(historicoSorteios.map((s) => s.id));
      console.log(
        "[STORAGE] Histórico carregado:",
        historicoSorteios.length,
        "sorteios"
      );
    }
  } catch (e) {
    console.error("❌ Erro ao carregar histórico:", e);
  }
}

function salvarHistoricoNoStorage() {
  try {
    localStorage.setItem(
      "sorteios_historico",
      JSON.stringify(historicoSorteios)
    );
    console.log(
      "[STORAGE] Histórico salvo:",
      historicoSorteios.length,
      "sorteios"
    );
  } catch (e) {
    console.error("❌ Erro ao salvar histórico:", e);
  }
}

// ==================== NAVEGAÇÃO ====================
function inicializarNavegacao() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const pageId = this.dataset.page;
      navBtns.forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".page")
        .forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      const page = document.getElementById(pageId);
      if (page) page.classList.add("active");

      if (pageId === "gerenciar") carregarParticipantes();
      if (pageId === "recepcao") carregarListaPresenca();
      if (pageId === "premiacao") inicializarPremiacoes();
      if (pageId === "sorteio") inicializarSorteio();
      if (pageId === "relatorios") carregarRelatorios();
    });
  });
}

// ==================== DASHBOARD ====================
async function atualizarDashboard() {
  try {
    const r = await fetch(API_URL + "/stats");
    if (!r.ok) throw new Error("Erro na API");
    const s = await r.json();

    const el = (id) => document.getElementById(id);

    if (el("stat-participantes"))
      el("stat-participantes").textContent = s.total_participantes || 0;
    if (el("stat-presentes"))
      el("stat-presentes").textContent = s.total_presentes || 0;
    if (el("stat-premios"))
      el("stat-premios").textContent = s.total_premios || 0;
    if (el("stat-sorteios"))
      el("stat-sorteios").textContent = historicoSorteios.length;

    const total = s.total_participantes || 1;
    const presentes = s.total_presentes || 0;
    const pct = Math.round((presentes / total) * 100);

    const progress = el("progress-presenca");
    if (progress) progress.style.width = pct + "%";

    const progressText = el("progress-text");
    if (progressText)
      progressText.textContent = `${presentes} / ${total} presentes (${pct}%)`;

    console.log("✓ Dashboard atualizado");
  } catch (e) {
    console.error("❌ Erro ao atualizar dashboard:", e);
  }
}

// ==================== GERENCIAR ====================
async function carregarParticipantes() {
  try {
    const r = await fetch(API_URL + "/participantes");
    const lista = await r.json();
    const cont = document.getElementById("lista-participantes");

    if (!cont || !lista || lista.length === 0) {
      if (cont) cont.innerHTML = "<p>Nenhum participante registrado</p>";
      return;
    }

    let html = `<table class="tabela-participantes">
      <thead>
        <tr>
          <th>Matrícula</th>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Status Pago</th>
        </tr>
      </thead>
      <tbody>`;

    lista.forEach((p) => {
      const status = p.status_pago === "PAGO" ? "✓ PAGO" : "✗ NÃO PAGO";
      html += `<tr>
        <td>${p.numero || "-"}</td>
        <td>${p.nome || "-"}</td>
        <td>${p.tipo || "-"}</td>
        <td>${status}</td>
      </tr>`;
    });

    html += "</tbody></table>";
    cont.innerHTML = html;
  } catch (e) {
    console.error("❌ Erro ao carregar participantes:", e);
  }
}

// ==================== RECEPÇÃO (PRESENÇA) ====================
async function carregarListaPresenca() {
  try {
    console.log("[RECEPÇÃO] Carregando lista de presença...");
    const r = await fetch(API_URL + "/presenca/lista");
    const lista = await r.json();

    listaParticipantesCompleta = lista;
    listaPresentes = lista.filter(
      (p) => p.status_presenca === "PRESENTE" && !sorteadosIds.has(p.id)
    );

    console.log(
      "[RECEPÇÃO] Total:",
      lista.length,
      "| Presentes:",
      listaPresentes.length,
      "| Já sorteados:",
      sorteadosIds.size
    );
    renderizarListaPresenca(lista);
  } catch (e) {
    console.error("❌ Erro ao carregar lista de presença:", e);
  }
}

function filtrarListaPresenca() {
  const busca = document.getElementById("busca-recepcao");
  if (!busca) return;

  const termo = busca.value.trim().toLowerCase();
  let filtrados = listaParticipantesCompleta;

  if (filtroStatusPresenca && filtroStatusPresenca !== "TODOS") {
    filtrados = filtrados.filter(
      (p) => p.status_presenca === filtroStatusPresenca
    );
  }

  if (termo) {
    filtrados = filtrados.filter((p) => {
      const numero = String(p.numero || "").toLowerCase();
      const nome = (p.nome || "").toLowerCase();
      return numero.includes(termo) || nome.includes(termo);
    });
  }

  renderizarListaPresenca(filtrados);
}

function filtrarPorStatusPresenca(status) {
  console.log(`[FILTRO] Novo status selecionado: ${status}`);
  filtroStatusPresenca = status === "TODOS" ? null : status;
  filtrarListaPresenca();
}

function renderizarListaPresenca(lista) {
  const cont = document.getElementById("lista-presenca");
  if (!cont) return;

  if (!lista || lista.length === 0) {
    cont.innerHTML = "<p>Nenhum participante encontrado</p>";
    return;
  }

  let html = "";
  lista.forEach((p) => {
    const statusBD = p.status_presenca === "PRESENTE";
    const bgPresenca = statusBD ? "#f0f9f9" : "#fff9f9";
    const colorPresenca = statusBD ? "#32B8C6" : "#A84B2F";
    const btnTextPresenca = statusBD ? "✗ Ausente" : "✓ Presente";
    const btnActionPresenca = statusBD ? "marcarAusente" : "marcarPresenca";
    const statusTextPresenca = statusBD ? "✓ PRESENTE" : "✗ AUSENTE";

    const statusPago = p.status_pago === "PAGO";
    const btnTextPago = statusPago ? "✗ Não Pago" : "✓ Pago";
    const btnActionPago = statusPago ? "marcarNaoPago" : "marcarPago";
    const colorPago = statusPago ? "#32b8c6" : "#a84b2f";

    const tipo = p.tipo || "-";

    html += `
      <div class="card" style="background-color: ${bgPresenca}; margin-bottom: 8px; border-left: 4px solid ${colorPresenca}; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;">
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 14px;">
            #${p.numero} - ${p.nome}
          </div>
          <div style="font-size: 12px; color: ${colorPresenca}; margin-top: 4px; display: flex; gap: 12px;">
            <span>${statusTextPresenca}</span>
            <span style="color: #666; font-style: italic;">Tipo: ${tipo}</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="btn btn-sm" style="background: ${colorPresenca}; color: white; padding: 8px 12px; font-size: 12px; white-space: nowrap;" onclick="${btnActionPresenca}(${p.id})">${btnTextPresenca}</button>
          <button class="btn btn-sm" style="background: ${colorPago}; color: white; padding: 8px 12px; font-size: 12px; white-space: nowrap;" onclick="${btnActionPago}(${p.id})">${btnTextPago}</button>
        </div>
      </div>
    `;
  });

  cont.innerHTML = html;
}

async function marcarPresenca(id) {
  try {
    const r = await fetch(API_URL + "/presenca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participante_id: id, status: "PRESENTE" }),
    });
    if (r.ok) {
      console.log("✓ Presença marcada");
      carregarListaPresenca();
    }
  } catch (e) {
    console.error("❌ Erro:", e);
  }
}

async function marcarAusente(id) {
  try {
    const r = await fetch(API_URL + "/presenca/ausente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participante_id: id }),
    });
    if (r.ok) {
      console.log("✓ Ausência marcada");
      carregarListaPresenca();
    }
  } catch (e) {
    console.error("❌ Erro:", e);
  }
}

async function marcarPago(id) {
  try {
    const r = await fetch(API_URL + "/presenca/update-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participante_id: id, status_pago: "PAGO" }),
    });
    if (r.ok) {
      console.log("✓ Status pago atualizado");
      carregarListaPresenca();
    }
  } catch (e) {
    console.error("❌ Erro:", e);
  }
}

async function marcarNaoPago(id) {
  try {
    const r = await fetch(API_URL + "/presenca/update-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participante_id: id, status_pago: "NAO_PAGO" }),
    });
    if (r.ok) {
      console.log("✓ Status não pago atualizado");
      carregarListaPresenca();
    }
  } catch (e) {
    console.error("❌ Erro:", e);
  }
}

// ==================== PREMIAÇÃO ====================
async function inicializarPremiacoes() {
  try {
    console.log("[PREMIOS] Inicializando seção de premiação...");

    const r = await fetch(API_URL + "/categorias");
    const categorias = await r.json();
    const select = document.getElementById("select-categoria");

    if (!select || !categorias || categorias.length === 0) {
      console.log("[PREMIOS] ❌ Select não encontrado");
      return;
    }

    select.innerHTML = '<option value="">-- Selecione --</option>';
    categorias.forEach((c) => {
      select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });

    console.log("✓ Categorias carregadas:", categorias.length);
  } catch (e) {
    console.error("❌ Erro ao inicializar premiações:", e);
  }
}

async function carregarPremiosPorCategoria() {
  try {
    const select = document.getElementById("select-categoria");
    if (!select || !select.value) {
      document.getElementById("lista-premios-container").innerHTML =
        "<p class='empty-state'>Selecione uma categoria para ver os alunos</p>";
      return;
    }

    const categId = parseInt(select.value);
    console.log(`[PREMIOS] Buscando premios para categoria ${categId}`);

    const r = await fetch(API_URL + `/premios/categoria/${categId}`);
    const premios = await r.json();
    const cont = document.getElementById("lista-premios-container");

    if (!cont) {
      console.log("[PREMIOS] ❌ Container não encontrado");
      return;
    }

    if (!premios || premios.length === 0) {
      cont.innerHTML =
        "<p class='empty-state'>Nenhum prêmio nesta categoria</p>";
      return;
    }

    renderizarListaPremios(premios, cont);
    console.log("✓ Prêmios carregados:", premios.length);
  } catch (e) {
    console.error("❌ Erro ao carregar prêmios:", e);
  }
}

function renderizarListaPremios(lista, cont) {
  if (!cont || !lista || lista.length === 0) {
    if (cont)
      cont.innerHTML =
        "<p class='empty-state'>Nenhum prêmio nesta categoria</p>";
    return;
  }

  let html = `<table class="tabela-premios" style="width: 100%; border-collapse: collapse; margin-top: 16px;">
    <thead>
      <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
        <th style="padding: 12px; text-align: left;">Categoria</th>
        <th style="padding: 12px; text-align: left;">Nome</th>
        <th style="padding: 12px; text-align: left;">Presente</th>
        <th style="padding: 12px; text-align: left;">Entrega</th>
        <th style="padding: 12px; text-align: center;">Ação</th>
      </tr>
    </thead>
    <tbody>`;

  lista.forEach((premio) => {
    const numero = premio.numero || "-";
    const nome = premio.nome || "-";
    const categoria = premio.categoria_nome || "-";
    const statusPresente = premio.status_presente === "SIM" ? "✓ SIM" : "✗ NÃO";
    const statusEntrega =
      premio.status_entrega === "ENTREGUE" ? "✓ ENTREGUE" : "⏳ PENDENTE";
    const btnText =
      premio.status_entrega === "ENTREGUE" ? "Pendente" : "✓ Entregar";
    const novoStatus =
      premio.status_entrega === "ENTREGUE" ? "NAO" : "ENTREGUE";

    html += `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px;">${categoria}</td>
      <td style="padding: 12px;">#${numero} - ${nome}</td>
      <td style="padding: 12px; color: #32B8C6;">${statusPresente}</td>
      <td style="padding: 12px;">${statusEntrega}</td>
      <td style="padding: 12px; text-align: center;">
        <button class="btn btn-sm" style="background-color: #32B8C6; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;" onclick="atualizarPremio(${premio.id}, '${novoStatus}')">${btnText}</button>
      </td>
    </tr>`;
  });

  html += `</tbody></table>`;
  cont.innerHTML = html;
}

async function atualizarPremio(premioId, novoStatus) {
  try {
    console.log(`[PREMIOS] Atualizando premio ${premioId} para ${novoStatus}`);
    const r = await fetch(API_URL + `/premios/${premioId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_entrega: novoStatus }),
    });

    if (r.ok) {
      console.log("✓ Prêmio atualizado");
      const select = document.getElementById("select-categoria");
      if (select && select.value) {
        carregarPremiosPorCategoria();
      }
    }
  } catch (e) {
    console.error("❌ Erro ao atualizar prêmio:", e);
  }
}

// ==================== SORTEIO ====================
async function inicializarSorteio() {
  try {
    console.log("[SORTEIO] Inicializando sorteio...");
    await carregarListaPresenca();
    atualizarInfoSorteio();
    exibirHistoricoSorteios();
    console.log(
      "✓ Sorteio pronto. Presentes disponíveis:",
      listaPresentes.length
    );
  } catch (e) {
    console.error("❌ Erro ao inicializar sorteio:", e);
  }
}

function atualizarInfoSorteio() {
  const divTotal =
    document.querySelector("#sorteio [data-total]") ||
    document.querySelector("#sorteio p") ||
    document.getElementById("total-disponiveis");
  if (divTotal) {
    const count = listaPresentes.length;
    divTotal.textContent = `✓ ${count} participante(s) disponível(is) para sorteio`;
    console.log(`[SORTEIO] Info: ${count} presentes disponíveis`);
  }
}

function mostrarPopupSorteio(numero) {
  const popupAntigo = document.getElementById("modal-sorteio");
  if (popupAntigo) popupAntigo.remove();

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  const modal = document.createElement("div");
  modal.id = "modal-sorteio";
  modal.style.cssText = `
    background: white;
    padding: 60px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: zoomIn 0.5s ease-out;
  `;

  const btnOk = document.createElement("button");
  btnOk.id = "btn-popup-ok";
  btnOk.style.cssText = `
    margin-top: 40px;
    padding: 15px 40px;
    font-size: 18px;
    background: #32B8C6;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
  `;
  btnOk.textContent = "OK";

  btnOk.addEventListener("click", function () {
    this.disabled = true;
    this.textContent = "Atualizando... 3";
    let countdown = 3;

    const interval = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.textContent = `Atualizando... ${countdown}`;
      } else {
        clearInterval(interval);
        overlay.remove();
      }
    }, 300);
  });

  modal.innerHTML = `
    <style>
      @keyframes zoomIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    </style>
    <div style="font-size: 80px; font-weight: bold; color: #32B8C6; margin-bottom: 30px;">
      🎉
    </div>
    <div style="font-size: 24px; color: #666; margin-bottom: 40px;">
      SORTEADO
    </div>
    <div style="font-size: 120px; font-weight: bold; color: #32B8C6;">
      #${numero} <p> PARABÉNS! </p>
    </div>
  `;

  modal.appendChild(btnOk);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

async function realizarSorteio() {
  try {
    await carregarListaPresenca();

    if (!listaPresentes || listaPresentes.length === 0) {
      alert("❌ Nenhum participante presente para sortear!");
      return;
    }

    const indice = Math.floor(Math.random() * listaPresentes.length);
    const sorteado = listaPresentes[indice];

    console.log(`[SORTEIO] Sorteado: #${sorteado.numero} - ${sorteado.nome}`);

    historicoSorteios.push(sorteado);
    sorteadosIds.add(sorteado.id);
    salvarHistoricoNoStorage();

    mostrarPopupSorteio(sorteado.numero);

    setTimeout(() => {
      console.log("[SORTEIO] Atualizando dados...");
      carregarListaPresenca();
      atualizarDashboard();
      atualizarInfoSorteio();
      exibirHistoricoSorteios();
      console.log("[SORTEIO] ✓ Dados atualizados!");
    }, 500);
  } catch (e) {
    console.error("❌ Erro ao realizar sorteio:", e);
    alert("❌ Erro ao realizar sorteio!");
  }
}

async function limparSorteios() {
  if (!confirm("Tem certeza que deseja limpar o histórico de sorteios?"))
    return;

  try {
    console.log("[SORTEIO] Limpando histórico");
    historicoSorteios = [];
    sorteadosIds.clear();
    localStorage.removeItem("sorteios_historico");
    exibirHistoricoSorteios();
    atualizarInfoSorteio();
    carregarListaPresenca();
    atualizarDashboard();
    alert("✓ Histórico limpo!");
  } catch (e) {
    console.error("❌ Erro ao limpar:", e);
  }
}

function exibirHistoricoSorteios() {
  const cont =
    document.querySelector("#sorteio [data-historico]") ||
    document.querySelector("#sorteio ol") ||
    document.getElementById("historico-sorteios");

  if (!cont) return;

  if (!historicoSorteios || historicoSorteios.length === 0) {
    cont.innerHTML = "<p>Nenhum sorteio realizado</p>";
    return;
  }

  let html = "<ol>";
  historicoSorteios.forEach((item) => {
    html += `<li>#${item.numero} - ${item.nome}</li>`;
  });
  html += "</ol>";

  cont.innerHTML = html;
  console.log("[SORTEIO] Histórico exibido:", historicoSorteios.length);
}

// ==================== RELATÓRIOS ====================
async function carregarRelatorios() {
  try {
    console.log("[RELATORIOS] Carregando relatórios...");
  } catch (e) {
    console.error("❌ Erro ao carregar relatórios:", e);
  }
}

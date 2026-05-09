console.log("✓ Script carregado v1003 (PREMIOS ENTREGA OK!)");

const API_URL = "/api";
let listaParticipantesCompleta = [];

document.addEventListener("DOMContentLoaded", function () {
  console.log("✓ DOM pronto");
  inicializarNavegacao();
  atualizarDashboard();
  setInterval(atualizarDashboard, 120000);
});

function inicializarNavegacao() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const pageId = this.dataset.page;
      navBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      document
        .querySelectorAll(".page")
        .forEach((p) => p.classList.remove("active"));
      const page = document.getElementById(pageId);
      if (page) page.classList.add("active");
      if (pageId === "gerenciar") carregarParticipantes();
      if (pageId === "recepcao") carregarListaPresenca();
      if (pageId === "premiacao") inicializarPremiacoes();
      if (pageId === "sorteio") inicializarSorteio();
    });
  });
}

async function atualizarDashboard() {
  try {
    const r = await fetch(API_URL + "/stats");
    const s = await r.json();
    document.getElementById("stat-presentes").textContent =
      s.total_presentes || 0;
    document.getElementById("stat-registrados").textContent =
      s.total_participantes || 0;
    document.getElementById("stat-premios").textContent = s.total_premios || 0;
    document.getElementById("stat-sorteios").textContent =
      s.total_sorteios || 0;
    const total = s.total_participantes || 1;
    const presentes = s.total_presentes || 0;
    const pct = Math.round((presentes / total) * 100);
    document.getElementById("progress-presenca").style.width = pct + "%";
    document.getElementById("progress-text").textContent =
      presentes + " / " + total + " presentes (" + pct + "%)";
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function carregarParticipantes() {
  try {
    const r = await fetch(API_URL + "/participantes");
    const lista = await r.json();
    const cont = document.getElementById("lista-participantes");
    if (!lista || lista.length === 0) {
      cont.innerHTML = "<p class='empty-state'>Nenhum participante</p>";
      return;
    }
    let html = "";
    lista.forEach((p) => {
      html += `<div class="participant-row"><div class="participant-info"><strong>#${
        p.numero
      }</strong> - ${p.nome}<div class="participant-type">${
        p.tipo || ""
      }</div></div></div>`;
    });
    cont.innerHTML = html;
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function carregarListaPresenca() {
  try {
    const r = await fetch(API_URL + "/presenca/lista");
    const lista = await r.json();
    listaParticipantesCompleta = lista;
    if (!lista || lista.length === 0) {
      document.getElementById("lista-presenca").innerHTML =
        "<p class='empty-state'>Nenhum</p>";
      return;
    }
    renderizarListaPresenca(lista);
  } catch (e) {
    console.error("Erro:", e);
  }
}

function filtrarListaPresenca() {
  const termo = document.getElementById("busca-recepcao").value.trim();
  const statusFilter = document.getElementById("filtro-status").value;
  
  let filtrados = listaParticipantesCompleta;
  
  // Filtro por status
  if (statusFilter !== "todos") {
    filtrados = filtrados.filter((p) => {
      const status = p.status_presenca || "AUSENTE";
      return status.toUpperCase() === statusFilter.toUpperCase();
    });
  }
  
  // Filtro por busca
  if (termo) {
    filtrados = filtrados.filter((p) => {
      const numero = parseInt(p.numero);
      const nome = p.nome.toLowerCase();
      const termoBusca = termo.toLowerCase();
      const termoNumerico = parseInt(termo);
      return (
        (!isNaN(termoNumerico) && numero === termoNumerico) ||
        nome.includes(termoBusca)
      );
    });
  }
  
  renderizarListaPresenca(filtrados);
}


function filtrarPorStatus() {
  filtrarListaPresenca();
}
function renderizarListaPresenca(lista) {
  const cont = document.getElementById("lista-presenca");
  let html = "";
  lista.forEach((p) => {
    const statusBD = p.status_presenca || "AUSENTE";
    const pagoBD = p.status_pago || "NAO_PAGO";
    const bg = statusBD === "PRESENTE" ? "#f0f9f9" : "#fff9f9";
    const color = statusBD === "PRESENTE" ? "#32B8C6" : "#A84B2F";
    const btnText = statusBD === "PRESENTE" ? "✗ Ausente" : "✓ Presente";
    const btnAction =
      statusBD === "PRESENTE" ? "marcarAusente" : "marcarPresenca";
    const pagoLabel = pagoBD === "PAGO" ? "✓ Pago" : "✗ Não pago";
    const statusText = statusBD === "PRESENTE" ? "✓ PRESENTE" : "✗ AUSENTE";
    html += `<div style="background: ${bg}; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${color};"><div style="display: flex; justify-content: space-between;"><div><strong>#${
      p.numero
    } - ${
      p.nome
    }</strong></div><div style="text-align: right; color: ${color}; font-weight: bold; font-size: 12px;">${statusText}</div></div><div style="display: flex; gap: 8px; margin-top: 10px;"><button class="btn btn--sm btn--primary" style="flex: 1;" onclick="${btnAction}(${
      p.id
    })">${btnText}</button><button class="btn btn--sm btn--secondary" style="flex: 1;" onclick="marcarPago(${
      p.id
    }, '${pagoBD}')">${
      pagoBD === "PAGO" ? "Não Pago" : "Pago"
    }</button></div></div>`;
  });
  cont.innerHTML = html;
}

async function marcarPresenca(participante_id) {
  try {
    const r = await fetch(API_URL + "/presenca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participante_id: participante_id,
        status: "PRESENTE",
      }),
    });
    const dados = await r.json();
    if (dados.sucesso) {
      carregarListaPresenca();
      atualizarDashboard();
    } else {
      alert("Erro: " + dados.erro);
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function marcarAusente(participante_id) {
  try {
    const r = await fetch(API_URL + "/presenca/ausente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participante_id: participante_id }),
    });
    const dados = await r.json();
    if (dados.sucesso) {
      carregarListaPresenca();
      atualizarDashboard();
    } else {
      alert("Erro: " + dados.erro);
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function marcarPago(participante_id, statusAtual) {
  try {
    const novoStatus = statusAtual === "PAGO" ? "NAO_PAGO" : "PAGO";
    const r = await fetch(API_URL + "/presenca/update-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participante_id: participante_id,
        status_pago: novoStatus,
      }),
    });
    const dados = await r.json();
    if (dados.success) carregarListaPresenca();
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function inicializarPremiacoes() {
  try {
    const r = await fetch(API_URL + "/categorias");
    const categorias = await r.json();
    const select = document.getElementById("select-categoria");
    select.innerHTML = "<option value=''>Selecione...</option>";
    if (categorias && categorias.length > 0) {
      categorias.forEach((c) => {
        select.innerHTML += `<option value='${c.id}'>${c.nome}</option>`;
      });
      select.addEventListener("change", carregarPremiosPorCategoria);
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function carregarPremiosPorCategoria() {
  try {
    const categId = document.getElementById("select-categoria").value;
    if (!categId) {
      document.getElementById("lista-premios-container").innerHTML =
        "<p class='empty-state'>Selecione</p>";
      return;
    }
    const r = await fetch(API_URL + "/premios/categoria/" + categId);
    const premios = await r.json();
    const cont = document.getElementById("lista-premios-container");
    if (!premios || premios.length === 0) {
      cont.innerHTML = "<p class='empty-state'>Nenhum</p>";
      return;
    }
    renderizarListaPremios(premios);
  } catch (e) {
    console.error("Erro:", e);
  }
}

function renderizarListaPremios(lista) {
  let html = `<table style="width: 100%; border-collapse: collapse;"><tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="padding: 10px; text-align: left;">Categoria</th><th style="padding: 10px; text-align: left;">Nome</th><th style="padding: 10px; text-align: center;">Presente</th><th style="padding: 10px; text-align: center;">Entrega</th><th style="padding: 10px; text-align: center;">Ação</th></tr>`;
  lista.forEach((premio) => {
    const nomeComNumero = `#${premio.participante_id} - ${premio.nome}`;
    const statusEntrega = premio.status_entrega || "NAO";
    const btnText = statusEntrega === "ENTREGUE" ? "✓ Reverter" : "Entregar";
    const btnStyle = statusEntrega === "ENTREGUE" ? "background: #6c757d;" : "";
    html += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">${
      premio.categoria_nome
    }</td><td style="padding: 10px;">${
      nomeComNumero
    }</td><td style="padding: 10px; text-align: center;"><span style="background: #d4edda; padding: 4px 8px; border-radius: 4px;">${
      premio.status_presente || "N/A"
    }</span></td><td style="padding: 10px; text-align: center;"><span style="background: #fff3cd; padding: 4px 8px; border-radius: 4px;">${
      statusEntrega
    }</span></td><td style="padding: 10px; text-align: center;"><button class="btn btn--sm btn--primary" style="${btnStyle}" onclick="marcarPremioEntregue(${
      premio.id
    }, '${statusEntrega}')">${btnText}</button></td></tr>`;
  });
  html += "</table>";
  document.getElementById("lista-premios-container").innerHTML = html;
}

async function marcarPremioEntregue(premio_id, statusAtual) {
  try {
    console.log("Marcando prêmio:", premio_id, "Status atual:", statusAtual);
    const novoStatus = statusAtual === "ENTREGUE" ? "NAO" : "ENTREGUE";
    const r = await fetch(API_URL + "/premios/" + premio_id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_entrega: novoStatus }),
    });
    const dados = await r.json();
    console.log("Resposta:", dados);
    if (dados.sucesso) {
      console.log("✓ Status atualizado para:", novoStatus);
      await carregarPremiosPorCategoria();
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function inicializarSorteio() {
  console.log("Sorteio");
  await atualizarStatusSorteio();
  const btnSortear = document.getElementById("btn-realizar-sorteio");
  const btnLimpar = document.getElementById("btn-limpar-sorteios");
  if (btnSortear) btnSortear.addEventListener("click", realizarSorteio);
  if (btnLimpar) btnLimpar.addEventListener("click", limparSorteios);
  await carregarHistoricoSorteios();
}

async function atualizarStatusSorteio() {
  try {
    const categoria_id = 1;
    const r1 = await fetch(
      API_URL + `/sorteio/total-disponiveis/${categoria_id}`
    );
    const disponíveis = await r1.json();
    const r2 = await fetch(API_URL + `/sorteio/historico/${categoria_id}`);
    const historico = await r2.json();
    const total = disponíveis.total || 0;
    const sorteados = historico.length || 0;
    const pct =
      total > 0 ? Math.round((sorteados / (total + sorteados)) * 100) : 0;
    const statusDiv = document.getElementById("status-sorteio");
    if (statusDiv) {
      statusDiv.innerHTML = `<div style="background: #f9f9f9; padding: 15px; border-radius: 8px;"><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><div>Disponíveis: ${total}</div><div>Sorteados: ${sorteados}</div></div><div style="background: #e0e0e0; border-radius: 6px; overflow: hidden; height: 24px;"><div style="background: #32b8c6; height: 100%; width: ${pct}%;"></div></div></div>`;
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function realizarSorteio() {
  try {
    const categoria_id = 1;
    const response = await fetch(
      API_URL + `/sorteio/categoria/${categoria_id}`
    );
    const result = await response.json();
    if (!result.sucesso) {
      alert(result.mensagem || "Sem participantes");
      return;
    }
    alert("Parabéns! #" + result.numero + " - " + result.nome);
    await atualizarStatusSorteio();
    await carregarHistoricoSorteios();
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function carregarHistoricoSorteios() {
  try {
    const categoria_id = 1;
    const r = await fetch(API_URL + `/sorteio/historico/${categoria_id}`);
    const historico = await r.json();
    const cont = document.getElementById("historico-sorteios");
    if (!historico || historico.length === 0) {
      cont.innerHTML = "<p style='text-align: center; color: #999;'>Nenhum</p>";
      return;
    }
    let html = "";
    historico.reverse().forEach((item) => {
      html += `<div style="padding: 12px; border-bottom: 1px solid #eee;"><strong>${item.numero} - ${item.nome}</strong></div>`;
    });
    cont.innerHTML = html;
  } catch (e) {
    console.error("Erro:", e);
  }
}

async function limparSorteios() {
  if (!confirm("Limpar?")) return;
  try {
    const categoria_id = 1;
    const r = await fetch(API_URL + `/sorteio/limpar/${categoria_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const result = await r.json();
    if (result.sucesso) {
      await atualizarStatusSorteio();
      await carregarHistoricoSorteios();
    }
  } catch (e) {
    console.error("Erro:", e);
  }
}

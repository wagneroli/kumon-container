document.addEventListener("DOMContentLoaded", function () {
  console.log("✓ script-categorias.js carregado");
  carregarCategorias();
});

function carregarCategorias() {
  fetch(`${API_URL}/categorias`)
    .then((res) => res.json())
    .then((data) => {
      console.log("Categorias:", data);
      const select = document.getElementById("categoria-premiacao");
      const selectSorteio = document.getElementById("categoria-sorteio");
      if (select) {
        select.innerHTML =
          '<option value="">-- Escolha uma categoria --</option>';
        data.forEach((cat) => {
          select.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
        });
      }
      if (selectSorteio) {
        selectSorteio.innerHTML =
          '<option value="">-- Escolha uma categoria --</option>';
        data.forEach((cat) => {
          selectSorteio.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
        });
      }
    })
    .catch((e) => console.error("Erro ao carregar categorias:", e));
}

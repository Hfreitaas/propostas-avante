let clientes = [];
let produtos = [];
let servicos = [];

function hojeBR() {
  return new Date().toLocaleDateString("pt-BR");
}

document.addEventListener("DOMContentLoaded", async () => {
  const dataEl = document.getElementById("dataEntrada");
  if (dataEl) dataEl.textContent = hojeBR();

  try {
    [clientes, produtos, servicos] = await Promise.all([
      apiGet("clientes"),
      apiGet("produtos"),
      apiGet("servicos"),
    ]);

    preencherClientes();
    atualizarResumo(); // inicia zerado

  } catch (e) {
    console.error(e);
    alert("Não consegui carregar dados da API/planilha.\n\n" + e.message);
  }
});

function preencherClientes() {
  const sel = document.getElementById("clienteSelect");
  if (!sel) return;

  sel.innerHTML = "";
  clientes.forEach(c => {
    const op = document.createElement("option");
    op.value = c.id;
    op.textContent = c.nome;
    sel.appendChild(op);
  });
}

function addProduto() {
  const tb = document.getElementById("produtosTbody");
  if (!tb) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><select class="pSel"></select></td>
    <td class="pDesc"></td>
    <td class="pUn"></td>
    <td><input class="pQtd" type="number" min="1" value="1"></td>
    <td class="pUnit"></td>
    <td class="pTotal"></td>
    <td><button class="x" type="button" title="Remover">×</button></td>
  `;

  const sel = tr.querySelector(".pSel");
  produtos.forEach(p => {
    const op = document.createElement("option");
    op.value = p.id;
    op.textContent = p.ncm;
    sel.appendChild(op);
  });

  const atualizar = () => {
    const id = sel.value;
    const p = produtos.find(x => String(x.id) === String(id));
    const qtd = Math.max(1, Number(tr.querySelector(".pQtd").value || 1));
    tr.querySelector(".pQtd").value = qtd;

    if (!p) return;

    tr.querySelector(".pDesc").textContent = p.descricao || "";
    tr.querySelector(".pUn").textContent = p.unidade || "";
    tr.querySelector(".pUnit").textContent = "R$ " + brMoney(p.preco);
    tr.querySelector(".pTotal").textContent = "R$ " + brMoney(parseMoney(p.preco) * qtd);

    atualizarResumo();
  };

  sel.addEventListener("change", atualizar);
  tr.querySelector(".pQtd").addEventListener("input", atualizar);
  tr.querySelector(".x").addEventListener("click", () => {
    tr.remove();
    atualizarResumo();
  });

  tb.appendChild(tr);
  atualizar();
}

function addServico() {
  const tb = document.getElementById("servicosTbody");
  if (!tb) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="sQtd" type="number" min="1" value="1"></td>
    <td><select class="sSel"></select></td>
    <td class="sUnit"></td>
    <td class="sTotal"></td>
    <td><button class="x" type="button" title="Remover">×</button></td>
  `;

  const sel = tr.querySelector(".sSel");
  servicos.forEach(s => {
    const op = document.createElement("option");
    op.value = s.id;
    op.textContent = s.descricao;
    sel.appendChild(op);
  });

  const atualizar = () => {
    const id = sel.value;
    const s = servicos.find(x => String(x.id) === String(id));
    const qtd = Math.max(1, Number(tr.querySelector(".sQtd").value || 1));
    tr.querySelector(".sQtd").value = qtd;

    if (!s) return;

    tr.querySelector(".sUnit").textContent = "R$ " + brMoney(s.preco);
    tr.querySelector(".sTotal").textContent = "R$ " + brMoney(parseMoney(s.preco) * qtd);

    atualizarResumo();
  };

  sel.addEventListener("change", atualizar);
  tr.querySelector(".sQtd").addEventListener("input", atualizar);
  tr.querySelector(".x").addEventListener("click", () => {
    tr.remove();
    atualizarResumo();
  });

  tb.appendChild(tr);
  atualizar();
}

function atualizarResumo() {
  let tp = 0;
  document.querySelectorAll("#produtosTbody tr").forEach(tr => {
    const id = tr.querySelector(".pSel")?.value;
    const p = produtos.find(x => String(x.id) === String(id));
    const qtd = Number(tr.querySelector(".pQtd")?.value || 0);
    if (p) tp += parseMoney(p.preco) * qtd;
  });

  let ts = 0;
  document.querySelectorAll("#servicosTbody tr").forEach(tr => {
    const id = tr.querySelector(".sSel")?.value;
    const s = servicos.find(x => String(x.id) === String(id));
    const qtd = Number(tr.querySelector(".sQtd")?.value || 0);
    if (s) ts += parseMoney(s.preco) * qtd;
  });

  document.getElementById("totalProdutos").textContent = brMoney(tp);
  document.getElementById("totalServicos").textContent = brMoney(ts);
  document.getElementById("totalGeral").textContent = brMoney(tp + ts);
}

async function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(14);
  pdf.text("Proposta Comercial - Avante", 14, 16);

  pdf.setFontSize(10);
  pdf.text("Data: " + hojeBR(), 14, 24);

  const clienteId = document.getElementById("clienteSelect").value;
  const c = clientes.find(x => String(x.id) === String(clienteId));
  pdf.text("Cliente: " + (c?.nome || "-"), 14, 32);

  const total = document.getElementById("totalGeral")?.textContent || "0,00";
  pdf.text("Total: R$ " + total, 14, 40);

  pdf.save("proposta_avante.pdf");
}

/* ===== Modal: Novo Cliente ===== */
function abrirNovoCliente() {
  const modal = document.getElementById("modalCliente");
  if (!modal) return alert("Modal não encontrado no index.html.");
  modal.style.display = "block";
}

function fecharNovoCliente() {
  const modal = document.getElementById("modalCliente");
  if (modal) modal.style.display = "none";
}

function limparCamposNovoCliente() {
  ["nc_nome","nc_cnpj","nc_email","nc_telefone","nc_endereco"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const vend = document.getElementById("nc_vendedor_id");
  if (vend && !vend.value) vend.value = "1";
}

async function salvarNovoCliente() {
  const dados = {
    nome: document.getElementById("nc_nome").value.trim(),
    cnpj: document.getElementById("nc_cnpj").value.trim(),
    email: document.getElementById("nc_email").value.trim(),
    telefone: document.getElementById("nc_telefone").value.trim(),
    endereco: document.getElementById("nc_endereco").value.trim(),
    vendedor_id: Number(document.getElementById("nc_vendedor_id").value || 1),
  };

  if (!dados.nome) return alert("Informe o nome do cliente.");
  if (dados.email && !dados.email.includes("@")) return alert("E-mail inválido.");

  try {
    const resp = await apiPost("clientes", dados);
    alert("Cliente salvo! ID: " + (resp?.id ?? "OK"));

    // Recarrega clientes
    clientes = await apiGet("clientes");
    preencherClientes();

    // Seleciona o novo (se vier id)
    const sel = document.getElementById("clienteSelect");
    if (resp?.id) sel.value = String(resp.id);

    fecharNovoCliente();
    limparCamposNovoCliente();
  } catch (e) {
    console.error(e);
    alert("Erro ao salvar cliente:\n\n" + e.message);
  }
}

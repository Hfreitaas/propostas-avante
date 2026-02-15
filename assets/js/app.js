let clientes = [];
let produtos = [];
let servicos = [];

function hojeBR() {
  const d = new Date();
  return d.toLocaleDateString("pt-BR");
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
  } catch (e) {
    alert("Não consegui carregar dados da API/planilha. Verifique se a API está pública.\n\n" + e.message);
    console.error(e);
  }
});

function preencherClientes() {
  const sel = document.getElementById("clienteSelect");
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
    <td><button class="x" type="button">×</button></td>
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
    const qtd = Number(tr.querySelector(".pQtd").value || 0);
    if (!p) return;
    tr.querySelector(".pDesc").textContent = p.descricao || "";
    tr.querySelector(".pUn").textContent = p.unidade || "";
    tr.querySelector(".pUnit").textContent = "R$ " + brMoney(p.preco);
    tr.querySelector(".pTotal").textContent = "R$ " + brMoney(parseMoney(p.preco) * qtd);
    atualizarResumo();
  };

  sel.addEventListener("change", atualizar);
  tr.querySelector(".pQtd").addEventListener("input", atualizar);
  tr.querySelector(".x").addEventListener("click", () => { tr.remove(); atualizarResumo(); });

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
    <td><button class="x" type="button">×</button></td>
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
    const qtd = Number(tr.querySelector(".sQtd").value || 0);
    if (!s) return;
    tr.querySelector(".sUnit").textContent = "R$ " + brMoney(s.preco);
    tr.querySelector(".sTotal").textContent = "R$ " + brMoney(parseMoney(s.preco) * qtd);
    atualizarResumo();
  };

  sel.addEventListener("change", atualizar);
  tr.querySelector(".sQtd").addEventListener("input", atualizar);
  tr.querySelector(".x").addEventListener("click", () => { tr.remove(); atualizarResumo(); });

  tb.appendChild(tr);
  atualizar();
}

function atualizarResumo() {
  let tp = 0;
  document.querySelectorAll("#produtosTbody tr").forEach(tr => {
    const id = tr.querySelector(".pSel").value;
    const p = produtos.find(x => String(x.id) === String(id));
    const qtd = Number(tr.querySelector(".pQtd").value || 0);
    if (p) tp += parseMoney(p.preco) * qtd;
  });

  let ts = 0;
  document.querySelectorAll("#servicosTbody tr").forEach(tr => {
    const id = tr.querySelector(".sSel").value;
    const s = servicos.find(x => String(x.id) === String(id));
    const qtd = Number(tr.querySelector(".sQtd").value || 0);
    if (s) ts += parseMoney(s.preco) * qtd;
  });

  const elP = document.getElementById("totalProdutos");
  const elS = document.getElementById("totalServicos");
  const elG = document.getElementById("totalGeral");
  if (elP) elP.textContent = brMoney(tp);
  if (elS) elS.textContent = brMoney(ts);
  if (elG) elG.textContent = brMoney(tp + ts);
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

  pdf.text("Total: R$ " + (document.getElementById("totalGeral")?.textContent || "0,00"), 14, 40);
  pdf.save("proposta_avante.pdf");
}

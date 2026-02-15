async function apiGet(tipo) {
  const res = await fetch(`${API_URL}?tipo=${encodeURIComponent(tipo)}`);
  if (!res.ok) throw new Error(`Erro API GET ${tipo}: ${res.status}`);
  return await res.json();
}

async function apiPost(tipo, dados) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ tipo, dados }),
  });
  if (!res.ok) throw new Error(`Erro API POST ${tipo}: ${res.status}`);
  return await res.json();
}

function brMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoney(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
